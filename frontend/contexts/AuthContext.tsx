import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  tenantId: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  jwt: string | null;
  login: (jwt: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {
    const storedJwt = localStorage.getItem('jwt');
    const storedUser = localStorage.getItem('user');
    if (storedJwt && storedUser) {
      setJwt(storedJwt);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (token: string, userData: User) => {
    setJwt(token);
    setUser(userData);
    localStorage.setItem('jwt', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setJwt(null);
    setUser(null);
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, jwt, login, logout, isAuthenticated: !!jwt }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}; 