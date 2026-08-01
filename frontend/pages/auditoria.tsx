import React, { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncStates';
import { api } from '../utils/api';

interface AuditEvent {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  actor_name?: string;
  actor_email?: string;
  occurred_at: string;
  metadata: Record<string, unknown>;
}

const AuditoriaPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void api.get<AuditEvent[]>('/v1/domain/audit-events')
      .then(setEvents)
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute roles={['admin']}>
      <AppShell
        title="Auditoría"
        subtitle="Actividad sensible y solicitudes de privacidad."
      >
        {loading ? <LoadingState message="Cargando auditoría…" /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}
        {!loading && !error && events.length === 0 ? (
          <EmptyState title="Sin eventos" message="Todavía no hay actividad auditada." />
        ) : null}
        {!loading && !error && events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
              <article key={event.id} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm text-slate-900">{event.action}</strong>
                  <time className="text-xs text-slate-500">
                    {new Date(event.occurred_at).toLocaleString('es-ES')}
                  </time>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {event.entity_type}{event.entity_id ? ` · ${event.entity_id}` : ''}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {event.actor_name || event.actor_email || 'Sistema'}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </AppShell>
    </ProtectedRoute>
  );
};

export default AuditoriaPage;
