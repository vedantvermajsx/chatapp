export const PROFANITY_LIMIT = 10;

const BAD_WORDS = [
  'fuck', 'fucker', 'fucking', 'motherfucker', 'shit', 'bullshit', 'bitch', 'bastard',
  'asshole', 'dick', 'dickhead', 'cunt', 'slut', 'whore', 'piss', 'prick', 'wanker',
  'twat', 'douche', 'douchebag', 'cock', 'pussy', 'nigger', 'nigga', 'faggot',
  // Hinglish
  'madarchod', 'maderchod', 'bhenchod', 'behenchod', 'bhosdike', 'bhosdika', 'chutiya',
  'chutiye', 'gandu', 'gaand', 'harami', 'haramzada', 'randi', 'lund', 'lauda', 'loda',
  'bhosda',
];

const LEET = {
  a: '[a@4]', b: '[b8]', e: '[e3]', g: '[g9]', i: '[i1!|]', l: '[l1|]',
  o: '[o0]', s: '[s$5]', t: '[t7+]', u: '[uv]',
};

function wordToPattern(word) {
  return word
    .split('')
    .map((ch) => `${LEET[ch] || ch}+`)
    .join('[\\s._\\-*]{0,1}');
}

const PATTERN = new RegExp(
  `(?<![a-z0-9])(?:${[...BAD_WORDS].sort((a, b) => b.length - a.length).map(wordToPattern).join('|')})(?:s|es|ed|ing)?(?![a-z0-9])`,
  'gi'
);

export function maskProfanity(text) {
  if (!text) return { text: text || '', count: 0 };
  let count = 0;
  const masked = String(text).replace(PATTERN, (m) => {
    count += 1;
    return '*'.repeat(m.length);
  });
  return { text: masked, count };
}

// ── per-user counter (persisted so a refresh doesn't reset it) ──
const key = (userId) => `profanity_count_${userId}`;

export function getProfanityCount(userId) {
  if (!userId) return 0;
  try {
    return parseInt(localStorage.getItem(key(userId)) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function addProfanityCount(userId, n) {
  if (!userId || !n) return getProfanityCount(userId);
  const total = getProfanityCount(userId) + n;
  try {
    localStorage.setItem(key(userId), String(total));
  } catch { /* storage unavailable */ }
  return total;
}

export function isProfanityBlocked(userId) {
  return getProfanityCount(userId) > PROFANITY_LIMIT;
}

export const PROFANITY_BLOCK_MESSAGE =
  'You have used too much inappropriate language, so messaging and calling are disabled for your account.';
