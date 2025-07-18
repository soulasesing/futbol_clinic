import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tenantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error de login');
      // Decodificar el JWT para extraer datos del usuario
      const payload = JSON.parse(atob(data.jwt.split('.')[1]));
      login(data.jwt, {
        email,
        tenantId: payload.tenantId,
        role: payload.role,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white px-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <form
          className="w-full bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6 border border-emerald-100"
          onSubmit={handleSubmit}
          aria-label="Formulario de inicio de sesión"
        >
          <h1 className="text-3xl font-bold text-center text-emerald-700 mb-2">Iniciar sesión</h1>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              autoComplete="email"
              aria-label="Email"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              autoComplete="current-password"
              aria-label="Contraseña"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Código de escuela
            <input
              type="text"
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
              required
              className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-label="Código de escuela"
            />
          </label>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-2 rounded-lg shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <div className="w-full mt-6 flex flex-col items-center gap-2 text-sm">
          <a
            href="/forgot"
            className="text-emerald-700 hover:underline focus:outline-none focus:underline"
            tabIndex={0}
          >
            ¿Olvidaste tu contraseña?
          </a>
          <a
            href="/register"
            className="text-emerald-700 hover:underline focus:outline-none focus:underline"
            tabIndex={0}
          >
            ¿Tienes una invitación? Completa tu registro
          </a>
        </div>
      </div>
    </main>
  );
};

export default Login; 