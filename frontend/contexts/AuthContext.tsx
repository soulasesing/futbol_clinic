import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

export type UserRole = 'super_admin' | 'admin' | 'coach' | 'parent';

export interface User {
  email: string;
  tenantId: string;
  role: UserRole;
  name?: string;
  foto_url?: string;
}

interface AuthContextType {
  user: User | null;
  jwt: string | null;
  login: (jwt: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedJwt = localStorage.getItem('jwt');
      const storedUser = localStorage.getItem('user');
      if (storedJwt && storedUser) {
        setJwt(storedJwt);
        setUser(JSON.parse(storedUser) as User);
      }
    } catch {
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((token: string, userData: User): void => {
    setJwt(token);
    setUser(userData);
    localStorage.setItem('jwt', token);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback((): void => {
    setJwt(null);
    setUser(null);
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    jwt,
    login,
    logout,
    isAuthenticated: !!jwt,
    isLoading,
  }), [user, jwt, login, logout, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}; 