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
const ACCESS_TOKEN_TTL_SECONDS = 11 * 60;
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
const MINIMUM_REFRESH_AGE_MS = 30 * 1000;
const ACTIVITY_THROTTLE_MS = 1000;
const LAST_ACTIVITY_KEY = 'lastActivityAt';

const tokenDeadline = (token: string): number | null => {
  try {
    const encoded = token.split('.')[1]?.replaceAll('-', '+').replaceAll('_', '/');
    if (!encoded) return null;
    const payload = JSON.parse(
      window.atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='))
    ) as { exp?: number; iat?: number };
    if (typeof payload.exp !== 'number' || typeof payload.iat !== 'number') return null;
    return Math.min(payload.exp, payload.iat + ACCESS_TOKEN_TTL_SECONDS) * 1000;
  } catch {
    return null;
  }
};

const tokenIssuedAt = (token: string): number | null => {
  try {
    const encoded = token.split('.')[1]?.replaceAll('-', '+').replaceAll('_', '/');
    if (!encoded) return null;
    const payload = JSON.parse(
      window.atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='))
    ) as { iat?: number };
    return typeof payload.iat === 'number' ? payload.iat * 1000 : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedJwt = localStorage.getItem('jwt');
      const storedUser = localStorage.getItem('user');
      const deadline = storedJwt ? tokenDeadline(storedJwt) : null;
      const storedActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
      const lastActivity = Number.isFinite(storedActivity) && storedActivity > 0
        ? storedActivity
        : Date.now();
      const activityIsCurrent = Date.now() - lastActivity < INACTIVITY_TIMEOUT_MS;
      if (storedJwt && storedUser && deadline && deadline > Date.now() && activityIsCurrent) {
        setJwt(storedJwt);
        setUser(JSON.parse(storedUser) as User);
        localStorage.setItem(LAST_ACTIVITY_KEY, String(lastActivity));
      } else if (storedJwt || storedUser) {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      }
    } catch {
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((token: string, userData: User): void => {
    setJwt(token);
    setUser(userData);
    localStorage.setItem('jwt', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  }, []);

  const logout = useCallback((): void => {
    setJwt(null);
    setUser(null);
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  }, []);

  useEffect(() => {
    if (!jwt) return undefined;
    let inactivityTimer: number | undefined;
    let refreshInFlight = false;
    let lastHandledAt = 0;
    let expired = false;

    const expireSession = (): void => {
      if (expired) return;
      expired = true;
      const loginPath = localStorage.getItem('loginPath') || '/login';
      logout();
      const separator = loginPath.includes('?') ? '&' : '?';
      window.location.assign(`${loginPath}${separator}expired=1`);
    };

    const scheduleInactivityTimeout = (lastActivity: number): void => {
      if (inactivityTimer) window.clearTimeout(inactivityTimer);
      const remaining = INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivity);
      if (remaining <= 0) {
        expireSession();
        return;
      }
      inactivityTimer = window.setTimeout(expireSession, remaining);
    };

    const refreshTokenIfNeeded = async (): Promise<void> => {
      const currentToken = localStorage.getItem('jwt');
      if (!currentToken || refreshInFlight) return;
      const deadline = tokenDeadline(currentToken);
      const issuedAt = tokenIssuedAt(currentToken);
      if (!deadline || !issuedAt || deadline <= Date.now()) {
        expireSession();
        return;
      }
      if (Date.now() - issuedAt < MINIMUM_REFRESH_AGE_MS) return;
      refreshInFlight = true;
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        const payload = await response.json();
        if (!response.ok || typeof payload.jwt !== 'string') {
          expireSession();
          return;
        }
        setJwt(payload.jwt);
        localStorage.setItem('jwt', payload.jwt);
      } catch {
        expireSession();
      } finally {
        refreshInFlight = false;
      }
    };

    const recordActivity = (): void => {
      const now = Date.now();
      if (now - lastHandledAt < ACTIVITY_THROTTLE_MS) return;
      lastHandledAt = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      scheduleInactivityTimeout(now);
      void refreshTokenIfNeeded();
    };

    const handleVisibility = (): void => {
      if (document.visibilityState === 'visible') recordActivity();
    };

    const storedActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    const initialActivity = Number.isFinite(storedActivity) && storedActivity > 0
      ? storedActivity
      : Date.now();
    const deadline = tokenDeadline(jwt);
    if (!deadline || deadline <= Date.now()) {
      expireSession();
      return undefined;
    }
    scheduleInactivityTimeout(initialActivity);
    recordActivity();

    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
    ];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (inactivityTimer) window.clearTimeout(inactivityTimer);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [jwt, logout]);

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