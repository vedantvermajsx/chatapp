import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/auth.service';
import { dbService } from '../services/indexedDB.service';
import keyManager from '../services/keyManager';
import { generateRsaKeyPairPem } from '../utils/crypto';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      setUser(storedUser);
      if (storedUser?._id) keyManager.loadSelfPrivateKey(storedUser._id);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const res = await authService.login({ username, password });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      if (res.privateKey) await keyManager.setSelfPrivateKey(res.user._id, res.privateKey);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (username, email, gender, password) => {
    try {
      const res = await authService.register({ username, email, gender, password });
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
    setUser(null);
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
    () => ({ user, loading, login, register, guestLogin, logout, updateUser }),
    [user, loading, login, register, guestLogin, logout, updateUser]
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
