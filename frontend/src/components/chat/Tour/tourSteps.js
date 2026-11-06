import { Sparkles, Users, Search, Gamepad2, MessageSquare, Send, Settings } from 'lucide-react';

export const TOUR_STEPS = [
  {
    key: 'welcome',
    icon: Sparkles,
    title: 'Welcome to ChatNow',
    description: 'Here is a quick tour of how everything works. You can go back, move on, or skip at any time.',
  },
  {
    key: 'sidebar',
    target: 'sidebar',
    placement: 'right',
    icon: Users,
    title: 'Your conversations',
    description: 'Groups, direct messages and minigames all live in this column. Switch between the Chats and Explore tabs to see your chats or discover new rooms.',
  },
  {
    key: 'search',
    target: 'sidebar-search',
    placement: 'right',
    icon: Search,
    title: 'Find people and rooms',
    description: 'Search for a room by name, or type @ followed by a name to find someone and start a private chat.',
  },
  {
    key: 'minigames',
    target: 'minigames',
    placement: 'right',
    icon: Gamepad2,
    title: 'Play minigames',
    description: 'Challenge a friend to Tic-Tac-Toe, Connect Four, Gomoku and more. Pick a game to open a lobby, then share the code in any chat to invite them.',
  },
  {
    key: 'chat-area',
    target: 'chat-area',
    placement: 'bottom',
    icon: MessageSquare,
    title: 'Conversation area',
    description: 'Messages, photos, videos, voice notes, replies and reactions show up here. Choose a chat on the left to get started.',
  },
  {
    key: 'chat-input',
    target: 'chat-input',
    placement: 'top',
    icon: Send,
    title: 'Send anything',
    description: 'Type a message, attach files, record a voice note or drop a sticker. Type / to open game commands like /start-tictactoe.',
  },
  {
    key: 'footer',
    target: 'sidebar-footer',
    placement: 'right',
    icon: Settings,
    title: 'Your account',
    description: 'Open settings, switch themes, check downloads, review security or log out from here. That is everything - enjoy ChatNow!',
  },
];
