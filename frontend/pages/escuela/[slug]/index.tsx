import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import {
  ArrowRight,
  Camera,
  CalendarDays,
  Check,
  Clock3,
  Mail,
  MapPin,
  Newspaper,
  Phone,
  Trophy,
} from 'lucide-react';

interface PublicTenant {
  slug: string;
  name: string;
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  description?: string;
  slogan?: string;
  phone?: string;
  email?: string;
  instagramUrl?: string;
  foundationDate?: string;
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
}

interface PublicPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  imageUrl?: string;
  publishedAt: string;
}

interface PublicEvent {
  id: string;
  title: string;
  startsAt: string;
  location?: string;
  type: 'training' | 'match';
  teamName?: string;
}

interface PublicPricing {
  id: string;
  name: string;
  description?: string;
  priceLabel: string;
  billingPeriod?: string;
  features: string[];
  ctaLabel: string;
  isFeatured: boolean;
}

interface LandingData {
  tenant: PublicTenant;
  posts: PublicPost[];
  events: PublicEvent[];
  pricing: PublicPricing[];
}

interface AcademyLandingProps {
  landing: LandingData;
}

const safeColor = (value: string | undefined, fallback: string): string =>
  value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;

const AcademyLanding: React.FC<AcademyLandingProps> = ({ landing }) => {
  const { tenant, posts, events, pricing } = landing;
  const primary = safeColor(tenant.primaryColor, '#162577');
  const loginPath = `/escuela/${tenant.slug}/login`;
  const forgotPath = `/escuela/${tenant.slug}/forgot`;
  const contactSubject = encodeURIComponent(`Información sobre ${tenant.name}`);
  const contactHref = tenant.email
    ? `mailto:${tenant.email}?subject=${contactSubject}`
    : loginPath;

  return (
    <>
      <Head>
        <title>{tenant.name} | Formación de fútbol</title>
        <meta
          name="description"
          content={tenant.subheadline || tenant.description || tenant.slogan || tenant.name}
        />
        {tenant.logoUrl && <link rel="icon" href={tenant.logoUrl} />}
      </Head>

      <div className="min-h-screen bg-slate-50 text-slate-950">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 text-white backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
            <Link href={`/escuela/${tenant.slug}`} className="flex min-w-0 items-center gap-3">
              {tenant.logoUrl ? (
                <img src={tenant.logoUrl} alt="" className="h-12 w-10 object-contain" />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-xl font-black" style={{ backgroundColor: primary }}>FC</span>
              )}
              <span className="truncate text-sm font-black md:text-base">{tenant.name}</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-bold md:flex" aria-label="Navegación pública">
              <a href="#eventos" className="text-white/75 hover:text-white">Eventos</a>
              <a href="#noticias" className="text-white/75 hover:text-white">Noticias</a>
              <a href="#programas" className="text-white/75 hover:text-white">Programas</a>
            </nav>
            <Link href={loginPath} className="rounded-xl px-4 py-2 text-sm font-black text-white shadow-lg" style={{ backgroundColor: primary }}>
              Iniciar sesión
            </Link>
          </div>
        </header>

        <main>
          <section className="relative isolate min-h-[650px] overflow-hidden bg-slate-950 text-white">
            {tenant.bannerUrl ? (
              <img src={tenant.bannerUrl} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45" />
            ) : (
              <div className="absolute inset-0 -z-20" style={{ background: `linear-gradient(135deg, ${primary}, #020617)` }} />
            )}
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
            <div className="mx-auto flex min-h-[650px] max-w-7xl items-center px-4 py-24 md:px-8">
              <div className="max-w-3xl">
                <p className="mb-5 text-sm font-black uppercase tracking-[0.28em] text-white/70">
                  {tenant.slogan || 'Formación deportiva integral'}
                </p>
                <h1 className="text-5xl font-black leading-[0.98] tracking-tight md:text-7xl">
                  {tenant.headline || tenant.name}
                </h1>
                <p className="mt-7 max-w-2xl text-lg leading-8 text-white/80 md:text-xl">
                  {tenant.subheadline || tenant.description || 'Formamos futbolistas con disciplina, valores y pasión por el juego.'}
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Link href={loginPath} className="inline-flex items-center gap-2 rounded-2xl px-6 py-4 font-black text-white shadow-2xl" style={{ backgroundColor: primary }}>
                    {tenant.ctaLabel || 'Acceder a la academia'} <ArrowRight className="h-5 w-5" />
                  </Link>
                  <a href="#programas" className="rounded-2xl border border-white/30 bg-white/10 px-6 py-4 font-black backdrop-blur hover:bg-white/20">
                    Conocer programas
                  </a>
                </div>
                <Link href={forgotPath} className="mt-5 inline-block text-sm font-bold text-white/65 underline-offset-4 hover:text-white hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>
          </section>

          <section id="eventos" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: primary }}>Agenda</p>
                <h2 className="mt-2 text-3xl font-black md:text-4xl">Próximos eventos</h2>
              </div>
              <CalendarDays className="h-10 w-10" style={{ color: primary }} />
            </div>
            {events.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {events.map((event) => {
                  const startsAt = new Date(event.startsAt);
                  return (
                    <article key={`${event.type}-${event.id}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                      <span className="inline-flex rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: primary }}>
                        {event.type === 'match' ? 'Partido' : 'Entrenamiento'}
                      </span>
                      <h3 className="mt-4 text-lg font-black">{event.title}</h3>
                      <p className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-600">
                        <Clock3 className="h-4 w-4" />
                        {startsAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                        {' · '}
                        {startsAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {event.location && (
                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                          <MapPin className="h-4 w-4" /> {event.location}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                La próxima agenda será publicada pronto.
              </div>
            )}
          </section>

          <section id="noticias" className="bg-slate-950 py-20 text-white">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
              <div className="mb-9 flex items-center gap-3">
                <Newspaper className="h-8 w-8" />
                <h2 className="text-3xl font-black md:text-4xl">Noticias de la academia</h2>
              </div>
              {posts.length ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {posts.map((post) => (
                    <article key={post.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                      {post.imageUrl && <img src={post.imageUrl} alt="" className="h-48 w-full object-cover" />}
                      <div className="p-6">
                        <time className="text-xs font-black uppercase tracking-wider text-white/50">
                          {new Date(post.publishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </time>
                        <h3 className="mt-3 text-xl font-black">{post.title}</h3>
                        <p className="mt-3 leading-7 text-white/65">{post.excerpt}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60">Muy pronto compartiremos noticias de nuestra comunidad.</p>
              )}
            </div>
          </section>

          <section id="programas" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Trophy className="mx-auto h-10 w-10" style={{ color: primary }} />
              <h2 className="mt-4 text-3xl font-black md:text-4xl">Programas y mensualidades</h2>
              <p className="mt-3 text-slate-600">Encuentra el programa adecuado para comenzar tu proceso deportivo.</p>
            </div>
            {pricing.length ? (
              <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
                {pricing.map((plan) => (
                  <article key={plan.id} className={`relative rounded-3xl border bg-white p-7 shadow-sm ${plan.isFeatured ? 'border-transparent shadow-2xl' : 'border-slate-200'}`}>
                    {plan.isFeatured && <span className="absolute right-5 top-5 rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: primary }}>Recomendado</span>}
                    <h3 className="pr-20 text-xl font-black">{plan.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-500">{plan.description}</p>
                    <p className="mt-7 text-3xl font-black" style={{ color: primary }}>{plan.priceLabel}</p>
                    {plan.billingPeriod && <p className="text-sm text-slate-500">{plan.billingPeriod}</p>}
                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-2 text-sm text-slate-700">
                          <Check className="h-5 w-5 shrink-0" style={{ color: primary }} /> {feature}
                        </li>
                      ))}
                    </ul>
                    <a href={contactHref} className="mt-8 block rounded-xl px-4 py-3 text-center text-sm font-black text-white" style={{ backgroundColor: primary }}>
                      {plan.ctaLabel}
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center">
                <p className="font-bold text-slate-700">Solicita información sobre nuestros programas.</p>
                <a href={contactHref} className="mt-5 inline-flex rounded-xl px-5 py-3 font-black text-white" style={{ backgroundColor: primary }}>Contactar academia</a>
              </div>
            )}
          </section>
        </main>

        <footer className="bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-2 md:px-8">
            <div>
              <p className="text-xl font-black">{tenant.name}</p>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/60">{tenant.description}</p>
            </div>
            <div className="flex flex-col gap-3 text-sm md:items-end">
              {tenant.phone && <a href={`tel:${tenant.phone}`} className="flex items-center gap-2"><Phone className="h-4 w-4" /> {tenant.phone}</a>}
              {tenant.email && <a href={`mailto:${tenant.email}`} className="flex items-center gap-2"><Mail className="h-4 w-4" /> {tenant.email}</a>}
              {tenant.instagramUrl && <a href={tenant.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2"><Camera className="h-4 w-4" /> Instagram</a>}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<AcademyLandingProps> = async (context) => {
  const slug = String(context.params?.slug || '');
  const backendUrl = (
    process.env.BACKEND_API_URL
    || process.env.INTERNAL_BACKEND_URL
    || process.env.NEXT_PUBLIC_BACKEND_URL
    || 'http://localhost:4000'
  ).replace(/\/$/, '');
  try {
    const response = await fetch(`${backendUrl}/api/landing/public/${encodeURIComponent(slug)}`);
    if (!response.ok) {
      return {
        redirect: {
          destination: `/escuela/${encodeURIComponent(slug)}/login`,
          permanent: false,
        },
      };
    }
    return { props: { landing: await response.json() as LandingData } };
  } catch {
    return {
      redirect: {
        destination: `/escuela/${encodeURIComponent(slug)}/login`,
        permanent: false,
      },
    };
  }
};

export default AcademyLanding;
