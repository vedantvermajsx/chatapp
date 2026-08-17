import { handleNewMessage } from './emitHandlers/handleNewMessage.js';
import { handleNewPrivateMessage } from './emitHandlers/handleNewPrivateMessage.js';
import {
  handleNewRoom,
  handleRoomUpdated,
  handleRoomDeleted,
  handleUserJoinedRoom,
  handleRoomKeyNeeded,
  handleUserLeftRoom
} from './emitHandlers/handleRoomEvents.js';

const queue = [];
let workerRunning = false;

async function processItem(item) {
  const { type, data } = item;

  switch (type) {
    case 'newMessage':
      await handleNewMessage(data);
      break;
    case 'newPrivateMessage':
      await handleNewPrivateMessage(data);
      break;
    case 'newRoom':
      handleNewRoom(data);
      break;
    case 'roomUpdated':
      handleRoomUpdated(data);
      break;
    case 'roomDeleted':
      handleRoomDeleted(data);
      break;
    case 'userJoinedRoom':
      handleUserJoinedRoom(data);
      break;
    case 'roomKeyNeeded':
      handleRoomKeyNeeded(data);
      break;
    case 'userLeftRoom':
      handleUserLeftRoom(data);
      break;
    default:
      console.warn(`[emitQueue] Unknown event type: ${type}`);
  }
}

async function runWorker() {
  if (workerRunning) return;
  workerRunning = true;

  while (queue.length > 0) {
    const item = queue.shift();
    try {
      await processItem(item);
    } catch (err) {
      console.error('[emitQueue] worker error processing item:', item.type, err.message);
    }
  }

  workerRunning = false;
}

export function enqueueEmit(type, data) {
  queue.push({ type, data });
  setImmediate(runWorker);
}
