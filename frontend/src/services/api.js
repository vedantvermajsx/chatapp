import axios from 'axios';
import { toast } from 'sonner';
import { wipeLocalChatData } from './logoutCleanup';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_LOAD_BALENCER_URL_,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
      if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const msg = response.data?.message;
    if (msg) toast.success(msg, { id: msg });
    return response;
  },
  async (error) => {
    const isOffline = !navigator.onLine;

    if (error.response?.status === 498) {
      // A late 498 from a request made with an old token must not log out a fresh session.
      const sent = error.config?.headers?.Authorization;
      const current = localStorage.getItem('token');
      if (!current || (sent && sent !== `Bearer ${current}`)) {
        return Promise.reject(error);
      }
      window.dispatchEvent(new Event('auth:expired'));
      // Finish the wipe before redirecting so a quick re-login can't race the DB deletion.
      await wipeLocalChatData().catch(console.error);
      toast.error('Session expired or invalid. Please log in again.');
      
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login';
      }
      return Promise.reject(error);
    }

    if (!isOffline) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Something went wrong';
      toast.error(msg, { id: msg });
    }
    return Promise.reject(error);
  }
);

export default apiClient;