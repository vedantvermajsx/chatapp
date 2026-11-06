# GatherUp — Frontend Feature & Component Map

> Purpose: a complete inventory of **every user-facing feature** in the frontend and **which component(s) implement it**, so the UI can be redesigned without losing any functionality.
> Source: derived by reading the actual source in `src/`. No features are listed that do not exist in code.

**Stack:** React 18 + Vite, React Router v7 (HashRouter), Socket.IO client, TailwindCSS + DaisyUI, Radix UI primitives, Framer Motion, Firebase (push), sonner (toasts), IndexedDB (offline cache).

**Routes** (`src/App.jsx`):

| Path | Screen | Guard |
|---|---|---|
| `/` | `RootRedirect` → `/chat` or `/login` | — |
| `/login` | `components/auth/Login.jsx` (tabbed: login / guest / register) | — |
| `/terms` | `components/auth/TermsAndConditions.jsx` | — |
| `/cookie-policy` | `components/auth/CookiePolicy.jsx` | — |
| `/chat` | `components/Chat.jsx` | `routes/ProtectedRoute.jsx` |
| `/admin/*` | `components/admin/AdminDashboard.jsx` | `routes/ProtectedRoute.jsx` |
| `*` | `components/common/NotFound.jsx` | — |

Global mounts in `App.jsx`: `Toaster` (sonner), `PushBridge`, `BanBanner`, `CookieConsent`, `PageLoader` (Suspense fallback), `ChunkErrorBoundary`, and providers `AuthProvider` → `ThemeProvider` → `DownloadsProvider`.

---

## 1. App Shell & Routing — 6 features

| Feature | Component(s) |
|---|---|
| Application router & route transitions | `src/App.jsx` (`AnimatedRoutes`, `route-fade-in`) |
| Auth guard / redirect to login | `src/routes/ProtectedRoute.jsx` |
| Root redirect based on session | `src/App.jsx` (`RootRedirect`) |
| Idle route prefetch (perf) | `src/App.jsx` (`IdlePrefetch`) |
| Chunk-load error boundary + reload | `src/App.jsx` (`ChunkErrorBoundary`) |
| Global toast host | `src/App.jsx` (`Toaster` from sonner) |

---

## 2. Auth — 5 features

| Feature | Component(s) | Service |
|---|---|---|
| Login (email/username + password) | `src/components/auth/LoginForm.jsx` (host: `Login.jsx`) | `auth.service.login()` |
| Registration | `src/components/auth/RegisterForm.jsx` (host: `Login.jsx`) | `auth.service.checkUsername()`, `register()` |
| Guest login | `src/components/auth/GuestForm.jsx` (host: `Login.jsx`) | `auth.service.checkUsername()`, `guestLogin()` |
| Auth shell w/ tab switching + Aurora bg | `src/components/auth/Login.jsx` + `react-bits/AuroraBackground.jsx` | — |
| Legal pages | `src/components/auth/TermsAndConditions.jsx`, `src/components/auth/CookiePolicy.jsx` | — |

---

## 3. Landing — 2 features

| Feature | Component(s) |
|---|---|
| Landing page (hero + showcase, fade-in sections) | `src/components/landing/LandingPage.jsx` + `react-bits/FadeIn.jsx` |
| Reusable video hero / showcase player | `src/components/react-bits/VideoHero.jsx`, `VideoShowcase.jsx` |

---

## 4. Chat — main screen

Root orchestrator: **`src/components/Chat.jsx`** wires `useChatState`, `useChatSocket`, `CallProvider`, `ChessWindow`, `MinigameWindow`, and read-receipt logic. Layout: `RoomSidebar` (left) + `ChatArea` (right).

### 4.1 Sidebar — 11 features

| Feature | Component(s) |
|---|---|
| Sidebar shell (responsive drawer) | `src/components/chat/Sidebar/RoomSidebar.jsx` |
| Joined rooms list & selection | `Sidebar/RoomList.jsx`, `Sidebar/Room.jsx` |
| Private chats (DM) list & selection | `Sidebar/PrivateChatList.jsx`, `Sidebar/PrivateChat.jsx` |
| Global room explore/search | `Sidebar/GlobalRoomList.jsx` |
| User search (start a DM) | `Sidebar/UserSearchRow.jsx` |
| Sidebar search input | `Sidebar/SidebarSearch.jsx` |
| Create-room entry point | `Modals/CreateRoomForm.jsx` |
| Sidebar header (current user) | `Sidebar/SidebarHeader.jsx` |
| Sidebar footer (settings / logout) | `Sidebar/SidebarFooter.jsx` |
| Theme picker | `Sidebar/ThemePicker.jsx` + `contexts/ThemeContext.jsx` |
| Unread badges | `Sidebar/Room.jsx`, `Sidebar/PrivateChat.jsx` (`unreadCounts`) |

