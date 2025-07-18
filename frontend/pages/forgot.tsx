import React, { useState } from 'react';

const Forgot: React.FC = () => {
  const [email, setEmail] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tenantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al solicitar recuperación');
      setSuccess('Si el email existe, recibirás un enlace para restablecer tu contraseña.');
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
        aria-label="Formulario de recuperación de contraseña"
      >
        <h1 className="text-3xl font-bold text-center text-emerald-700 mb-2">Recuperar contraseña</h1>
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
        {success && <div className="text-green-600 text-sm text-center">{success}</div>}
        <button
          type="submit"
          className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-2 rounded-lg shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>
    </main>
  );
};

export default Forgot; 