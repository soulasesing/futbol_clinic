import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, CheckCircle2, ChevronRight, ClipboardCheck, MapPin, Trophy, Users } from 'lucide-react';
import AppShell from '../AppShell';
import { EmptyState, ErrorState, LoadingState } from '../AsyncStates';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import BirthdaySection, { DashboardBirthday } from './BirthdaySection';

interface CoachEvent {
  id: string;
  title: string;
  startsAt: string;
  location?: string;
  type: 'training' | 'match';
  teamName?: string;
  attendanceStatus?: 'pending' | 'completed';
  convocationStatus?: 'pending' | 'completed';
}

interface CoachDashboardData {
  coachName?: string;
  teams?: Array<{ id: string; name: string; playerCount?: number }>;
  agenda?: CoachEvent[];
  birthdays?: DashboardBirthday[];
  pendingAttendance?: number;
  pendingConvocations?: number;
}

const CoachDashboard: React.FC = () => {
  const { jwt, user } = useAuth();
  const [data, setData] = useState<CoachDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      setData(await api.get<CoachDashboardData>('/v1/dashboard/coach', jwt));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar tu agenda.');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => { void load(); }, [load]);

  const title = `Hola, ${data?.coachName || user?.name || 'profe'}`;
  if (loading) {
    return <AppShell title={title} subtitle="Tu agenda deportiva y tareas pendientes"><LoadingState /></AppShell>;
  }
  if (error) {
    return <AppShell title={title} subtitle="Tu agenda deportiva y tareas pendientes"><ErrorState message={error} onAction={() => void load()} /></AppShell>;
  }
  if (!data) {
    return <AppShell title={title} subtitle="Tu agenda deportiva y tareas pendientes"><EmptyState /></AppShell>;
  }

  return (
    <AppShell title={title} subtitle="Tu agenda deportiva y tareas pendientes">
      <div className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-2">
            <Link href="/entrenamientos?view=attendance" className="brand-gradient rounded-3xl p-6 shadow-xl">
              <ClipboardCheck className="h-7 w-7" />
              <p className="mt-6 text-4xl font-black">{data.pendingAttendance ?? 0}</p>
              <p className="font-semibold opacity-80">asistencias por completar</p>
              <span className="mt-4 flex items-center gap-1 text-sm font-bold">Registrar asistencia <ChevronRight className="h-4 w-4" /></span>
            </Link>
            <Link href="/partidos?view=convocations" className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 p-6 text-white shadow-xl">
              <Trophy className="h-7 w-7 text-white/80" />
              <p className="mt-6 text-4xl font-black">{data.pendingConvocations ?? 0}</p>
              <p className="font-semibold text-slate-200">convocatorias pendientes</p>
              <span className="mt-4 flex items-center gap-1 text-sm font-bold">Gestionar convocatorias <ChevronRight className="h-4 w-4" /></span>
            </Link>
          </section>

          <BirthdaySection birthdays={data.birthdays} />

          <section className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm md:p-7">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-black"><CalendarDays className="h-5 w-5 text-brand-600" /> Próximos eventos</h2>
              <Link href="/entrenamientos" className="text-sm font-bold text-brand-700">Agenda completa</Link>
            </div>
            {!data.agenda?.length ? <EmptyState compact title="Sin eventos próximos" message="Tu agenda está libre por ahora." /> : (
              <ol className="space-y-3">
                {data.agenda.map((event) => (
                  <li key={event.id} className="rounded-2xl border border-slate-100 p-4 transition hover:border-brand-200">
                    <div className="flex gap-3">
                      <span className={`mt-0.5 rounded-xl p-2 ${event.type === 'match' ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-700'}`}>
                        {event.type === 'match' ? <Trophy className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{event.title}</p>
                        <p className="text-sm text-slate-500">{new Date(event.startsAt).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        {event.location && <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" /> {event.location}</p>}
                      </div>
                      {(event.attendanceStatus === 'completed' || event.convocationStatus === 'completed') && <CheckCircle2 className="h-5 w-5 text-brand-500" aria-label="Completado" />}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-black">Mis equipos</h2>
            {!data.teams?.length ? <EmptyState compact title="Sin equipos asignados" message="Consulta con la administración de tu escuela." /> : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.teams.map((team) => (
                  <Link key={team.id} href="/teams" className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
                    <span className="rounded-2xl bg-brand-50 p-3"><Users className="h-5 w-5 text-brand-700" /></span>
                    <span><strong className="block">{team.name}</strong><span className="text-sm text-slate-500">{team.playerCount ?? 0} jugadores</span></span>
                  </Link>
                ))}
              </div>
            )}
          </section>
      </div>
    </AppShell>
  );
};

export default CoachDashboard;