### 4.2 Chat area & header — 12 features

| Feature | Component(s) |
|---|---|
| Chat area container / layout switch | `src/components/chat/ChatArea.jsx` |
| Chat header (room + DM variants) | `src/components/chat/ChatHeader.jsx` |
| Voice/video call buttons | `ChatHeader.jsx` + `contexts/CallContext.jsx` |
| Members panel toggle | `ChatHeader.jsx` → `Members/MembersPanel.jsx` |
| Group settings (admin) entry | `ChatHeader.jsx` → `Modals/GroupSettingsModal.jsx` |
| Leave / delete room | `ChatHeader.jsx` + `Chat.jsx` (`handleLeaveRoom`) |
| User profile modal | `Modals/UserProfileModal.jsx` |
| Back-to-list (mobile) | `ChatArea.jsx` / `ChatHeader.jsx` (`onToggleSidebar`) |
| Read receipts (DM + room) | `Chat.jsx` (`handleChatRead` → `markRead` / `markRoomRead`) |
| Visibility-aware read / clear-active-room | `Chat.jsx` (`visibilitychange` effect) |
| New-messages banner | `ChatArea.jsx` (`newMsgCount`) |
| Message pagination (older / newer) + jump-to-present + scroll restore | `ChatArea.jsx`, `Message/MessageList.jsx` |

### 4.3 Messages — 12 features

| Feature | Component(s) |
|---|---|
| Message list | `src/components/chat/Message/MessageList.jsx` |
| Message bubble + action menu (copy/report) | `Message/Message.jsx` |
| Text content / linkify | `Message/TextContent.jsx` |
| Media (image/video/attachment) | `Message/MediaContent.jsx` |
| Audio / voice message player | `Message/AudioPlayer.jsx` |
| Sticker message | `Message/StickerMessage.jsx` |
| System messages | `Message/SystemMessage.jsx` |
| Swipe-to-reply | `Message/SwipeToReply.jsx` |
| Reply / quoted message + jump-to-reply | `Message/Message.jsx`, `ChatArea.jsx` |
| Typing indicator | `Message/TypingIndicator.jsx` |
| Date separators & consecutive grouping | `Message/MessageList.jsx` + `utils/dateUtils.js` |
| Upload progress loader | `Message/ProgressLoader.jsx` |

### 4.4 Composer — 10 features

| Feature | Component(s) |
|---|---|
| Text input + send | `src/components/chat/ChatInput/ChatInput.jsx` |
| Character limit (1000) | `ChatInput.jsx` |
| File/media attach + preview | `ChatInput/ChatInput.jsx`, `ChatInput/ChatMediaPreview.jsx` |
| Sticker picker | `ChatInput/StickerPicker.jsx` |
| Voice recorder | `ChatInput/ChatVoiceRecorder.jsx` |
| @mention dropdown | `ChatInput/MentionDropdown.jsx` |
| Reply preview | `ChatInput.jsx` (`replyingTo`) |
| Typing emit | `ChatInput.jsx` |
| Paste & drag-drop files | `ChatInput.jsx` (`handlePaste`, `handleDrop`) |
| Slash commands (`/games`, `/start-chess`, `/start-*`) | `Chat.jsx` + `utils/minigames.js` |

### 4.5 Members — 7 features

| Feature | Component(s) |
|---|---|
| Members panel (list, search, load-more) | `src/components/chat/Members/MembersPanel.jsx` |
| Member row + online/offline status | `Members/Member.jsx` |
| Loading skeleton | `Members/MemberSkeleton.jsx` |
| Admin action row | `Members/Admin.jsx` |
| Block / unblock room member (admin) | `Members/MembersPanel.jsx` (room user block APIs) |
| Start DM from member | `MembersPanel.jsx` → `startPrivateChat` |
| Gender/role labelling | `utils/genderLabel.js` |

### 4.6 Modals — 9 features

