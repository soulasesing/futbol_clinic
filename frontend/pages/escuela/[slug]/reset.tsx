import React, { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const TenantResetPassword: React.FC = () => {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const token = typeof router.query.token === 'string' ? router.query.token : '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (slug) localStorage.setItem('loginPath', `/escuela/${slug}/login`);
  }, [slug]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('El enlace no es válido');
      return;
    }
    if (password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres');
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'No fue posible actualizar la contraseña');
      await router.replace(`/escuela/${slug}/login?reset=success`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible actualizar la contraseña'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4">
      <form onSubmit={(event) => void handleSubmit(event)} className="w-full max-w-md space-y-5 rounded-3xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-950">Nueva contraseña</h1>
          <p className="mt-2 text-sm text-slate-500">Usa al menos 12 caracteres.</p>
        </div>
        <label className="block text-sm font-bold text-slate-700">
          <span>Contraseña nueva</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={12}
            autoComplete="new-password"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-blue-700"
          />
        </label>
        <label className="block text-sm font-bold text-slate-700">
          <span>Repetir contraseña</span>
          <input
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
            minLength={12}
            autoComplete="new-password"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-blue-700"
          />
        </label>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-800 px-4 py-3 font-black text-white disabled:opacity-60">
          {loading ? 'Actualizando…' : 'Guardar contraseña'}
        </button>
      </form>
    </main>
  );
};

export default TenantResetPassword;
