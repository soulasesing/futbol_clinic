import React, { FormEvent, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const decodeJwtPayload = (token: string): Record<string, string> => {
  const encoded = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
  return JSON.parse(window.atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')));
};

const formValue = (form: FormData, field: string): string => {
  const value = form.get(field);
  return typeof value === 'string' ? value : '';
};

const SuperAdminLogin: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = formValue(form, 'email').trim().toLowerCase();
    try {
      setSubmitting(true);
      setError('');
      const response = await fetch('/api/auth/super-admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: formValue(form, 'password') }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'No fue posible iniciar sesión');
      const jwtPayload = decodeJwtPayload(payload.jwt);
      login(payload.jwt, {
        email,
        tenantId: jwtPayload.tenantId || '',
        role: 'super_admin',
      });
      await router.push('/dashboard');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head><title>Administración global | Futbol Clinic</title></Head>
      <main className="grid min-h-screen place-items-center bg-slate-950 px-4">
        <form onSubmit={(event) => void handleSubmit(event)} className="w-full max-w-sm space-y-5 rounded-3xl bg-white p-8 shadow-2xl">
          <ShieldCheck className="mx-auto h-12 w-12 text-emerald-600" />
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-950">Administración global</h1>
            <p className="mt-1 text-sm text-slate-500">Acceso restringido de Futbol Clinic</p>
          </div>
          <label className="block text-sm font-bold text-slate-700">
            <span>Correo electrónico</span>
            <input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-emerald-500" />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            <span>Contraseña</span>
            <input name="password" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-emerald-500" />
          </label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-black text-white disabled:opacity-60">
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </main>
    </>
  );
};

export default SuperAdminLogin;
