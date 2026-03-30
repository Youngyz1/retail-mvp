import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if expired
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          // Attempt to get fresh user data
          authApi.me()
            .then(res => {
              setUser({ ...res.data, token });
            })
            .catch(() => {
              // If API fails (e.g. backend down or token invalid), fallback to decoded or logout
              logout();
            })
            .finally(() => setLoading(false));
          return;
        }
      } catch (err) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token, role, fullName } = res.data;
    localStorage.setItem('token', token);
    setUser({ email, role, fullName, token });
    return res.data;
  };

  const externalLogin = async (provider, tokenStr) => {
    const res = await authApi.externalLogin({ provider, token: tokenStr });
    const { token, role, fullName, email } = res.data;
    localStorage.setItem('token', token);
    setUser({ email, role, fullName, token });
    return res.data;
  };

  const register = async (email, password, fullName) => {
    const res = await authApi.register({ email, password, fullName });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, externalLogin, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
