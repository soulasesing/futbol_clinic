import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Copy,
  MailPlus,
  Pencil,
  RefreshCw,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  XCircle,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncStates';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

interface Player {
  id: string;
  nombre: string;
  apellido: string;
}

interface ParentChild {
  id: string;
  name: string;
  relationship: string;
  canViewFinances: boolean;
  canSubmitPayments: boolean;
}

type AccessStatus =
  | 'active'
  | 'suspended'
  | 'pending'
  | 'expired'
  | 'revoked'
  | 'not_invited';

interface ParentAccess {
  id: string;
  household_id: string;
  household_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  user_id?: string;
  access_status: AccessStatus;
  invitation_expires_at?: string;
  children: ParentChild[];
}

interface InviteResult {
  invitationLink?: string;
  emailSent?: boolean;
  existingUser?: boolean;
}

interface ParentForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relationship: string;
  playerIds: string[];
  householdId: string;
  canViewFinances: boolean;
  canSubmitPayments: boolean;
}

const emptyForm: ParentForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  relationship: 'Madre/Padre',
  playerIds: [],
  householdId: '',
  canViewFinances: true,
  canSubmitPayments: true,
};

const fieldClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

const statusLabels: Record<AccessStatus, { label: string; classes: string }> = {
  active: { label: 'Acceso activo', classes: 'bg-green-50 text-green-800' },
  suspended: { label: 'Suspendido', classes: 'bg-red-50 text-red-700' },
  pending: { label: 'Invitación pendiente', classes: 'bg-blue-50 text-blue-800' },
  expired: { label: 'Invitación expirada', classes: 'bg-amber-50 text-amber-800' },
  revoked: { label: 'Invitación revocada', classes: 'bg-slate-100 text-slate-700' },
  not_invited: { label: 'Sin invitación', classes: 'bg-slate-100 text-slate-700' },
};

const inviteSuccessMessage = (result: InviteResult): string => {
  if (result.existingUser) return 'La cuenta existente fue vinculada a los jugadores';
  if (result.emailSent) return 'Invitación enviada correctamente';
  return 'Invitación creada. Comparte el enlace manualmente.';
};

