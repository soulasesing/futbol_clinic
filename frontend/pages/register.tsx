import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const token = router.query.token as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!token) return setError('Token de invitación inválido');
    if (password !== repeatPassword) return setError('Las contraseñas no coinciden');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nombre, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error de registro');
      // Decodificar el JWT para extraer datos del usuario
      const payload = JSON.parse(atob(data.jwt.split('.')[1]));
      login(data.jwt, {
        email: payload.email,
        tenantId: payload.tenantId,
        role: payload.role,
      });
      setSuccess('¡Registro exitoso! Redirigiendo...');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white px-4">
      <form
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6 border border-emerald-100"
        onSubmit={handleSubmit}
        aria-label="Formulario de registro por invitación"
      >
        <h1 className="text-3xl font-bold text-center text-emerald-700 mb-2">Completa tu registro</h1>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Nombre completo
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
            className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="Nombre completo"
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
            aria-label="Contraseña"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Repetir contraseña
          <input
            type="password"
            value={repeatPassword}
            onChange={e => setRepeatPassword(e.target.value)}
            required
            className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="Repetir contraseña"
          />
        </label>
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        {success && <div className="text-green-600 text-sm text-center">{success}</div>}
        <button
          type="submit"
          className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-2 rounded-lg shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Registrando...' : 'Registrarme'}
        </button>
      </form>
    </main>
  );
};

export default Register; 