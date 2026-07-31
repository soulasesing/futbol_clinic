import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CalendarDays, ChevronRight, CircleDollarSign, Trophy, Users } from 'lucide-react';
import AppShell from '../AppShell';
import { EmptyState, ErrorState, LoadingState } from '../AsyncStates';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import BirthdaySection, { DashboardBirthday } from './BirthdaySection';

interface AdminMetric {
  key: string;
  label: string;
  value: number | string;
  detail?: string;
}

interface DashboardEvent {
  id: string;
  title: string;
  startsAt: string;
  location?: string;
  type?: string;
}

interface AdminDashboardData {
  metrics?: AdminMetric[];
  summary?: {
    players?: number;
    teams?: number;
    upcomingTrainings?: number;
    upcomingMatches?: number;
  };
  upcomingEvents?: DashboardEvent[];
  birthdays?: DashboardBirthday[];
  alerts?: Array<{ id: string; title: string; description?: string; href?: string }>;
  finance?: {
    outstandingAmount?: number;
    overdueAmount?: number;
    pendingProofs?: number;
    currency?: string;
  };
}

const formatMoney = (value: number, currency = 'USD'): string =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(value);

const AdminDashboard: React.FC = () => {
  const { jwt } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      setData(await api.get<AdminDashboardData>('/v1/dashboard/admin', jwt));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar el panel.');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const fallbackMetrics: AdminMetric[] = data?.summary ? [
    { key: 'players', label: 'Jugadores', value: data.summary.players ?? 0 },
    { key: 'teams', label: 'Equipos', value: data.summary.teams ?? 0 },
    { key: 'trainings', label: 'Próximos entrenamientos', value: data.summary.upcomingTrainings ?? 0 },
    { key: 'matches', label: 'Próximos partidos', value: data.summary.upcomingMatches ?? 0 },
  ] : [];
  const metrics = data?.metrics ?? fallbackMetrics;

  if (loading) {
    return <AppShell title="Panel administrativo" subtitle="Operación, agenda y cartera de tu escuela"><LoadingState /></AppShell>;
  }
  if (error) {
    return <AppShell title="Panel administrativo" subtitle="Operación, agenda y cartera de tu escuela"><ErrorState message={error} onAction={() => void loadDashboard()} /></AppShell>;
  }
  if (!data) {
    return <AppShell title="Panel administrativo" subtitle="Operación, agenda y cartera de tu escuela"><EmptyState /></AppShell>;
  }

  return (
    <AppShell title="Panel administrativo" subtitle="Operación, agenda y cartera de tu escuela">
      <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Indicadores principales">
            {metrics.map((metric) => (
              <article key={metric.key} className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-2 text-3xl font-black text-brand-700">{metric.value}</p>
                {metric.detail && <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>}
              </article>
            ))}
          </section>

          <BirthdaySection birthdays={data.birthdays} />

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-black"><CalendarDays className="h-5 w-5 text-brand-600" /> Próxima agenda</h2>
                <Link href="/entrenamientos" className="text-sm font-bold text-brand-700">Ver agenda</Link>
              </div>
              {!data.upcomingEvents?.length ? <EmptyState compact title="Agenda al día" message="No hay eventos próximos." /> : (
                <ul className="divide-y divide-slate-100">
                  {data.upcomingEvents.map((event) => (
                    <li key={event.id} className="flex items-center gap-4 py-4">
                      <span className="rounded-2xl bg-brand-50 p-3 text-brand-700">{event.type === 'match' ? <Trophy className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{event.title}</span>
                        <span className="block text-sm text-slate-500">{new Date(event.startsAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}{event.location ? ` · ${event.location}` : ''}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="brand-hero-dark rounded-3xl p-6 text-white shadow-xl">
              <CircleDollarSign className="h-7 w-7 text-white/80" />
              <h2 className="mt-4 text-lg font-black">Cartera</h2>
              <p className="mt-4 text-3xl font-black">{formatMoney(data.finance?.outstandingAmount ?? 0, data.finance?.currency)}</p>
              <p className="text-sm text-white/70">Saldo pendiente</p>
              <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-white/10 p-3"><strong className="block">{formatMoney(data.finance?.overdueAmount ?? 0, data.finance?.currency)}</strong>Vencido</div>
                <div className="rounded-2xl bg-white/10 p-3"><strong className="block">{data.finance?.pendingProofs ?? 0}</strong>Comprobantes</div>
              </div>
              <Link href="/finanzas" className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 font-bold text-slate-900">Gestionar finanzas <ChevronRight className="h-4 w-4" /></Link>
            </div>
          </section>

          <section className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><AlertTriangle className="h-5 w-5 text-amber-500" /> Requiere atención</h2>
            {!data.alerts?.length ? <EmptyState compact title="Todo está al día" message="No hay alertas operativas pendientes." /> : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.alerts.map((alert) => (
                  <Link key={alert.id} href={alert.href || '/dashboard'} className="rounded-2xl border border-amber-100 bg-amber-50 p-4 hover:border-amber-300">
                    <span className="font-bold text-slate-900">{alert.title}</span>
                    {alert.description && <span className="mt-1 block text-sm text-slate-600">{alert.description}</span>}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <Link href="/players" className="flex items-center gap-3 rounded-2xl bg-white p-4 font-bold shadow-sm"><Users className="text-brand-600" /> Gestionar jugadores</Link>
            <Link href="/partidos" className="flex items-center gap-3 rounded-2xl bg-white p-4 font-bold shadow-sm"><Trophy className="text-brand-600" /> Gestionar partidos</Link>
            <Link href="/finanzas/comprobantes" className="flex items-center gap-3 rounded-2xl bg-white p-4 font-bold shadow-sm"><CircleDollarSign className="text-brand-600" /> Revisar pagos</Link>
          </section>
      </div>
    </AppShell>
  );
};

export default AdminDashboard;
