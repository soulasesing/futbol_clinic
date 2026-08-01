import React, { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const TenantForgotPassword: React.FC = () => {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (slug) localStorage.setItem('loginPath', `/escuela/${slug}/login`);
  }, [slug]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), slug }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'No fue posible enviar el enlace');
      setMessage(payload.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible enviar el enlace'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4">
      <form onSubmit={(event) => void handleSubmit(event)} className="w-full max-w-md space-y-5 rounded-3xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-950">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-slate-500">Recibirás un enlace válido durante una hora.</p>
        </div>
        <label className="block text-sm font-bold text-slate-700">
          <span>Correo electrónico</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-blue-700"
          />
        </label>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        {message && <output className="block rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">{message}</output>}
        <button type="submit" disabled={loading || !slug} className="w-full rounded-xl bg-blue-800 px-4 py-3 font-black text-white disabled:opacity-60">
          {loading ? 'Enviando…' : 'Enviar enlace'}
        </button>
        {slug && (
          <Link href={`/escuela/${slug}/login`} className="block text-center text-sm font-bold text-blue-800">
            Volver al inicio de sesión
          </Link>
        )}
      </form>
    </main>
  );
};

export default TenantForgotPassword;
