const fs = require('fs');

const replaceInFile = (file, regex, replacement) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content, 'utf8');
};

// frontend core.js
replaceInFile(
  'k:/chatnow/frontend/src/services/indexedDB/core.js',
  /export const DB_NAME[\s\S]*?;\n/g,
  ''
);
replaceInFile(
  'k:/chatnow/frontend/src/services/indexedDB/core.js',
  /export const DB_VERSION[\s\S]*?;\n/g,
  ''
);
replaceInFile(
  'k:/chatnow/frontend/src/services/indexedDB/core.js',
  /export const getMultiStore[\s\S]*?}\n/g,
  ''
);

// offlineMessageHandler.js
replaceInFile(
  'k:/chatnow/frontend/src/services/offlineMessageHandler.js',
  /export const sendPendingMessages[\s\S]*?}\n/g,
  ''
);

// constants.js
replaceInFile(
  'k:/chatnow/frontend/src/utils/constants.js',
  /export const ALL_SUPPORTED_FORMATS[\s\S]*?\];\n/g,
  ''
);

// dateUtils.js
replaceInFile(
  'k:/chatnow/frontend/src/utils/dateUtils.js',
  /export const formatLastSeenShort[\s\S]*?};\n/g,
  ''
);

// backend utils/constants.js
replaceInFile(
  'k:/chatnow/backend/utils/constants.js',
  /export const SUPPORTED_FORMATS[\s\S]*?};\n/g,
  ''
);

// backend utils/hmacClient.js
replaceInFile(
  'k:/chatnow/backend/utils/hmacClient.js',
  /export function buildSignatureHeaders[\s\S]*?}\n/g,
  ''
);

// backend utils/idGenerator.js
replaceInFile(
  'k:/chatnow/backend/utils/idGenerator.js',
  /export const generateUserId[\s\S]*?};\n/g,
  ''
);

// backend utils/messageBroker.js
replaceInFile(
  'k:/chatnow/backend/utils/messageBroker.js',
  /export function subscribe[\s\S]*?}\n/g,
  ''
);
replaceInFile(
  'k:/chatnow/backend/utils/messageBroker.js',
  /export function unsubscribe[\s\S]*?}\n/g,
  ''
);
replaceInFile(
  'k:/chatnow/backend/utils/messageBroker.js',
  /export function off[\s\S]*?}\n/g,
  ''
);

// cacheService CacheService.js
replaceInFile(
  'k:/chatnow/cacheService/services/CacheService.js',
  /export default userCache;\n/g,
  ''
);

console.log('Unused exports removed');
