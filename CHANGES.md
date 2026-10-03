# Fixes: unread counts reappearing after cache restart + wrong member counts

Deploy order: queueService -> cacheService -> backend. Then run scripts/migrate-conversationread.js once.
Set RATE_LIMIT_MAX in cacheService production env to something like 50000 (it is 500/min now).

queueService
- processors/notification/handlePrivateLastRead.js  sender/receiver were swapped vs. how cacheService reads them (main private-unread bug); forward-only update; retries on error
- processors/notification/handleRoomLastRead.js     retries on error
- processors/room/handleMemberJoined.js, handleMemberLeft.js  errors were swallowed -> now retried; readCount seed excludes system messages
- processors/message/messageProcessor.js            failed inserts were swallowed -> retried (duplicates ignored)
- models/roomMessageRead.model.js                   readCount was missing, so Mongoose silently stripped the seed
- BatchQueue.js                                     poison event blocked queue forever -> dropped after 5 attempts; drain() added
- index.js                                          drain queues on SIGTERM/SIGINT (deploys lost in-memory batches); queue names in logs
- jobs/reconcileRoomMembers.js (new)                removes deleted users / expired guests from Room.groupMembers

cacheService
- services/UnreadCacheService.js    per-user/room lock; $max persistence; clamp readCount<=total; rebuild readCount when missing; cold private increment/decrement no longer poisons the seed
- services/MessageCountCacheService.js  cold incrementRoom no longer counts DB (message not inserted yet)
- services/CacheService.js + RoomCacheService.js  member pages of every limit/search are invalidated
- middleware/rateLimiter.js         logs when it rejects cache updates

backend
- utils/hmacClient.js               retries 429 from cacheService (request was not processed, so retry is safe)

scripts/migrate-conversationread.js  one-off data fix (dry run by default)

Round 2 (chat list)
- cacheService/services/MessageCacheService.js   chat list was cached (no TTL) if rebuilt before the queue inserted the newest message -> stale last message / missing new conversation. Recently sent messages are now overlaid for 60s.
- backend/utils/emitHandlers/handleNewPrivateMessage.js  realtime payload now includes `sender` and `receiver` objects. CLIENT CHANGE NEEDED: partner = payload.senderId === me ? payload.receiver : payload.sender
