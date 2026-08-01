import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CheckCircle2, LockKeyhole, UserRound } from 'lucide-react';
import { useAuth, User } from '../../../contexts/AuthContext';

interface InvitationInfo {
  tenant: {
    name: string;
    slug: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  parent: {
    firstName: string;
    lastName: string;
    email: string;
  };
  expiresAt: string;
}

const safeColor = (value: string | undefined): string =>
  value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#162577';

const ParentRegistrationPage: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const token = typeof router.query.token === 'string' ? router.query.token : '';
  const [invitation, setInvitation] = useState<InvitationInfo>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    if (!token || !slug) {
      setError('El enlace de invitación no es válido');
      setLoading(false);
      return;
    }
    void fetch(`/api/v1/parents/invitation/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Invitación inválida');
        if (payload.tenant.slug !== slug) throw new Error('La invitación no corresponde a esta academia');
        setInvitation(payload);
        setName(`${payload.parent.firstName} ${payload.parent.lastName}`.trim());
        localStorage.setItem('loginPath', `/escuela/${slug}/login`);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [router.isReady, slug, token]);

  const primary = useMemo(
    () => safeColor(invitation?.tenant.primaryColor),
    [invitation?.tenant.primaryColor]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres');
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nombre: name.trim(), password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'No fue posible activar la cuenta');
      login(payload.jwt, payload.user as User);
      await router.replace('/dashboard');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible activar la cuenta'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-slate-950 text-white"><p className="font-bold">Validando invitación…</p></main>;
  }

  if (error && !invitation) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-4">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <h1 className="text-2xl font-black text-slate-950">Invitación no disponible</h1>
          <p className="mt-3 text-slate-600">{error}</p>
          <Link href={slug ? `/escuela/${slug}` : '/'} className="mt-6 inline-flex font-black" style={{ color: primary }}>Volver a la academia</Link>
        </section>
      </main>
    );
  }

  if (!invitation) return null;

  return (
    <>
      <Head><title>Activa tu portal familiar | {invitation.tenant.name}</title></Head>
      <main className="grid min-h-screen place-items-center bg-slate-950 px-4 py-12">
        <section className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl md:p-10">
          <header className="text-center">
            {invitation.tenant.logoUrl && <img src={invitation.tenant.logoUrl} alt="" className="mx-auto h-24 w-20 object-contain" />}
            <p className="mt-4 text-sm font-black uppercase tracking-wider" style={{ color: primary }}>Portal familiar</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Crea tu acceso</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {invitation.tenant.name} te invitó a consultar la información de tu familia.
            </p>
          </header>

          <div className="mt-6 rounded-2xl bg-green-50 p-4 text-sm text-green-900">
            <p className="flex items-center gap-2 font-black"><CheckCircle2 className="h-5 w-5" /> Invitación verificada</p>
            <p className="mt-1">{invitation.parent.email}</p>
          </div>

          <form onSubmit={(event) => void handleSubmit(event)} className="mt-7 space-y-5">
            <label className="block text-sm font-bold text-slate-700">
              <span>Nombre completo</span>
              <span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:ring-2" style={{ '--tw-ring-color': primary } as React.CSSProperties}>
                <UserRound className="h-4 w-4 text-slate-400" />
                <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={150} autoComplete="name" className="w-full py-3 outline-none" />
              </span>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              <span>Contraseña</span>
              <span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:ring-2" style={{ '--tw-ring-color': primary } as React.CSSProperties}>
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} autoComplete="new-password" className="w-full py-3 outline-none" />
              </span>
              <span className="mt-1 block text-xs font-normal text-slate-500">Mínimo 12 caracteres.</span>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              <span>Repetir contraseña</span>
              <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={12} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2" style={{ '--tw-ring-color': primary } as React.CSSProperties} />
            </label>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded-xl px-4 py-3 font-black text-white shadow-lg disabled:opacity-60" style={{ backgroundColor: primary }}>
              {submitting ? 'Activando cuenta…' : 'Activar mi portal familiar'}
            </button>
          </form>
        </section>
      </main>
    </>
  );
};

export default ParentRegistrationPage;
