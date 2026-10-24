
# ChatNow

A modern, scalable real-time chat application with support for rooms, private messaging, media, and more!

## Features

- **Public & Private Rooms**: Create or join chat rooms
- **Private Messaging (DM)**: One-on-one conversations
- **Media Support**: Send images, videos, and files
- **Stickers & Emojis**: Enhance conversations with stickers and emojis
- **Real-time Notifications**: Unread message badges and desktop notifications
- **Presence**: See when users are online
- **Authentication**: Email/password login, guest access
- **Responsive UI**: Works seamlessly on desktop, tablet, and mobile
- **Search**: Search for users and rooms
- **Room Settings**: Manage room members, admins, and settings

## Tech Stack

### Backend
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&amp;logo=node.js&amp;logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Socket.IO](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&amp;logo=socket.io&amp;logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&amp;logo=mongodb&amp;logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge)

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&amp;logo=react&amp;logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&amp;logo=vite&amp;logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&amp;logo=tailwind-css&amp;logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&amp;logo=socket.io&amp;logoColor=white)
![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&amp;logo=react-query&amp;logoColor=white)

### Microservices
- **Cache Service**: In-memory caching (trie, bloom filters, maps) for fast room and user lookups
- **Queue Service**: Asynchronous message persistence to MongoDB via batching
- **Message Broker**: Cross-service communication using WebSockets
- **Load Balancer**: Distributes traffic across multiple backend instances

## Project Structure

```
chatnow/
├── backend/              # Main chat backend
│   ├── controllers/      # Route handlers
│   ├── database/         # DB models and connections
│   ├── emitters/         # Event emitters
│   ├── events/           # Socket event handlers
│   ├── middleware/       # Express middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── utils/            # Utilities (broker, emit queue, etc.)
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API and socket services
│   │   ├── handlers/     # Event handlers
│   │   └── utils/        # Utilities
├── cacheService/         # In-memory cache service
├── queueService/         # Batch persistence queue
├── messagebroker/        # Cross-service message broker
└── loadBalancer/         # Load balancer
```

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- MongoDB (local or Atlas)

### Installation &amp; Setup

1. Clone and install dependencies:

```bash
git clone &lt;repo-url&gt;
cd chatnow
npm install
cd frontend; npm install; cd ..
cd backend;  npm install; cd ..
cd cacheService; npm install; cd ..
cd queueService; npm install; cd ..
cd messagebroker; npm install; cd ..
cd loadBalancer; npm install; cd ..
```

2. Configure environment variables for each service. Create `.env` files in each service directory:

**backend/.env**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatnow
JWT_SECRET=your-jwt-secret
CACHE_SERVICE_URL=http://localhost:3000
BROKER_URL=ws://localhost:4000
```

**cacheService/.env**
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/chatnow
HMAC_SECRET=your-hmac-secret
ALLOWED_ORIGINS=http://localhost:5174
```

**queueService/.env**
```
PORT=6000
MONGODB_URI=mongodb://localhost:27017/chatnow
BROKER_URL=ws://localhost:4000
```

**messagebroker/.env**
```
PORT=4000
```

**loadBalancer/.env**
```
PORT=8080
```

**frontend/.env**
```
VITE_API_URL=http://localhost:8080/api
VITE_SOCKET_URL=http://localhost:8080
```

3. Start all services (from project root):

```bash
# Start services in separate terminals
# Terminal 1: Message Broker
cd messagebroker &amp;&amp; npm start

# Terminal 2: Cache Service
cd cacheService &amp;&amp; npm start

# Terminal 3: Queue Service
cd queueService &amp;&amp; npm start

# Terminal 4: Backend (or multiple instances for load balancing)
cd backend &amp;&amp; npm start

# Terminal 5: Load Balancer
cd loadBalancer &amp;&amp; npm start

# Terminal 6: Frontend
cd frontend &amp;&amp; npm run dev
```

4. Visit the frontend at `http://localhost:5174`!

## License

ISC
