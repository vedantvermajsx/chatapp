
const BASE_THEMES = [
  {
    id: 'white',
    name: 'White',
    background: '#ffffff',
    myMessageBubble: '#000000',
    myMessageText: '#ffffff',
    myUsernameColor: '#ffffff',
    otherMessageBubble: '#f0f0f0',
    otherMessageText: '#000000',
    otherUsernameColor: '#000000',
    isLight: true
  },
  {
    id: 'black',
    name: 'Black',
    background: '#000000',
    myMessageBubble: '#ffffff',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#1a1a1a',
    otherMessageText: '#ffffff',
    otherUsernameColor: '#ffffff',
    isLight: false
  },
  {
    id: 'default',
    name: 'Fresh Campus',
    background: '#f6faf7',
    myMessageBubble: '#16a34a',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#e3ede5',
    otherMessageText: '#0d1a14',
    otherUsernameColor: '#147a3a',
    isLight: true
  },
{
  id: 'monochrome-dark',
  name: 'Monochrome Dark',
  background: '#121212',
  myMessageBubble: '#f5f5f5',
  myMessageText: '#121212',
  myUsernameColor: '#121212',
  otherMessageBubble: '#2a2a2a',
  otherMessageText: '#eeeeee',
  otherUsernameColor: '#bdbdbd',
  isLight: false
},
  {
    id: 'one-dark-pro',
    name: 'One Dark Pro',
    background: '#282c34',
    myMessageBubble: '#61afef',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#3e4451',
    otherMessageText: '#abb2bf',
    otherUsernameColor: '#98c379',
    isLight: false
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    background: '#1a1b26',
    myMessageBubble: '#7aa2f7',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#24283b',
    otherMessageText: '#a9b1d6',
    otherUsernameColor: '#bb9af7',
    isLight: false
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    background: '#1e1e2e',
    myMessageBubble: '#cba6f7',
    myMessageText: '#1e1e2e',
    myUsernameColor: '#1e1e2e',
    otherMessageBubble: '#313244',
    otherMessageText: '#cdd6f4',
    otherUsernameColor: '#f5c2e7',
    isLight: false
  },
  {
    id: 'catppuccin-latte',
    name: 'Catppuccin Latte',
    background: '#eff1f5',
    myMessageBubble: '#8839ef',
    myMessageText: '#ffffff',
    myUsernameColor: '#ffffff',
    otherMessageBubble: '#dfe2e8',
    otherMessageText: '#4c4f69',
    otherUsernameColor: '#8136e3',
    isLight: true
  },
  {
    id: 'dracula',
    name: 'Dracula',
    background: '#282a36',
    myMessageBubble: '#bd93f9',
    myMessageText: '#282a36',
    myUsernameColor: '#282a36',
    otherMessageBubble: '#44475a',
    otherMessageText: '#f8f8f2',
    otherUsernameColor: '#50fa7b',
    isLight: false
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    background: '#0d1117',
    myMessageBubble: '#238636',
    myMessageText: '#ffffff',
    myUsernameColor: '#ffffff',
    otherMessageBubble: '#21262d',
    otherMessageText: '#c9d1d9',
    otherUsernameColor: '#58a6ff',
    isLight: false
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    background: '#ffffff',
    myMessageBubble: '#238636',
    myMessageText: '#ffffff',
    myUsernameColor: '#ffffff',
    otherMessageBubble: '#ecedef',
    otherMessageText: '#1f2328',
    otherUsernameColor: '#0964cf',
    isLight: true
  },
  {
    id: 'nord',
    name: 'Nord',
    background: '#2e3440',
    myMessageBubble: '#5e81ac',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#3b4252',
    otherMessageText: '#d8dee9',
    otherUsernameColor: '#88c0d0',
    isLight: false
  },
  {
    id: 'pink',
    name: 'Pink',
    background: '#fce4ec',
    myMessageBubble: '#ec407a',
    myMessageText: '#000000',
    myUsernameColor: '#ffffff',
    otherMessageBubble: '#f8bbd9',
    otherMessageText: '#880e4f',
    otherUsernameColor: '#a5144d',
    isLight: true
  },
  {
    id: 'magenta',
    name: 'Magenta',
    background: '#f3e5f5',
    myMessageBubble: '#8e24aa',
    myMessageText: '#ffffff',
    myUsernameColor: '#ffffff',
    otherMessageBubble: '#e1bee7',
    otherMessageText: '#4a148c',
    otherUsernameColor: '#7b1fa2',
    isLight: true
  },
  {
    id: 'lime-green',
    name: 'Lime Green',
    background: '#e8f5e9',
    myMessageBubble: '#32cd32',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#c8e6c9',
    otherMessageText: '#1b5e20',
    otherUsernameColor: '#2a6b2d',
    isLight: true
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    background: '#fdf2f0',
    myMessageBubble: '#d7837f',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#f5d0ce',
    otherMessageText: '#6f4241',
    otherUsernameColor: '#8e4b49',
    isLight: true
  },
  {
    id: 'blush',
    name: 'Blush',
    background: '#fff0f3',
    myMessageBubble: '#ff758f',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#ffc2d1',
    otherMessageText: '#590d22',
    otherUsernameColor: '#992e41',
    isLight: true
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    background: '#fff5f7',
    myMessageBubble: '#ff8fab',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#ffc8dd',
    otherMessageText: '#720026',
    otherUsernameColor: '#a63247',
    isLight: true
  },
  {
    id: 'peach',
    name: 'Peach',
    background: '#fff3e0',
    myMessageBubble: '#ffab91',
    myMessageText: '#4e342e',
    myUsernameColor: '#4e342e',
    otherMessageBubble: '#ffe0b2',
    otherMessageText: '#5d4037',
    otherUsernameColor: '#99533d',
    isLight: true
  },
  {
    id: 'lavender',
    name: 'Lavender',
    background: '#f3e5f5',
    myMessageBubble: '#9c27b0',
    myMessageText: '#ffffff',
    myUsernameColor: '#ffffff',
    otherMessageBubble: '#e1bee7',
    otherMessageText: '#4a148c',
    otherUsernameColor: '#7b1fa2',
    isLight: true
  },
  {
    id: 'sky-blue',
    name: 'Sky Blue',
    background: '#e0f7fa',
    myMessageBubble: '#4dd0e1',
    myMessageText: '#000000',
    myUsernameColor: '#006064',
    otherMessageBubble: '#b2ebf2',
    otherMessageText: '#006f7a',
    otherUsernameColor: '#156d78',
    isLight: true
  },
  {
    id: 'mint',
    name: 'Mint',
    background: '#e0f2f1',
    myMessageBubble: '#4db6ac',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#b2dfdb',
    otherMessageText: '#004d40',
    otherUsernameColor: '#00675c',
    isLight: true
  },
  {
    id: 'pastel-purple',
    name: 'Pastel Purple',
    background: '#ede7f6',
    myMessageBubble: '#7e57c2',
    myMessageText: '#ffffff',
    myUsernameColor: '#ffffff',
    otherMessageBubble: '#d1c4e9',
    otherMessageText: '#311b92',
    otherUsernameColor: '#5e35b1',
    isLight: true
  },
  {
    id: 'sunset',
    name: 'Sunset',
    background: '#fff8e1',
    myMessageBubble: '#ff8a65',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#ffe0b2',
    otherMessageText: '#b5330b',
    otherUsernameColor: '#b33d18',
    isLight: true
  },
  {
    id: 'coral',
    name: 'Coral',
    background: '#fff3e0',
    myMessageBubble: '#ff7043',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#ffccbc',
    otherMessageText: '#ac310b',
    otherUsernameColor: '#9f3514',
    isLight: true
  },
  {
    id: 'amber',
    name: 'Amber',
    background: '#fff8e1',
    myMessageBubble: '#f2c026',
    myMessageText: '#3e2723',
    myUsernameColor: '#3e2723',
    otherMessageBubble: '#ffe082',
    otherMessageText: '#5d4037',
    otherUsernameColor: '#805a00',
    isLight: true
  },
  {
    id: 'teal',
    name: 'Teal',
    background: '#e0f2f1',
    myMessageBubble: '#26a69a',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#b2dfdb',
    otherMessageText: '#004d40',
    otherUsernameColor: '#00675c',
    isLight: true
  },
  {
    id: 'purple-rain',
    name: 'Purple Rain',
    background: '#2d1b4e',
    myMessageBubble: '#a78bfa',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#4c3566',
    otherMessageText: '#ddd6fe',
    otherUsernameColor: '#c4b5fd',
    isLight: false
  },
  {
    id: 'midnight-pink',
    name: 'Midnight Pink',
    background: '#1a0f1f',
    myMessageBubble: '#f472b6',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#3d2644',
    otherMessageText: '#fbcfe8',
    otherUsernameColor: '#f9a8d4',
    isLight: false
  },
  {
    id: 'cotton-candy',
    name: 'Cotton Candy',
    background: '#f0f9ff',
    myMessageBubble: '#7dd3fc',
    myMessageText: '#0c4a6e',
    myUsernameColor: '#0c4a6e',
    otherMessageBubble: '#bae6fd',
    otherMessageText: '#036499',
    otherUsernameColor: '#1f6888',
    isLight: true
  },
  {
    id: 'berry',
    name: 'Berry',
    background: '#fef3c7',
    myMessageBubble: '#f43f5e',
    myMessageText: '#000000',
    myUsernameColor: '#ffffff',
    otherMessageBubble: '#fecdd3',
    otherMessageText: '#881337',
    otherUsernameColor: '#ab2c42',
    isLight: true
  },
  {
    id: 'olive',
    name: 'Olive',
    background: '#f9fbe7',
    myMessageBubble: '#aed581',
    myMessageText: '#000000',
    myUsernameColor: '#33691e',
    otherMessageBubble: '#dcedc8',
    otherMessageText: '#446f26',
    otherUsernameColor: '#4c6b29',
    isLight: true
  },
  {
    id: 'neon-pink',
    name: 'Neon Pink',
    background: '#1e1e2e',
    myMessageBubble: '#ff006e',
    myMessageText: '#000000',
    myUsernameColor: '#ffffff',
    otherMessageBubble: '#45475a',
    otherMessageText: '#f5c2e7',
    otherUsernameColor: '#ff99c5',
    isLight: false
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    background: '#e0f7fa',
    myMessageBubble: '#00bcd4',
    myMessageText: '#000000',
    myUsernameColor: '#000000',
    otherMessageBubble: '#b2ebf2',
    otherMessageText: '#006f7a',
    otherUsernameColor: '#006774',
    isLight: true
  },
  {
    id: 'discord-dark',
    name: 'Discord Dark',
    background: '#313338',
    myMessageBubble: '#5865f2',
    myMessageText: '#ffffff',
    myUsernameColor: '#ffffff',
    otherMessageBubble: '#3d3f43',
    otherMessageText: '#dbdee1',
    otherUsernameColor: '#f2f3f5',
    sidebarBg: '#2b2d31',
    isLight: false
  },
  {
    id: 'discord-midnight',
    name: 'Discord Midnight',
    background: '#2b2d31',
    myMessageBubble: '#5865f2',
    myMessageText: '#ffffff',
    myUsernameColor: '#ffffff',
    otherMessageBubble: '#37393e',
    otherMessageText: '#dbdee1',
    otherUsernameColor: '#f2f3f5',
    sidebarBg: '#1e1f22',
    isLight: false
  },
  {
    id: 'discord-light',
    name: 'Discord Light',
    background: '#f2f3f5',
    myMessageBubble: '#5865f2',
    myMessageText: '#ffffff',
    myUsernameColor: '#ffffff',
    otherMessageBubble: '#e3e5e8',
    otherMessageText: '#313338',
    otherUsernameColor: '#060607',
    sidebarBg: '#e3e5e8',
    isLight: true
  }
];

const _rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const _hex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const _lum = h => {
  const c = _rgb(h).map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const _cr = (a, b) => {
  const x = _lum(a), y = _lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const _mix = (a, b, t) => _hex(_rgb(a).map((v, i) => v + (_rgb(b)[i] - v) * t));
const _push = (c, bgs, min, dir) => {
  if (bgs.every(b => _cr(c, b) >= min)) return c;
  for (let t = 0.05; t <= 1.001; t += 0.05) {
    const n = _mix(c, dir, t);
    if (bgs.every(b => _cr(n, b) >= min)) return n;
  }
  return dir;
};


// muted: secondary text readable on background, sidebar and other bubble
export const THEMES = BASE_THEMES.map(t => {
  const dir = t.isLight ? '#000000' : '#ffffff';
  const surfaces = [t.background, t.otherMessageBubble].concat(t.sidebarBg ? [t.sidebarBg] : []);
  const muted = _push(t.isLight ? '#6b7280' : '#9ca3af', surfaces, 5.5, dir);
  const accent = t.myMessageBubble;
  const onPrimary = _cr('#ffffff', accent) >= _cr('#000000', accent) ? '#ffffff' : '#000000';
  return { ...t, muted, onPrimary };
});
