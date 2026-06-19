import axios from 'axios';
import { toast } from 'sonner';

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
  (error) => {
    const isOffline = !navigator.onLine;
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