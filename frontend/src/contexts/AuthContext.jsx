import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/auth.service';
import { dbService } from '../services/indexedDB.service';
import keyManager from '../services/keyManager';
import { generateRsaKeyPairPem } from '../utils/crypto';
import { resetOfflineHandler } from '../services/offlineMessageHandler';
import userService from '../services/user.service';
import { recordBlockFrom403, clearBanCache } from '../utils/blockCache.js';

const AuthContext = createContext();

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

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const userStr = localStorage.getItem('user');
        if (userStr && userStr !== 'undefined') {
          try {
            const storedUser = JSON.parse(userStr);
            if (storedUser?._id) await dbService.ensureOwner(storedUser._id);
            setUser(storedUser);
            if (storedUser?._id) keyManager.loadSelfPrivateKey(storedUser._id);
          } catch (e) {
            console.error('Failed to restore user from localStorage:', e);
          }
        }
      }
      setLoading(false);
    })();
  }, []);

  // Ban state comes with the logged-in user's own profile (not the chat list).
  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await userService.getProfile();
        const profile = res?.user || res;
        if (cancelled || !profile) return;
        if (profile.isBanned) {
          const expiresAt = profile.banExpiresAt ?? null;
          recordBlockFrom403('banned', {
            expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
            message: 'You are banned from sending messages',
          });
          if (expiresAt) {
            const info = { expiresAt };
            setBan(info);
            localStorage.setItem('ban', JSON.stringify(info));
          }
        } else {
          clearBanCache();
          setBan(null);
          localStorage.removeItem('ban');
        }
      } catch (err) {
        console.warn('Failed to refresh ban state from profile:', err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [user?._id]);

  const login = useCallback(async (username, password) => {
    try {
      const res = await authService.login({ username, password });
      await dbService.ensureOwner(res.user._id, { wipeIfUnknown: true });
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
      await dbService.ensureOwner(res.user._id, { wipeIfUnknown: true });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
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
      await dbService.ensureOwner(res.user._id, { wipeIfUnknown: true });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      await keyManager.setSelfPrivateKey(res.user._id, privateKeyPem);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Guest login failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('ban');
    resetOfflineHandler();
    setUser(null);
    setBan(null);
    await keyManager.clear();
    try {
      await dbService.clearAllData();
    } catch (err) {
      console.error('Error clearing IndexedDB on logout:', err);
    }
  }, []);

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
