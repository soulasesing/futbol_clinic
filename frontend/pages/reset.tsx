import React, { useState } from 'react';
import { useRouter } from 'next/router';

const Reset: React.FC = () => {
  const router = useRouter();
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
    if (!token) return setError('Token inválido');
    if (password !== repeatPassword) return setError('Las contraseñas no coinciden');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al restablecer contraseña');
      setSuccess('¡Contraseña actualizada! Redirigiendo a login...');
      setTimeout(() => router.push('/login'), 1500);
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
        aria-label="Formulario de restablecimiento de contraseña"
      >
        <h1 className="text-3xl font-bold text-center text-emerald-700 mb-2">Restablecer contraseña</h1>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Nueva contraseña
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="Nueva contraseña"
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
          {loading ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
      </form>
    </main>
  );
};

export default Reset; 