const FamiliesPage: React.FC = () => {
  const { jwt } = useAuth();
  const [parents, setParents] = useState<ParentAccess[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [busyId, setBusyId] = useState<string>();
  const [form, setForm] = useState<ParentForm>(emptyForm);
  const [invitationLink, setInvitationLink] = useState('');

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const [parentData, playerData] = await Promise.all([
        apiRequest<ParentAccess[]>('/v1/parents', { token: jwt }),
        apiRequest<Player[]>('/players', { token: jwt }),
      ]);
      setParents(parentData);
      setPlayers(Array.isArray(playerData) ? playerData : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar las familias');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = (): void => {
    setForm(emptyForm);
    setEditingId(undefined);
    setShowForm(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBusyId('form');
    setError('');
    try {
      if (editingId) {
        await apiRequest(`/v1/parents/${editingId}`, {
          method: 'PUT',
          token: jwt,
          body: { ...form },
        });
        setSuccess('Permisos familiares actualizados');
      } else {
        const result = await apiRequest<InviteResult>('/v1/parents/invite', {
          method: 'POST',
          token: jwt,
          body: {
            ...form,
            householdId: form.householdId || undefined,
            householdName: `Familia ${form.lastName}`,
          },
        });
        if (result.invitationLink) setInvitationLink(result.invitationLink);
        setSuccess(inviteSuccessMessage(result));
      }
      resetForm();
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible guardar');
    } finally {
      setBusyId(undefined);
    }
  };

  const handlePlayerToggle = (playerId: string): void => {
    setForm((current) => ({
      ...current,
      playerIds: current.playerIds.includes(playerId)
        ? current.playerIds.filter((id) => id !== playerId)
        : [...current.playerIds, playerId],
    }));
  };

  const editParent = (parent: ParentAccess): void => {
    const firstChild = parent.children[0];
    setEditingId(parent.id);
    setForm({
      firstName: parent.first_name,
      lastName: parent.last_name,
      email: parent.email,
      phone: parent.phone || '',
      relationship: firstChild?.relationship || 'Madre/Padre',
      playerIds: parent.children.map((child) => child.id),
      householdId: parent.household_id,
      canViewFinances: firstChild?.canViewFinances ?? true,
      canSubmitPayments: firstChild?.canSubmitPayments ?? true,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const runParentAction = async (
    parent: ParentAccess,
    action: () => Promise<void>
  ): Promise<void> => {
    setBusyId(parent.id);
    setError('');
    try {
      await action();
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible completar la acción');
    } finally {
      setBusyId(undefined);
    }
  };

  const resendParent = async (parent: ParentAccess): Promise<void> => {
    await runParentAction(parent, async () => {
      const result = await apiRequest<InviteResult>(
        `/v1/parents/${parent.id}/resend`,
        { method: 'POST', token: jwt }
      );
      if (result.invitationLink) setInvitationLink(result.invitationLink);
      setSuccess(
        result.emailSent
          ? 'Invitación reenviada'
          : 'Nuevo enlace generado para compartir manualmente'
      );
    });
  };

  const revokeParentInvitation = async (parent: ParentAccess): Promise<void> => {
    if (!window.confirm('¿Revocar esta invitación? El enlace dejará de funcionar.')) return;
    await runParentAction(parent, async () => {
      await apiRequest(`/v1/parents/${parent.id}/revoke`, {
        method: 'POST',
        token: jwt,
      });
      setSuccess('Invitación revocada');
    });
  };

  const toggleParentAccess = async (parent: ParentAccess): Promise<void> => {
    const active = parent.access_status === 'suspended';
    if (!active && !window.confirm('¿Suspender el acceso de este representante?')) return;
    await runParentAction(parent, async () => {
      await apiRequest(`/v1/parents/${parent.id}/access`, {
        method: 'PATCH',
        token: jwt,
        body: { active },
      });
      setSuccess(active ? 'Acceso reactivado' : 'Acceso suspendido');
    });
  };

  const copyInvitation = async (): Promise<void> => {
    await navigator.clipboard.writeText(invitationLink);
    setSuccess('Enlace copiado. Puedes enviarlo por WhatsApp.');
  };

  const uniqueHouseholds = parents.filter(
    (parent, index, list) =>
      list.findIndex((item) => item.household_id === parent.household_id) === index
  );
  let submitLabel = 'Crear y enviar invitación';
  if (busyId === 'form') submitLabel = 'Guardando…';
  else if (editingId) submitLabel = 'Guardar permisos';

  return (
    <ProtectedRoute roles={['admin']}>
      <AppShell
        title="Familias"
        subtitle="Invita representantes y controla el acceso al portal familiar."
        actions={(
          <button
            type="button"
            onClick={() => {
              setEditingId(undefined);
              setForm(emptyForm);
              setShowForm(true);
            }}
            className="brand-gradient flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black"
          >
            <MailPlus className="h-4 w-4" /> Invitar
          </button>
        )}
      >
        {showForm && (
          <form onSubmit={(event) => void handleSubmit(event)} className="mb-6 rounded-3xl border border-brand-100 bg-white p-5 shadow-xl md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">{editingId ? 'Editar representante' : 'Invitar representante'}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingId ? 'Actualiza los jugadores y permisos asociados.' : 'La persona creará su propia contraseña mediante un enlace seguro.'}
                </p>
              </div>
              <button type="button" onClick={resetForm} aria-label="Cerrar formulario" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><XCircle className="h-5 w-5" /></button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-bold"><span>Nombre</span><input required maxLength={100} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className={fieldClass} /></label>
              <label className="text-sm font-bold"><span>Apellido</span><input required maxLength={100} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className={fieldClass} /></label>
              <label className="text-sm font-bold"><span>Correo electrónico</span><input required={!editingId} disabled={Boolean(editingId)} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={`${fieldClass} disabled:bg-slate-100`} /></label>
              <label className="text-sm font-bold"><span>Teléfono</span><input maxLength={50} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={fieldClass} /></label>
              <label className="text-sm font-bold"><span>Parentesco</span><select value={form.relationship} onChange={(event) => setForm({ ...form, relationship: event.target.value })} className={fieldClass}><option>Madre/Padre</option><option>Madre</option><option>Padre</option><option>Tutor legal</option><option>Otro</option></select></label>
              {!editingId && (
                <label className="text-sm font-bold">
                  <span>Familia existente (opcional)</span>
                  <select value={form.householdId} onChange={(event) => setForm({ ...form, householdId: event.target.value })} className={fieldClass}>
                    <option value="">Crear una familia nueva</option>
                    {uniqueHouseholds.map((parent) => <option key={parent.household_id} value={parent.household_id}>{parent.household_name}</option>)}
                  </select>
                </label>
              )}
            </div>

            <fieldset className="mt-6">
              <legend className="text-sm font-black">Jugadores asociados</legend>
              <div className="mt-3 grid max-h-56 gap-2 overflow-y-auto rounded-2xl border border-slate-200 p-3 sm:grid-cols-2">
                {players.map((player) => (
                  <label key={player.id} className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold hover:bg-brand-50">
                    <input type="checkbox" checked={form.playerIds.includes(player.id)} onChange={() => handlePlayerToggle(player.id)} className="h-4 w-4 accent-brand-700" />
                    {player.nombre} {player.apellido}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-6 rounded-2xl bg-slate-50 p-4">
              <legend className="px-2 text-sm font-black">Permisos financieros</legend>
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.canViewFinances} onChange={(event) => setForm({ ...form, canViewFinances: event.target.checked, canSubmitPayments: event.target.checked ? form.canSubmitPayments : false })} /> Ver cargos y recibos</label>
                <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" disabled={!form.canViewFinances} checked={form.canSubmitPayments} onChange={(event) => setForm({ ...form, canSubmitPayments: event.target.checked })} /> Enviar comprobantes</label>
              </div>
            </fieldset>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="rounded-xl px-4 py-3 text-sm font-bold text-slate-600">Cancelar</button>
              <button type="submit" disabled={busyId === 'form' || form.playerIds.length === 0} className="brand-gradient rounded-xl px-5 py-3 text-sm font-black disabled:opacity-50">
                {submitLabel}
              </button>
            </div>
          </form>
        )}

        {invitationLink && (
          <section className="mb-6 rounded-3xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-black text-blue-950">Enlace de invitación</h2>
                <p className="mt-1 text-sm text-blue-800">Válido por 24 horas y para un solo uso. Compártelo únicamente con el representante.</p>
              </div>
              <button type="button" onClick={() => void copyInvitation()} className="flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-3 text-sm font-black text-white"><Copy className="h-4 w-4" /> Copiar para WhatsApp</button>
            </div>
          </section>
        )}

        {error && !loading && <div className="mb-6"><ErrorState message={error} onAction={() => void load()} compact /></div>}
        {success && <output className="mb-6 block rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-800">{success}</output>}
        {loading ? <LoadingState message="Cargando familias y accesos…" /> : null}

        {!loading && !error && parents.length === 0 ? (
          <EmptyState title="Aún no hay familias" message="Invita al primer representante y vincúlalo con sus jugadores." actionLabel="Invitar representante" onAction={() => setShowForm(true)} />
        ) : null}

        {!loading && parents.length > 0 && (
          <div className="grid gap-4 xl:grid-cols-2">
            {parents.map((parent) => {
              const status = statusLabels[parent.access_status];
              const isBusy = busyId === parent.id;
              return (
                <article key={parent.id} className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <span className="brand-gradient grid h-12 w-12 shrink-0 place-items-center rounded-2xl"><UsersRound className="h-6 w-6" /></span>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-black">{parent.first_name} {parent.last_name}</h2>
                        <p className="truncate text-sm text-slate-500">{parent.email}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{parent.household_name}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${status.classes}`}>{status.label}</span>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Jugadores</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {parent.children.map((child) => <span key={child.id} className="rounded-full bg-white px-3 py-1 text-sm font-bold shadow-sm">{child.name}</span>)}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> {parent.children.some((child) => child.canViewFinances) ? 'Ve finanzas' : 'Sin finanzas'}</span>
                      <span className="flex items-center gap-1"><UserRoundCheck className="h-4 w-4" /> {parent.children.some((child) => child.canSubmitPayments) ? 'Envía comprobantes' : 'Solo consulta'}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" onClick={() => editParent(parent)} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"><Pencil className="h-4 w-4" /> Editar</button>
                    {['pending', 'expired', 'revoked', 'not_invited'].includes(parent.access_status) && (
                      <button type="button" disabled={isBusy} onClick={() => void resendParent(parent)} className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-800 disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Enviar invitación</button>
                    )}
                    {parent.access_status === 'pending' && (
                      <button type="button" disabled={isBusy} onClick={() => void revokeParentInvitation(parent)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-amber-700 hover:bg-amber-50"><Ban className="h-4 w-4" /> Revocar</button>
                    )}
                    {parent.access_status === 'active' && (
                      <button type="button" disabled={isBusy} onClick={() => void toggleParentAccess(parent)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50"><Ban className="h-4 w-4" /> Suspender</button>
                    )}
                    {parent.access_status === 'suspended' && (
                      <button type="button" disabled={isBusy} onClick={() => void toggleParentAccess(parent)} className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-black text-green-800"><CheckCircle2 className="h-4 w-4" /> Reactivar</button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
};

export default FamiliesPage;
