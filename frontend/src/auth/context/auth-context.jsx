import React, { useState, useEffect, useCallback, createContext } from 'react';

export const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  updateUser: () => {},
});

const API_URL = 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Update user details manually
  const updateUser = useCallback((userData) => {
    setUser((prev) => {
      const updated = { ...prev, ...userData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Initialize auth state
  const initialize = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            setUser(resData.data);
            localStorage.setItem('user', JSON.stringify(resData.data));
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to initialize authentication', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initialize();

    const handleStorageChange = (event) => {
      if (event.key === 'token' && !event.newValue) {
        setUser(null);
      }
      if (event.key === 'user' && !event.newValue) {
        setUser(null);
      }
      if (event.key === 'user' && event.newValue) {
        try {
          setUser(JSON.parse(event.newValue));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initialize]);

  // Login handler
  const login = useCallback(async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const resData = await response.json();

    if (!response.ok || !resData.success) {
      throw new Error(resData.message || 'Login failed. Please try again.');
    }

    const { token, ...userData } = resData.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return resData.data;
  }, []);

  // Signup handler
  const signup = useCallback(async (name, email, password, role, phone) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, role, phone }),
    });

    const resData = await response.json();

    if (!response.ok || !resData.success) {
      throw new Error(resData.message || 'Registration failed. Please try again.');
    }

    const { token, ...userData } = resData.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return resData.data;
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
      updateUser,
    }),
    [user, loading, login, signup, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
