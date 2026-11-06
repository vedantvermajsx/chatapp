import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/auth.service';
import { useQueryClient } from '@tanstack/react-query';
import { allowDB } from '../services/indexedDB/core.js';
import { wipeLocalChatData } from '../services/logoutCleanup';
import { resetOfflineHandler } from '../services/offlineMessageHandler';
import keyManager from '../services/keyManager';
import { generateRsaKeyPairPem } from '../utils/crypto';

const AuthContext = createContext();

// New accounts (and guests) get the onboarding tour the first time they land in the chat.
const tourKey = (id) => `tour_pending_${id}`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ban, setBan] = useState(() => {
    try {
      const raw = localStorage.getItem('ban');
      return raw && raw !== 'undefined' ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined') {
        try {
          const storedUser = JSON.parse(userStr);
          setUser(storedUser);
          if (storedUser?._id) keyManager.loadSelfPrivateKey(storedUser._id);
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e);
        }
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const res = await authService.login({ username, password });
      allowDB();
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      const banInfo = res.ban?.expiresAt ? res.ban : null;
      setBan(banInfo);
      if (banInfo) localStorage.setItem('ban', JSON.stringify(banInfo));
      else localStorage.removeItem('ban');
      if (res.privateKey) await keyManager.setSelfPrivateKey(res.user._id, res.privateKey);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (username, email, gender, password) => {
    try {
      const res = await authService.register({ username, email, gender, password });
      allowDB();
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      localStorage.setItem(tourKey(res.user._id), '1');
      if (res.privateKey) await keyManager.setSelfPrivateKey(res.user._id, res.privateKey);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  }, []);

  const guestLogin = useCallback(async (username, gender) => {
    try {
      const { publicKeyPem, privateKeyPem } = await generateRsaKeyPairPem();
      const res = await authService.guestLogin({ username, gender, publicKey: publicKeyPem });
      allowDB();
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      localStorage.setItem(tourKey(res.user._id), '1');
      await keyManager.setSelfPrivateKey(res.user._id, privateKeyPem);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Guest login failed' };
    }
  }, []);

  // Signing out removes every trace of the chats from this device: messages, rooms, private
  // chats, unread counts, pending uploads, encryption keys, downloaded attachments, cached
  // queries and any notifications still showing.
  const logout = useCallback(async () => {
    // Tell the server first (needs the token); never let a slow/offline server block the wipe.
    try {
      await Promise.race([authService.logout(), new Promise((r) => setTimeout(r, 3000))]);
    } catch { /* ignore */ }
    resetOfflineHandler();
    setUser(null);
    setBan(null);
    await wipeLocalChatData({ queryClient });
  }, [queryClient]);

  // Server says the session is dead (HTTP 498): same result as a logout.
  useEffect(() => {
    const onExpired = () => {
      resetOfflineHandler();
      setUser(null);
      setBan(null);
      try { queryClient.clear(); } catch { /* ignore */ }
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [queryClient]);

  const updateUser = useCallback((userData) => {
    setUser((prev) => {
      const merged = { ...prev, ...userData };
      if (prev?.publicKey && !userData?.publicKey) {
        merged.publicKey = prev.publicKey;
      }
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = useMemo(
    () => ({ user, ban, loading, login, register, guestLogin, logout, updateUser }),
    [user, ban, loading, login, register, guestLogin, logout, updateUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
