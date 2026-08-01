import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoadingState } from '../components/AsyncStates';

const LoginRedirect: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const loginPath = localStorage.getItem('loginPath') || '/';
    const next = typeof router.query.next === 'string' ? router.query.next : '';
    const separator = loginPath.includes('?') ? '&' : '?';
    const destination = next
      ? `${loginPath}${separator}next=${encodeURIComponent(next)}`
      : loginPath;
    void router.replace(destination);
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 pt-24">
      <div className="mx-auto max-w-lg">
        <LoadingState title="Redirigiendo al acceso de tu academia" />
      </div>
    </main>
  );
};

export default LoginRedirect;
