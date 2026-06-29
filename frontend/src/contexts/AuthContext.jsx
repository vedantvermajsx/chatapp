import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';
import { dbService } from '../services/indexedDB.service';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser(JSON.parse(localStorage.getItem('user')));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await authService.login({ username, password });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (username, email, gender, password, dob) => {
    try {
      const res = await authService.register({ username, email, gender, password, dob });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const guestLogin = async (username, gender, dob) => {
    try {
      const res = await authService.guestLogin({ username, gender, dob });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Guest login failed' };
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    try {
      await dbService.clearAllData();
    } catch (err) {
      console.error('Error clearing IndexedDB on logout:', err);
    }
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, guestLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
