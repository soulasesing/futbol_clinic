import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { ErrorState, LoadingState } from './AsyncStates';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || (!isAuthenticated && typeof window !== 'undefined')) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 pt-24">
        <div className="mx-auto max-w-lg"><LoadingState title="Verificando tu sesión" /></div>
      </main>
    );
  }

  if (!isAuthenticated || !user) return null;

  if (roles && !roles.includes(user.role)) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 pt-24">
        <div className="mx-auto max-w-lg">
          <ErrorState
            title="No tienes acceso"
            message="Tu perfil no tiene permisos para consultar esta sección."
            actionLabel="Volver al inicio"
            onAction={() => void router.push('/dashboard')}
          />
        </div>
      </main>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