| Feature | Component(s) |
|---|---|
| User profile | `src/components/chat/Modals/UserProfileModal.jsx` |
| Group settings | `Modals/GroupSettingsModal.jsx` |
| Create room form | `Modals/CreateRoomForm.jsx` |
| User settings | `Modals/UserSettingsModal.jsx` |
| Report message | `Modals/ReportMessageModal.jsx` |
| Image zoom / preview | `Modals/ImageZoomModal.jsx` |
| Downloads manager | `Modals/DownloadsModal.jsx` + `contexts/DownloadsContext.jsx` |
| Blocked users list | `Modals/BlockedUsersList.jsx` |
| Security policy | `Modals/SecurityPolicyModal.jsx` |

### 4.7 Calls (WebRTC) — 7 features

| Feature | Component(s) |
|---|---|
| Call overlay host | `src/components/chat/Call/CallOverlay.jsx` |
| Incoming call screen (accept/reject) | `Call/IncomingCallScreen.jsx` |
| Active call screen | `Call/ActiveCallScreen.jsx` |
| Call controls (mute / video / screen-share / end) | `Call/CallControls.jsx` |
| Video stream layout | `Call/CallContent.jsx` |
| Minimized floating call | `Call/MinimizedView.jsx` |
| Error / failed-call screen | `Call/CallErrorScreen.jsx` |
| *Engine:* | `hooks/useWebRTC.js`, `contexts/CallContext.jsx` |

### 4.8 Games — 3 features (1 chess + 1 minigame window + 6 minigames inside)

| Feature | Component(s) |
|---|---|
| Chess (fullscreen / windowed / minimized / draggable iframe, invite-code) | `src/components/chat/Chess/ChessWindow.jsx` |
| Minigame window (same window mechanics, iframe) | `src/components/chat/Minigames/MinigameWindow.jsx` |
| Games catalogue: **Tic-Tac-Toe, Connect Four, Gomoku, Reversi, Dots & Boxes, Rock-Paper-Scissors** | `src/utils/minigames.js` (`MINIGAMES`, `MINIGAME_COMMANDS`, `inviteText`, `parseInvite`) |

Opened via `window` events `open-chess` / `open-minigame`, or slash commands; invites posted into the active chat by `Chat.jsx`.

---

## 5. Admin Dashboard — 25 features

Shell: `src/components/admin/AdminDashboard.jsx` → `AdminLayout.jsx` (`AdminNav.jsx` + `tabs.js`). Service layer: `src/services/admin.service.js`.

### Overview tab (`/admin`) — 8

| Feature | Component(s) |
|---|---|
| Overview page | `admin/pages/OverviewPage.jsx` |
| KPI stat cards | `admin/StatCard.jsx` |
| Line charts (registrations / messages / guests) | `admin/LineChart.jsx` |
| Retention bars (DAU/WAU/MAU) | `admin/RetentionBars.jsx` |
| Gender demographics | `admin/GenderBars.jsx` |
| Leaderboards (top rooms by members / messages) | `admin/Leaderboard.jsx` |
| Section wrapper | `admin/Panel.jsx` |
| Manual refresh | `OverviewPage.jsx` |

### Users tab (`/admin/users`) — 4

| Feature | Component(s) |
|---|---|
| Users table (search + pagination) | `admin/pages/UsersPage.jsx` + `admin/EntityTable.jsx` + `admin/DataTable.jsx` |
| User detail | `admin/UserDetailModal.jsx` |
| Block user (with duration) | `admin/BlockUserModal.jsx` |
| Inline block from detail | `UserDetailModal.jsx` |

### Guests tab (`/admin/guests`) — 4

| Feature | Component(s) |
|---|---|
| Guests table (search + pagination) | `admin/pages/GuestsPage.jsx` + `EntityTable.jsx` + `DataTable.jsx` |
| Guest detail | `admin/UserDetailModal.jsx` |
| Block guest | `admin/BlockUserModal.jsx` |
| Row/avatar actions | `DataTable.jsx` |

### Rooms tab (`/admin/rooms`) — 3

| Feature | Component(s) |
|---|---|
| Rooms table (search + pagination) | `admin/pages/RoomsPage.jsx` + `EntityTable.jsx` + `DataTable.jsx` |
| Room columns (room / admin / members / created) | `DataTable.jsx` |
| Room detail | `admin/DataTable.jsx` |

### Reports tab (`/admin/reports`) — 4

| Feature | Component(s) |
|---|---|
| Reports page + status tabs (open / actioned / dismissed) | `admin/pages/ReportsPage.jsx` + `admin/ReportsPanel.jsx` |
| Report list + pagination | `ReportsPanel.jsx` |
| Report moderation (ban with duration) | `admin/ModerateReportModal.jsx` |
| Dismiss report | `ModerateReportModal.jsx` |

