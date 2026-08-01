import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface TenantBranding {
  slug: string;
  nombre: string;
  logo_url?: string;
  banner_url?: string;
  primary_color?: string;
  secondary_color?: string;
  description?: string;
  slogan?: string;
}

const safeColor = (value: string | undefined, fallback: string): string =>
  value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;

const decodeJwtPayload = (token: string): Record<string, string> => {
  const encoded = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
  return JSON.parse(window.atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')));
};

const formValue = (form: FormData, field: string): string => {
  const value = form.get(field);
  return typeof value === 'string' ? value : '';
};

const TenantLoginPage: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const [tenant, setTenant] = useState<TenantBranding | null>(null);
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    const loadTenant = async (): Promise<void> => {
      try {
        setLoadingTenant(true);
        const response = await fetch(`/api/tenants/public/${encodeURIComponent(slug)}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Escuela no encontrada');
        setTenant(payload);
        setPageError('');
      } catch (error) {
        setTenant(null);
        setPageError(error instanceof Error ? error.message : 'Escuela no encontrada');
      } finally {
        setLoadingTenant(false);
      }
    };
    void loadTenant();
  }, [router.isReady, slug]);

  const colors = useMemo(() => ({
    primary: safeColor(tenant?.primary_color, '#162577'),
    secondary: safeColor(tenant?.secondary_color, '#FFFFFF'),
  }), [tenant]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      setSubmitting(true);
      setFormError('');
      const email = formValue(form, 'email').trim().toLowerCase();
      const password = formValue(form, 'password');
      const response = await fetch('/api/auth/tenant-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, slug }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'No fue posible iniciar sesión');
      const jwtPayload = decodeJwtPayload(payload.jwt);
      localStorage.setItem('loginPath', `/escuela/${slug}/login`);
      login(payload.jwt, {
        email,
        tenantId: jwtPayload.tenantId,
        role: jwtPayload.role as 'admin' | 'coach' | 'parent',
      });
      await router.push('/dashboard');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No fue posible iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTenant) {
    return <main className="grid min-h-screen place-items-center bg-slate-50"><p className="font-semibold text-slate-600">Cargando escuela…</p></main>;
  }
  if (pageError || !tenant) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <section className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-slate-900">Escuela no encontrada</h1>
          <p className="mt-3 text-slate-600">{pageError}</p>
          <Link href="/" className="mt-6 inline-flex font-bold text-blue-800">Volver al inicio</Link>
        </section>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Acceso | {tenant.nombre}</title>
        {tenant.logo_url && <link rel="icon" href={tenant.logo_url} />}
      </Head>
      <main
        className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10"
        style={{ background: `linear-gradient(145deg, ${colors.primary} 0%, #0f172a 72%)` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_38%)]" />
        <Link href={`/escuela/${slug}`} className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white backdrop-blur hover:bg-white/20">
          <ArrowLeft className="h-4 w-4" /> Volver a la academia
        </Link>
        <section className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/95 p-7 shadow-2xl backdrop-blur md:p-9">
          <header className="mb-8 text-center">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={`Escudo de ${tenant.nombre}`} className="mx-auto h-32 w-28 object-contain" />
            ) : (
              <span className="mx-auto grid h-24 w-24 place-items-center rounded-full text-3xl font-black text-white" style={{ backgroundColor: colors.primary }}>
                {tenant.nombre.slice(0, 2).toUpperCase()}
              </span>
            )}
            <h1 className="mt-5 text-2xl font-black text-slate-950">{tenant.nombre}</h1>
            <p className="mt-1 text-sm font-semibold" style={{ color: colors.primary }}>
              {tenant.slogan || 'Portal de la academia'}
            </p>
          </header>

          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5" aria-label={`Acceso a ${tenant.nombre}`}>
            <label className="block text-sm font-bold text-slate-700">
              <span>Correo electrónico</span>
              <span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:ring-2" style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}>
                <Mail className="h-4 w-4 text-slate-400" />
                <input name="email" type="email" autoComplete="email" required className="w-full border-0 bg-transparent py-3 outline-none" />
              </span>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              <span>Contraseña</span>
              <span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:ring-2" style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}>
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input name="password" type="password" autoComplete="current-password" required className="w-full border-0 bg-transparent py-3 outline-none" />
              </span>
            </label>
            {formError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{formError}</p>}
            {router.query.expired === '1' && (
              <output className="block rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                Tu sesión expiró por 10 minutos de inactividad. Inicia sesión nuevamente.
              </output>
            )}
            {router.query.reset === 'success' && (
              <output className="block rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
                Contraseña actualizada. Ya puedes iniciar sesión.
              </output>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl px-4 py-3 font-black text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
              style={{ backgroundColor: colors.primary }}
            >
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </button>
            <Link
              href={`/escuela/${slug}/forgot`}
              className="block text-center text-sm font-bold"
              style={{ color: colors.primary }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </form>
          <p className="mt-7 text-center text-xs text-slate-500">Acceso exclusivo para miembros de esta academia.</p>
        </section>
      </main>
    </>
  );
};

export default TenantLoginPage;
