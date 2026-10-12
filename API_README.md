# ChatNow API Documentation & Architecture Guide

A comprehensive guide to the **ChatNow** REST APIs, real-time Socket.IO events, microservices architecture, and end-to-end encryption (E2EE) data pipeline.

---

## Table of Contents

1. [Architecture Overview & System Design](#1-architecture-overview--system-design)
2. [Security, Authentication & Cryptography](#2-security-authentication--cryptography)
   - [Authentication (JWT & Cookies)](#authentication-jwt--cookies)
   - [End-to-End Encryption (RSA-2048 + AES-256-GCM)](#end-to-end-encryption-rsa-2048--aes-256-gcm)
   - [Rate Limiting & Protection](#rate-limiting--protection)
3. [REST API Reference](#3-rest-api-reference)
   - [Health & System](#health--system)
   - [Authentication API (`/api/auth`)](#authentication-api-apiauth)
   - [Users API (`/api/users`)](#users-api-apiusers)
   - [Rooms API (`/api/rooms`)](#rooms-api-apirooms)
   - [Messages API (`/api/messages`)](#messages-api-apimessages)
   - [Media & Stickers API (`/api/media`)](#media--stickers-api-apimedia)
   - [Interactive Games & Mini-Games](#interactive-games--mini-games)
4. [Real-Time WebSocket / Socket.IO Protocol](#4-real-time-websocket--socketio-protocol)
   - [Connection & Authentication](#socket-connection--authentication)
   - [Client-to-Server Events](#client-to-server-events)
   - [Server-to-Client Events](#server-to-client-events)
   - [WebRTC Signaling for Voice/Video](#webrtc-signaling-for-voicevideo)
   - [Mini-Games & Chess Socket Channels](#mini-games--chess-socket-channels)
5. [Microservices & Background Message Pipeline](#5-microservices--background-message-pipeline)
   - [Cache Service (In-Memory, Trie & Bloom Filter)](#cache-service)
   - [Message Broker (Inter-Service WebSocket Pub/Sub)](#message-broker)
   - [Queue Service (Asynchronous Batch MongoDB Persistence)](#queue-service)
   - [Load Balancer & Health Management](#load-balancer)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Error Handling & HTTP Status Codes](#7-error-handling--http-status-codes)

---

## 1. Architecture Overview & System Design

ChatNow uses a decoupled, event-driven microservices architecture optimized for ultra-low chat latency and horizontal scaling.

```
                      +-----------------------------+
                      |         Web Client          |
                      |   (React / Vite Frontend)   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |    Reverse Proxy / LB       |
                      |    (Port 8080 / 4000)       |
                      +--------------+--------------+
                                     |
              +----------------------+----------------------+
              |                                             |
              v                                             v
+---------------------------+                 +---------------------------+
|    Backend Worker 1       |                 |    Backend Worker 2       |
|    Express + Socket.IO    |                 |    Express + Socket.IO    |
+-------------+-------------+                 +-------------+-------------+
              |                                             |
              +----------------------+----------------------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
         v                           v                           v
+------------------+       +-------------------+       +--------------------+
|  Cache Service   |       |  Message Broker   |       |   Queue Service    |
|   (Port 3000)    |       |    (Port 4000)    |       |    (Port 6000)     |
| Trie / Bloom /   |       |  WebSocket PubSub |       | Batch Mongo Writes |
|  In-Memory Maps  |       +---------+---------+       +---------+----------+
+------------------+                                             |
          |                                                      |
          |                     +-----------------+              |
          +-------------------->| MongoDB Cluster |<-------------+
                                +-----------------+
```

### Key Components

- **Client App (Port 5173)**: React SPA with live Socket.IO connection and React Query caching.
- **Load Balancer (Port 8080 / 4000)**: Distributes HTTP and WebSocket traffic across backend server instances with automated health checks (`/health`) and request queuing (`LoadBalancerQueue`).
- **Main Backend (Port 3001/5000)**: Express.js REST API and Socket.IO server for stateful chat connections.
- **Cache Service (Port 3000)**: Fast sub-millisecond in-memory cache utilizing:
  - **Bloom Filters**: Instant $O(1)$ probabilistic checks for username and email availability without hitting MongoDB.
  - **Trie Indexing**: Prefix-tree instant search for users.
  - **In-Memory Hash Maps**: User presence, unread message counts, room memberships, and read receipts.
  - **HMAC Signatures**: Inter-service request authentication.
- **Message Broker (Port 4000 / 4444)**: Native WebSocket hub that relays pub/sub events across multiple backend nodes to synchronize user presence, cross-instance chat messages, and background queue jobs.
- **Queue Service (Port 6000)**: Batches write operations (`message.created`, `user.registered`, etc.) in memory and flushes them in bulk to MongoDB, shielding the database from write spikes.

---

## 2. Security, Authentication & Cryptography

### Authentication (JWT & Cookies)

- **Token Format**: Signed JSON Web Token (`JWT_SECRET`) containing:
  ```json
  {
    "_id": "660c1d...",
    "username": "alice",
    "avatar": "https://...",
    "gender": 1,
    "role": "user",
    "isOnline": true,
    "lastSeen": "2026-10-12T15:00:00.000Z",
    "isGuest": false,
    "exp": 1791823200
  }
  ```
- **Token Delivery**:
  - Automatically attached as an `httpOnly`, `sameSite: "strict"` (or `"none"` in production), `secure` cookie named `token`.
  - Alternatively supported via HTTP header: `Authorization: Bearer <token>`.
- **Session Duration**:
  - Registered User: **7 days**.
  - Guest User: **24 hours**.

### End-to-End Encryption (RSA-2048 + AES-256-GCM)

ChatNow implements client/server assisted End-to-End Encryption (E2EE):

1. **User Keypair Generation**:
   - On registration or guest creation, an **RSA-2048** keypair is generated (SPKI PEM public key, PKCS#8 PEM private key).
   - The **public key** is stored in the database and cached for peers to fetch.
   - The **private key** is encrypted at rest using **AES-256-GCM** with a key derived from the user's password via `scrypt` (16-byte random salt, 32-byte derived key). The encrypted private key and salt are stored in MongoDB, ensuring only the user with their password can decrypt it.
2. **Direct Messages (1-to-1 DMs)**:
   - Client generates an ephemeral symmetric key (`AES-256-GCM`) with an initialization vector (`iv`).
   - The message body is encrypted with this symmetric key.
   - The symmetric key is encrypted (wrapped) twice:
     - `senderKeyWrapped`: Encrypted with sender's public RSA key.
     - `receiverKeyWrapped`: Encrypted with recipient's public RSA key.
3. **Room / Group Messages**:
   - Each group room has a shared symmetric room key.
   - Message payloads are encrypted using AES-GCM with a unique `iv` and `wrappedKey`.
   - When a new member joins, `roomKeyNeeded` socket event triggers existing members/admin to re-wrap and distribute the room key to the newcomer's public RSA key.

### Rate Limiting & Protection

All rate limiters use standard HTTP headers (`Retry-After`, `RateLimit-*`):

| Scope | Path / Type | Window | Max Requests | Response on Breach |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth/*` | 5 minutes | 20 req | `429 Too many requests` |
| **Messaging** | `/api/messages/*` | 1 minute | 100 req | `429 Too many messaging requests` |
| **Upload Signature** | `/api/messages/upload-signature` | 30 seconds | 10 req | `429 Slow down, you are uploading a lot of files` |
| **Games** | `/start-chess`, `/start-minigame` | 1 minute | 200 req | `429 Too many requests` |
| **Global** | All remaining endpoints | 15 minutes | 200 req | `429 Too many requests` |

---

## 3. REST API Reference

Base URL (Local): `http://localhost:3001` or through Load Balancer `http://localhost:8080/api`  
Base URL (Production): `https://hushline-loadbalancer-service.onrender.com/api`

---

### Health & System

#### `GET /health`
Verifies server health and responsiveness for load balancers.
- **Auth**: None
- **Response** (`200 OK`):
  ```json
  { "ok": true }
  ```

---

### Authentication API (`/api/auth`)

#### 1. Check Username Availability
`GET /api/auth/check-username`

Fast availability check using cache Bloom filter before signup.

- **Query Parameters**:
  - `username` (string, required): 2-30 characters, alphanumeric and underscores.
- **Responses**:
  - `200 OK`:
    ```json
    { "isTaken": false }
    ```
  - `400 Bad Request`:
    ```json
    { "message": "Username must be 2–30 characters", "isValid": false }
    ```

---

#### 2. Register New User
`POST /api/auth/register`

Creates a registered account, generates an RSA-2048 E2EE keypair, encrypts the private key with the user's password, seeds the cache, and asynchronously enqueues user creation.

- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "username": "janedoe",
    "email": "jane@example.com",
    "password": "SecretPassword123",
    "gender": 1,
    "avatar": "https://res.cloudinary.com/.../avatar.png",
    "bio": "Software engineer & open-source enthusiast"
  }
  ```
  - `gender`: `0` (Other/Unspecified), `1` (Male), `2` (Female)
  - `password`: 6 to 50 characters
- **Responses**:
  - `201 Created` (sets `token` cookie):
    ```json
    {
      "token": "eyJhbGciOi...",
      "user": {
        "_id": "660c1d...",
        "username": "janedoe",
        "email": "jane@example.com",
        "avatar": "https://...",
        "gender": 1,
        "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----\n",
        "role": "user",
        "isOnline": true,
        "lastSeen": "2026-10-12T15:00:00.000Z"
      },
      "privateKey": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n"
    }
    ```
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: Username or email already taken.

---

#### 3. Login
`POST /api/auth/login`

Authenticates credentials, decrypts the stored E2EE private key with the provided password, and sets session cookie.

- **Request Body**:
  ```json
  {
    "username": "janedoe",
    "password": "SecretPassword123"
  }
  ```
- **Responses**:
  - `201 Created` (sets `token` cookie):
    ```json
    {
      "token": "eyJhbGciOi...",
      "user": {
        "_id": "660c1d...",
        "username": "janedoe",
        "email": "jane@example.com",
        "avatar": "https://...",
        "gender": 1,
        "publicKey": "-----BEGIN PUBLIC KEY-----...",
        "role": "user",
        "isOnline": true,
        "lastSeen": "2026-10-12T15:00:00.000Z"
      },
      "privateKey": "-----BEGIN PRIVATE KEY-----..."
    }
    ```
  - `401 Unauthorized`: `{ "message": "Invalid credentials" }`

---

#### 4. Guest Login
`POST /api/auth/guest`

Enables instant, passwordless guest login with limited lifespan (24 hours).

- **Request Body**:
  ```json
  {
    "username": "guest_hunter99",
    "gender": 0,
    "publicKey": "-----BEGIN PUBLIC KEY-----... (optional)"
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "token": "eyJhbGciOi...",
      "user": {
        "_id": "guest_1791823...",
        "username": "guest_hunter99",
        "avatar": "https://...",
        "gender": 0,
        "publicKey": null,
        "role": "guest",
        "isOnline": true,
        "lastSeen": "2026-10-12T15:00:00.000Z"
      }
    }
    ```
  - `400 Bad Request`: Invalid username or gender format.

---

#### 5. Logout
`POST /api/auth/logout`

Clears authentication cookie and terminates session.

- **Responses**:
  - `200 OK`:
    ```json
    { "message": "Logged out" }
    ```

---

### Users API (`/api/users`)

All endpoints in this group require authentication via Cookie or `Authorization: Bearer <token>`.

#### 1. Get Current User Profile
`GET /api/users/profile`

- **Responses**:
  - `200 OK`:
    ```json
    {
      "message": "User fetched successfully",
      "user": {
        "_id": "660c1d...",
        "username": "janedoe",
        "avatar": "https://...",
        "gender": 1,
        "age": 25,
        "bio": "Building real-time apps",
        "isOnline": true,
        "lastSeen": "2026-10-12T15:00:00.000Z",
        "publicKey": "-----BEGIN PUBLIC KEY-----..."
      }
    }
    ```

---

#### 2. Update Profile
`PUT /api/users/profile`

Allows updating username, bio, and avatar. If username is updated, cache/bloom filters are synced and a fresh JWT is issued.

- **Request Body**:
  ```json
  {
    "username": "jane_doe_updated",
    "bio": "Updated bio text",
    "avatar": "https://res.cloudinary.com/..."
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "message": "Profile updated",
      "user": {
        "_id": "660c1d...",
        "username": "jane_doe_updated",
        "avatar": "https://...",
        "role": "user",
        "bio": "Updated bio text",
        "publicKey": "..."
      },
      "token": "eyJhbGci..."
    }
    ```
  - `409 Conflict`: Username already in use.

---

#### 3. Search Users
`GET /api/users/search`

Prefix matching via Trie in Cache Service.

- **Query Parameters**:
  - `q` (string, required): Search term (max 30 characters).
  - `limit` (integer, optional): Default `5`, Max `20`.
- **Responses**:
  - `200 OK`:
    ```json
    [
      {
        "_id": "660c1d...",
        "username": "janedoe",
        "avatar": "https://...",
        "gender": 1,
        "isOnline": true
      }
    ]
    ```

---

#### 4. Get User Activity Status
`GET /api/users/activity-status?userId=660c1d...`

- **Query Parameters**: `userId` (string, required)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "lastSeen": "2026-10-12T15:00:00.000Z",
        "isOnline": true
      }
    }
    ```

---

#### 5. Register Device Token (Push Notifications)
`POST /api/users/device-token`

Registers mobile/web FCM push tokens for background notifications.

- **Request Body**:
  ```json
  {
    "token": "fcm_token_xyz_12345",
    "platform": "android"
  }
  ```
  - `platform`: `"android"` or `"ios"` (defaults to `"android"`)
- **Responses**:
  - `200 OK`: `{ "success": true }`

---

#### 6. Remove Device Token
`DELETE /api/users/device-token`

- **Request Body**:
  ```json
  { "token": "fcm_token_xyz_12345" }
  ```
- **Responses**:
  - `200 OK`: `{ "success": true }`

---

#### 7. Get Public Profile of Another User
`GET /api/users/:userId/profile`

Fetches user info and their public RSA key to establish E2EE direct messaging.

- **Responses**:
  - `200 OK`:
    ```json
    {
      "message": "User fetched successfully",
      "user": {
        "pfp": "https://...",
        "username": "janedoe",
        "bio": "Hello there!",
        "gender": 1,
        "publicKey": "-----BEGIN PUBLIC KEY-----..."
      }
    }
    ```
  - `404 Not Found`: `{ "message": "User not found" }`

---

#### 8. Delete Account
`DELETE /api/users/:userId`

- **Authorization**: User deleting their own account or `admin` role.
- **Responses**:
  - `200 OK`: `{ "message": "User deleted" }`
  - `403 Forbidden`: Attempting to delete another user's account.

---

### Rooms API (`/api/rooms`)

All room routes require authentication.

#### 1. List Public Rooms
`GET /api/rooms`

- **Query Parameters**:
  - `search` (string, optional): Search keyword for room names.
  - `skip` (integer, optional): Default `0`.
  - `limit` (integer, optional): Default `20`, Max `50`.
- **Responses**:
  - `200 OK`:
    ```json
    {
      "rooms": [
        {
          "_id": "660c2e...",
          "groupName": "Design Team",
          "groupDescription": "Discussion on UI/UX mockups",
          "groupPic": "https://...",
          "groupAdmin": "660c1d...",
          "memberCount": 8
        }
      ],
      "total": 1,
      "skip": 0,
      "limit": 20,
      "hasMore": false
    }
    ```

---

#### 2. Get Joined Rooms
`GET /api/rooms/joined`

Retrieves all rooms the authenticated user has joined.

- **Responses**:
  - `200 OK`:
    ```json
    {
      "data": [
        {
          "_id": "660c2e...",
          "groupName": "Design Team",
          "groupPic": "https://...",
          "groupDescription": "UI/UX channel"
        }
      ],
      "hasMore": false
    }
    ```

---

#### 3. Get Unread Counts
`GET /api/rooms/unread`

Fetches unread counters across all joined rooms and private DMs for the authenticated user.

- **Responses**:
  - `200 OK`:
    ```json
    {
      "room_660c2e...": 3,
      "private_660c99...": 1
    }
    ```

---

#### 4. Create Room
`POST /api/rooms/create`

Creates a new group room with E2EE keys.

- **Request Body**:
  ```json
  {
    "groupName": "FullStack Developers",
    "groupDescription": "Room for Node.js and React developers",
    "publicKey": "room_public_key_pem",
    "privateKey": "room_encrypted_key"
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "message": "Room created successfully",
      "room": {
        "_id": "660c3f...",
        "groupAdmin": "660c1d...",
        "groupName": "FullStack Developers",
        "groupDescription": "Room for Node.js and React developers",
        "groupPic": "https://res.cloudinary.com/...",
        "groupMembers": ["660c1d..."],
        "publicKey": "room_public_key_pem",
        "createdAt": "2026-10-12T15:00:00.000Z"
      }
    }
    ```
  - `409 Conflict`: Room name already exists.

---

#### 5. Join Room
`POST /api/rooms/join`

Adds user to the room, triggers system join notification, seeds unread counter, and triggers `roomKeyNeeded` socket broadcast.

- **Request Body**:
  ```json
  { "roomId": "660c3f..." }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "message": "Joined room successfully",
      "room": {
        "_id": "660c3f...",
        "groupName": "FullStack Developers"
      }
    }
    ```
  - `404 Not Found`: Room does not exist.

---

#### 6. Leave Room
`POST /api/rooms/leave`

Removes the user from the room and emits `userLeftRoom` socket event. Room admins cannot leave unless the room is deleted or ownership transferred.

- **Request Body**:
  ```json
  { "roomId": "660c3f..." }
  ```
- **Responses**:
  - `200 OK`: `{ "message": "Left room successfully" }`
  - `403 Forbidden`: Admins cannot leave their own active room.

---

#### 7. Get Room Members
`GET /api/rooms/:roomId/members`

- **Query Parameters**:
  - `skip` (integer, optional): Default `0`.
  - `limit` (integer, optional): Default `20`, Max `50`.
  - `search` (string, optional): Member username filter.
- **Responses**:
  - `200 OK`:
    ```json
    {
      "members": [
        {
          "userId": "660c1d...",
          "username": "janedoe",
          "avatar": "https://...",
          "role": "admin",
          "isOnline": true
        }
      ],
      "total": 1,
      "hasMore": false
    }
    ```

---

#### 8. Update Room
`PUT /api/rooms/:roomId`

Update room name, description, or group image (Group Admin only).

- **Request Body**:
  ```json
  {
    "groupName": "Backend Engineers",
    "groupDescription": "System design & APIs",
    "groupPic": "https://res.cloudinary.com/..."
  }
  ```
- **Responses**:
  - `200 OK`: `{ "message": "Room updated successfully", "room": { ... } }`
  - `403 Forbidden`: User is not the room admin.

---

#### 9. Delete Room
`DELETE /api/rooms/:roomId`

Marks room as deleted in cache, sends system deletion message to members, and enqueues hard deletion in queue worker.

- **Responses**:
  - `200 OK`: `{ "message": "Room deleted" }`
  - `403 Forbidden`: Only room admin can delete room.
  - `410 Gone`: Room is already deleted.

---

### Messages API (`/api/messages`)

All messaging endpoints require authentication.

#### 1. Send Room Message
`POST /api/messages/send`

Sends a message into a chat room. Messages are sanitized for XSS, persisted asynchronously, appended to message cache, and broadcast via Socket.IO.

- **Request Body**:
  ```json
  {
    "roomId": "660c3f...",
    "message": "Hello everyone!",
    "media": {
      "url": "https://res.cloudinary.com/.../photo.jpg",
      "type": "image",
      "size": 102400
    },
    "replyTo": "660c88...",
    "taggedUser": "660c1d...",
    "iv": "a1b2c3d4e5f6...",
    "wrappedKey": "encrypted_symmetric_key_base64..."
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "_id": "660cf1...",
      "roomId": "660c3f...",
      "senderId": "660c1d...",
      "content": "Hello everyone!",
      "iv": "a1b2c3d4e5f6...",
      "wrappedKey": "encrypted_symmetric_key_base64...",
      "timestamp": "2026-10-12T15:05:00.000Z",
      "media": { "url": "..." },
      "replyTo": { "_id": "660c88...", "text": "Hi" }
    }
    ```
  - `400 Bad Request`: `roomId` missing.

---

#### 2. Send Private Message (DM)
`POST /api/messages/private/send`

Sends an End-to-End Encrypted 1-to-1 direct message.

- **Request Body**:
  ```json
  {
    "receiverId": "660c99...",
    "content": "Encrypted ciphertext payload",
    "iv": "12_byte_hex_iv",
    "senderKeyWrapped": "base64_rsa_encrypted_key_for_sender",
    "receiverKeyWrapped": "base64_rsa_encrypted_key_for_receiver",
    "media": null,
    "replyTo": null,
    "taggedUser": null
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "_id": "660cf2...",
      "senderId": "660c1d...",
      "receiverId": "660c99...",
      "content": "Encrypted ciphertext payload",
      "iv": "12_byte_hex_iv",
      "senderKeyWrapped": "...",
      "receiverKeyWrapped": "...",
      "status": "sent",
      "timestamp": "2026-10-12T15:06:00.000Z"
    }
    ```
  - `400 Bad Request`: Cannot send message to yourself or missing `receiverId`.

---

#### 3. Get Room Messages
`GET /api/messages/room/:roomId`

Fetches paginated room messages and automatically clears unread counter for current user.

- **Query Parameters**:
  - `limit` (integer, optional): Default `20`.
  - `before` (string, ISO timestamp / messageId, optional): Cursor for older messages.
  - `after` (string, ISO timestamp / messageId, optional): Cursor for newer messages.
- **Responses**:
  - `200 OK`:
    ```json
    {
      "messages": [
        {
          "_id": "660cf1...",
          "text": "Hello everyone!",
          "iv": "a1b2...",
          "wrappedKey": "...",
          "isOwn": false,
          "senderId": "660c1d...",
          "username": "janedoe",
          "avatar": "https://...",
          "gender": 1,
          "timestamp": "2026-10-12T15:05:00.000Z",
          "media": null,
          "replyTo": null
        }
      ],
      "hasMore": false,
      "unreadCount": 0
    }
    ```

---

#### 4. Get Private Messages (DM Conversation)
`GET /api/messages/private/:otherUserId`

Fetches direct conversation message history along with recipient's read receipt status.

- **Query Parameters**:
  - `limit` (integer, optional): Default `20`.
  - `before` (string, optional): For scroll-up historical pagination.
  - `after` (string, optional): For newer messages.
- **Responses**:
  - `200 OK`:
    ```json
    {
      "messages": [
        {
          "_id": "660cf2...",
          "senderId": "660c1d...",
          "receiverId": "660c99...",
          "username": "janedoe",
          "avatar": "https://...",
          "text": "Encrypted ciphertext",
          "iv": "...",
          "senderKeyWrapped": "...",
          "receiverKeyWrapped": "...",
          "isOwn": true,
          "timestamp": "2026-10-12T15:06:00.000Z"
        }
      ],
      "hasMore": false,
      "lastRead": {
        "messageId": "660cf2...",
        "seenAt": "2026-10-12T15:07:00.000Z"
      },
      "unreadCount": 0
    }
    ```

---

#### 5. List Private Chats
`GET /api/messages/private`

Returns list of all active 1-to-1 conversations with the other user's profile and last message preview.

- **Responses**:
  - `200 OK`:
    ```json
    [
      {
        "otherUser": {
          "_id": "660c99...",
          "username": "bob",
          "avatar": "https://...",
          "gender": 1,
          "isOnline": true,
          "lastSeen": "2026-10-12T15:10:00.000Z"
        },
        "lastMessage": {
          "_id": "660cf2...",
          "senderId": "660c1d...",
          "receiverId": "660c99...",
          "content": "...",
          "timestamp": "2026-10-12T15:06:00.000Z"
        }
      }
    ]
    ```

---

#### 6. Delete / Hide Private Chat
`DELETE /api/messages/private/:otherUserId`

Hides the private conversation for the requesting user (`deletedFor` array update in MongoDB and cache invalidation).

- **Responses**:
  - `200 OK`: `{ "message": "Chat removed successfully" }`

---

#### 7. Get Last Read Status
`GET /api/messages/private/:otherUserId/last-seen`

Returns recipient's latest read receipt timestamp and message ID.

- **Responses**:
  - `200 OK`:
    ```json
    {
      "lastRead": {
        "messageId": "660cf2...",
        "seenAt": "2026-10-12T15:07:00.000Z"
      }
    }
    ```

---

#### 8. Generate Cloudinary Upload Signature
`GET /api/messages/upload-signature`

Generates pre-signed cryptographic parameters allowing clients to upload images/videos directly to Cloudinary without streaming heavy files through the backend.

- **Query Parameters**:
  - `folder` (string, optional): `"avatar"` or `"data"` (default `"data"`).
- **Responses**:
  - `200 OK`:
    ```json
    {
      "signature": "3b68f9a2...",
      "timestamp": 1791823500,
      "folder": "data",
      "api_key": "cloudinary_key_123",
      "cloud_name": "dfxi4ihfs"
    }
    ```

---

### Media & Stickers API (`/api/media`)

#### 1. Trending Stickers or GIFs
`GET /api/media/:type/trending`

Proxies Klipy API to fetch trending animated stickers and GIFs.

- **Path Parameters**:
  - `type` (string, required): `"stickers"` or `"gifs"`.
- **Query Parameters**:
  - `page` (integer, optional): Default `1`.
  - `per_page` (integer, optional): Default `12`, Max `50`.

---

#### 2. Search Stickers or GIFs
`GET /api/media/:type/search`

- **Path Parameters**:
  - `type`: `"stickers"` or `"gifs"`.
- **Query Parameters**:
  - `q` (string, required): Search query.
  - `page` (integer, optional): Default `1`.
  - `per_page` (integer, optional): Default `12`.

---

### Interactive Games & Mini-Games

ChatNow integrates embedded real-time multiplayer games.

#### 1. Chess Web Interface
`GET /start-chess`
- Serves embedded HTML5 Chess game with CSP frame-ancestors headers enabling `<iframe>` embedding within chat panels.
- Dedicated static assets served under `/games/chess/*`.

#### 2. Mini-Games Interface
`GET /start-minigame`
- **Query Parameters**:
  - `game`: `"tictactoe"`, `"connect4"`, or `"rps"`.
  - `embed`: `1`.
  - `name`: Player display name.
  - `join`: Game room ID.
  - `rounds`: `3` or `5`.

#### 3. Available Games List
`GET /games/minigames/games.json`
- Returns metadata for all supported mini-games.

---

## 4. Real-Time WebSocket / Socket.IO Protocol

ChatNow establishes a full-duplex Socket.IO connection for instant messaging, presence, typing indicators, read receipts, and WebRTC signaling.

### Socket Connection & Authentication

Connect to the Socket.IO server:
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:8080", {
  transports: ["websocket", "polling"],
  withCredentials: true,
  auth: {
    token: "Bearer <token>" // optional if cookie is sent
  }
});
```

During handshake, `socketAuthMiddleware` validates the JWT token and binds the authenticated user model to `socket.user`.

---

### Client-to-Server Events

| Event Name | Payload Format | Description |
| :--- | :--- | :--- |
| `join` | `{ userId: "660c1d..." }` | Joins user's private notification channel. |
| `joinRoom` | `{ roomId: "660c3f..." }` | Subscribes socket to room broadcast room. |
| `leaveRoom` | `{ roomId: "660c3f..." }` | Unsubscribes socket from room. |
| `typing` | `{ roomId?: "660c...", receiverId?: "660c..." }` | Broadcasts "User is typing..." indicator. |
| `stopTyping` | `{ roomId?: "660c...", receiverId?: "660c..." }` | Clears typing indicator. |
| `markRead` | `{ otherUserId: "660c...", messageId: "660c..." }` | Acknowledges read receipt for direct message. |
| `markRoomRead` | `{ roomId: "660c..." }` | Resets unread badge counter for a room. |
| `clearActiveRoom`| *(none)* | Tells server user switched away from current chat. |
| `webrtcSignal` | `{ to: "660c...", signal: { ... } }` | Transmits SDP offers, answers, ICE candidates. |

---

### Server-to-Client Events

| Event Name | Payload Preview | Description |
| :--- | :--- | :--- |
| `newMessage` | `{ _id, roomId, userId, username, text, iv, wrappedKey, timestamp }` | Delivered to all active members of a room. |
| `newPrivateMessage` | `{ _id, senderId, receiverId, content, iv, senderKeyWrapped, receiverKeyWrapped }` | Direct message delivered to sender & recipient. |
| `newRoom` | `{ _id, groupName, groupDescription, groupPic }` | Emitted when a new public room is created. |
| `roomUpdated` | `{ _id, groupName, groupDescription, groupPic }` | Emitted on room settings update. |
| `roomDeleted` | `{ roomId: "660c3f..." }` | Emitted when room is destroyed by admin. |
| `userJoinedRoom` | `{ roomId, userId, username, avatar }` | Broadcast to room members when someone joins. |
| `userLeftRoom` | `{ roomId, userId, username, avatar }` | Broadcast to room members when someone leaves. |
| `roomKeyNeeded` | `{ roomId, joiningUser: { userId, publicKey } }` | Signals peers to wrap & send room symmetric key. |
| `activityStatus` | `{ userId, isOnline, lastSeen }` | Emitted on user connect/disconnect. |
| `typing` | `{ userId, username, roomId?: "...", isPrivate?: true }` | Displays live typing animation in UI. |
| `stopTyping` | `{ userId, roomId?: "...", isPrivate?: true }` | Hides typing indicator. |
| `readReceipt` | `{ readerId, messageId, seenAt }` | Triggers blue double-ticks in 1-to-1 chat. |

---

### WebRTC Signaling for Voice/Video

ChatNow enables peer-to-peer audio and video calling through Socket.IO signaling:

1. Caller emits `webrtcSignal` with SDP Offer:
   ```json
   {
     "to": "target_user_id",
     "signal": { "type": "offer", "sdp": "v=0..." }
   }
   ```
2. Callee receives `webrtcSignal`, creates SDP Answer, and emits:
   ```json
   {
     "to": "caller_user_id",
     "signal": { "type": "answer", "sdp": "v=0..." }
   }
   ```
3. Both peers exchange ICE candidates over `webrtcSignal` to establish direct P2P mesh connection.

---

### Mini-Games & Chess Socket Channels

- **Chess Channel**: Handles moves (`chess:move`), game state replication, player clocks, and win/draw/resign notifications.
- **Minigames Channel**: Coordinates turns, board states, scores, and rematch requests for Tic-Tac-Toe, Connect 4, and Rock-Paper-Scissors.

---

## 5. Microservices & Background Message Pipeline

### Cache Service
- **Port**: `3000` (Local) / Custom URL (Production)
- **Security**: Inter-service HMAC token headers validated against `HMAC_SECRET`.
- **Responsibilities**:
  1. **Bloom Filter**: In-memory bloom filter loaded at boot with all database usernames and emails. Prevents costly MongoDB lookups on signup checks.
  2. **Trie Search**: Prefix index for instant user autocomplete (`searchUsers`).
  3. **Unread Badges**: Increments and resets unread counters in RAM.
  4. **Last Read Tracking**: Tracks latest read message ID and timestamp per conversation.

---

### Message Broker
- **Port**: `4000` / `4444`
- **Protocol**: Lightweight WebSocket protocol.
- **Topics**:
  - `message.created`: Dispatched when any chat message is sent.
  - `user.registered`: Dispatched when a new user finishes registration.
  - `guest.registered`: Dispatched on guest session start.
  - `room.created`: Dispatched on new room setup.
  - `room.deleted`: Dispatched on room removal.
  - `room.member.joined`: Dispatched on member join.
  - `room.member.left`: Dispatched on member exit.

---

### Queue Service
- **Port**: `6000`
- **Batch Processing (`BatchQueue`)**:
  - Collects write events from Message Broker into memory arrays.
  - Flushes in batches (e.g., every 500ms or 100 items) using MongoDB `insertMany` / `bulkWrite`.
  - Greatly reduces MongoDB connection overhead and enables handling thousands of concurrent messages per second.

---

### Load Balancer
- **Port**: `8080` (Local) / `4000`
- **Features**:
  - Round-robin / Least-connection request routing across backend workers.
  - Active health checks hitting `/health` on all registered servers.
  - WebSocket upgrade forwarding with sticky sessions for Socket.IO clients.

---

## 6. Environment Variables Reference

### Backend (`backend/.env`)

```ini
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/chatnow
JWT_SECRET=your_super_secret_jwt_key
CACHE_SERVICE_ROOT_URL=http://localhost:3000
BROKER_URL=ws://localhost:4000
KEY_ENCRYPTION_SECRET=your_32_byte_aes_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
AUTH_RATE_LIMIT_WINDOW_MS=300000
AUTH_RATE_LIMIT_MAX=20
MESSAGE_RATE_LIMIT_WINDOW_MS=60000
MESSAGE_RATE_LIMIT_MAX=100
UPLOAD_RATE_LIMIT_WINDOW_MS=30000
UPLOAD_RATE_LIMIT_MAX=10

# Klipy
KLIPY_API_KEY=your_klipy_api_key
```

### Cache Service (`cacheService/.env`)

```ini
PORT=3000
MONGODB_URI=mongodb://localhost:27017/chatnow
HMAC_SECRET=your_shared_hmac_secret
ALLOWED_ORIGINS=http://localhost:5173
```

### Queue Service (`queueService/.env`)

```ini
PORT=6000
MONGODB_URI=mongodb://localhost:27017/chatnow
BROKER_URL=ws://localhost:4000
```

### Message Broker (`messagebroker/.env`)

```ini
PORT=4000
```

### Load Balancer (`loadBalancer/.env`)

```ini
PORT=8080
SERVERS=http://localhost:3001,http://localhost:3002
```

---

## 7. Error Handling & HTTP Status Codes

| Status Code | Meaning | Example Scenario |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Profile fetched, rooms returned |
| `201 Created` | Resource created | User registered, message sent, room created |
| `400 Bad Request` | Missing or invalid parameters | Invalid username format, missing required body fields |
| `401 Unauthorized` | Missing token or invalid credentials | Wrong password, unauthenticated protected route |
| `403 Forbidden` | Access denied | Non-admin trying to delete room or update settings |
| `404 Not Found` | Resource does not exist | Invalid user ID or room ID |
| `409 Conflict` | Unique constraint violation | Username or email already registered |
| `410 Gone` | Resource deleted | Attempting actions on an already-deleted room |
| `429 Too Many Requests` | Rate limit breached | Exceeding 20 auth calls / 5 min or 100 messages / min |
| `498 Invalid Token` | JWT expired or corrupt | Cookie token signature verification failure |
| `500 Internal Server Error` | Unhandled backend exception | Database connection drop or syntax error |
| `502 Bad Gateway` | Upstream service failure | Third-party Klipy API failure |
| `503 Service Unavailable` | Microservice dependency offline | Cache service unreachable during critical operation |

---

*Documentation maintained for ChatNow. Built with Node.js, Express, Socket.IO, MongoDB, and Redis/In-Memory Cache.*
