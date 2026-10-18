import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './index.css';

if (window.__TAURI_INTERNALS__ && typeof window.fetch === 'function') {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url ?? '';
    if (url.startsWith('ipc://') || url.includes('ipc.localhost')) {
      return Promise.reject(new TypeError('IPC custom protocol disabled'));
    }
    return nativeFetch(input, init);
  };
}

window.addEventListener('vite:preloadError', () => {
  try {
    const last = Number(sessionStorage.getItem('chunk-reload-at') || 0);
    if (Date.now() - last < 10000) return;
    sessionStorage.setItem('chunk-reload-at', String(Date.now()));
  } catch { /* storage blocked: fall through to a single reload */ }
  window.location.reload();
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