### Bans tab (`/admin/bans`) — 2

| Feature | Component(s) |
|---|---|
| Active bans list | `admin/pages/BansPage.jsx` + `admin/BansPanel.jsx` |
| Unban | `BansPanel.jsx` |

**Admin service functions** (`admin.service.js`): `getOverview`, `getUsers`, `getGuests`, `getUserDetail`, `getRooms`, `getReports`, `dismissReport`, `banUser`, `unbanUser`, `getBans`.

---

## 6. Common / Shared — 9 features

| Feature | Component(s) |
|---|---|
| Avatar (with online dot) | `src/components/common/Avatar.jsx` |
| Ban banner (reason + expiry) | `src/components/common/BanBanner.jsx` + `AuthContext` |
| Cookie consent banner | `src/components/common/CookieConsent.jsx` |
| Full-screen page loader | `src/components/common/PageLoader.jsx` |
| Inline loader (ring/dots/bars) | `src/components/common/Loader.jsx` |
| Sized spinner wrapper | `src/components/common/Spinner.jsx` |
| 404 page (+ ASCII background) | `src/components/common/NotFound.jsx`, `common/AsciiField.jsx` |
| FCM foreground bridge | `src/components/common/PushBridge.jsx` + `services/push.service.js` |
| Toast notifications | `sonner` via `App.jsx` |

---

## 7. UI Primitives — 6

`src/components/ui/` — `button.jsx` (CVA variants), `card.jsx`, `checkbox.jsx`, `input.jsx`, `label.jsx`, `tabs.jsx` (Radix-based).

## 8. Animation (react-bits) — 4

`src/components/react-bits/` — `AuroraBackground.jsx`, `FadeIn.jsx`, `VideoHero.jsx`, `VideoShowcase.jsx`.

---

## 9. Cross-cutting infrastructure (not UI, but wiring for any redesign)

| Concern | File(s) |
|---|---|
| Auth state | `contexts/AuthContext.jsx` |
| Theme / appearance (neumorphism) | `contexts/ThemeContext.jsx`, `contexts/THEMES.js`, `hooks/useNeumorphism.js`, `hooks/useReducedMotion.js` |
| Call state | `contexts/CallContext.jsx`, `hooks/useWebRTC.js` |
| Downloads (native/browser save) | `contexts/DownloadsContext.jsx` |
| Chat state aggregator | `hooks/useChatState.js` |
| Socket events | `hooks/useChatSocket.js` |
| Notifications | `hooks/useNotifications.js`, `services/push.service.js` |
| Handlers (room / private / message) | `handlers/**` |
| Offline cache | `services/indexedDB/**`, `services/indexedDB.service.js` |
| API + domain services | `services/api.js`, `auth.service.js`, `user.service.js`, `room.service.js`, `message.service.js`, `report.service.js`, `admin.service.js`, `keyManager.js`, `uploadCancel.js`, `offlineMessageHandler.js`, `pendingMessageView.js` |
| Utils | `utils/**` (crypto, profanity, blockCache, mergeCollections, minigames, validation, formatting, etc.) |

---

## 10. Feature count summary

| Area | Features |
|---|---|
| App shell & routing | 6 |
| Auth | 5 |
| Landing | 2 |
| Chat — Sidebar | 11 |
| Chat — Area & Header | 12 |
| Chat — Messages | 12 |
| Chat — Composer | 10 |
| Chat — Members | 7 |
| Chat — Modals | 9 |
| Chat — Calls | 7 |
| Chat — Games | 3 (chess + window + 6-minigame catalogue) |
| Admin dashboard | 25 |
| Common / shared | 9 |
| UI primitives | 6 |
| Animations (react-bits) | 4 |
| **Total distinct user-facing features** | **~128** |

### Redesign hotspots
- **Chat shell** (`Chat.jsx` + `ChatArea.jsx` + `RoomSidebar.jsx`) is the largest surface and owns most cross-component wiring — redesign it first, then propagate theme tokens via `ThemeContext`.
- **Admin** is already componentized (page → panel/table → modal); only visual tokens need to change.
- **Games & Calls** render in isolated overlays (`ChessWindow`, `MinigameWindow`, `CallOverlay`) — safe to restyle independently.
- **Shared primitives** (`ui/`, `common/`) control most visual consistency; restyling them cascades broadly.
