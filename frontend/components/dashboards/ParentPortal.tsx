import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import {
  Bell,
  CalendarDays,
  Clock3,
  CreditCard,
  FileCheck2,
  Receipt,
  TrendingUp,
  Upload,
  UserRound,
  WalletCards,
} from 'lucide-react';
import AuthenticatedImage from '../AuthenticatedImage';
import AppShell from '../AppShell';
import { EmptyState, ErrorState, LoadingState } from '../AsyncStates';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';

interface FamilyEvent {
  id: string;
  childId: string;
  childName: string;
  title: string;
  startsAt: string;
  location?: string;
  rsvp?: 'yes' | 'no' | 'pending';
  rsvpEnabled?: boolean;
}

interface Charge {
  id: string;
  concept: string;
  childName?: string;
  amount: number;
  amountCents: number;
  currency: string;
  dueDate: string;
  status: string;
}

interface FamilyPortalData {
  children?: Array<{ id: string; name: string; teamName?: string; photoUrl?: string }>;
  agenda?: FamilyEvent[];
  finances?: {
    currency?: string;
    balance?: number;
    charges?: Charge[];
    accounts?: Array<{ id: string; name?: string; bankName?: string; accountHolder?: string; accountNumber?: string; walletIdentifier?: string; accountType: 'bank' | 'wallet' | 'cash'; instructions?: string; currency: string }>;
    receipts?: Array<{ id: string; number: string; issuedAt: string; amount: number; currency: string; concept: string }>;
  };
  announcements?: Array<{ id: string; title: string; body: string; publishedAt: string }>;
  progress?: Array<{ childId: string; childName: string; metric: string; value: string; previousValue?: string; recordedAt: string }>;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  overdue: 'Vencido',
  proof_pending: 'Comprobante en revisión',
  paid: 'Pagado',
};

const paymentChannel = (accountType: 'bank' | 'wallet' | 'cash'): string => {
  if (accountType === 'bank') return 'bank_transfer';
  return accountType;
};

const createIdempotencyKey = (chargeId: string): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${chargeId}-${Date.now()}`;
};

const chargeStatusClasses = (status: string): string => {
  if (status === 'overdue') return 'bg-red-50 text-red-700';
  if (status === 'paid') return 'bg-emerald-50 text-emerald-700';
  return 'bg-amber-50 text-amber-700';
};

const ParentPortal: React.FC = () => { // NOSONAR: portal orchestration keeps related family actions together.
  const { jwt } = useAuth();
  const [data, setData] = useState<FamilyPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [accountByCharge, setAccountByCharge] = useState<Record<string, string>>({});

  const load = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      setData(await api.get<FamilyPortalData>('/v1/family/portal', jwt));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar el portal familiar.');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => { void load(); }, [load]);

  const respondToEvent = async (eventId: string, response: 'yes' | 'no'): Promise<void> => {
    try {
      setBusyId(eventId);
      setFeedback('');
      await api.patch(`/v1/family/events/${eventId}/rsvp`, { response }, jwt);
      setData((current) => current ? {
        ...current,
        agenda: current.agenda?.map((event) => event.id === eventId ? { ...event, rsvp: response } : event),
      } : current);
      setFeedback('Tu respuesta quedó registrada.');
    } catch (requestError) {
      setFeedback(requestError instanceof Error ? requestError.message : 'No se pudo guardar tu respuesta.');
    } finally {
      setBusyId(null);
    }
  };

  const uploadProof = async (chargeId: string, event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setBusyId(chargeId);
      setFeedback('');
      const charge = data?.finances?.charges?.find((entry) => entry.id === chargeId);
      const compatibleAccounts = data?.finances?.accounts?.filter(
        (account) => account.currency === charge?.currency
      ) ?? [];
      const account = compatibleAccounts.find(
        (entry) => entry.id === accountByCharge[chargeId]
      ) ?? compatibleAccounts[0];
      if (!charge || !account) {
        throw new Error('Selecciona una cuenta compatible con la moneda del cargo.');
      }
      const form = new FormData();
      form.append('file', file);
      form.append('paymentAccountId', account.id);
      form.append('amountCents', String(charge.amountCents));
      form.append('currency', charge.currency);
      form.append('channel', paymentChannel(account.accountType));
      form.append('idempotencyKey', createIdempotencyKey(charge.id));
      await api.post(`/v1/family/charges/${chargeId}/proof`, form, jwt);
      setData((current) => current ? {
        ...current,
        finances: current.finances ? {
          ...current.finances,
          charges: current.finances.charges?.map((charge) => charge.id === chargeId ? { ...charge, status: 'proof_pending' } : charge),
        } : current.finances,
      } : current);
      setFeedback('Comprobante enviado. Te avisaremos cuando sea revisado.');
    } catch (requestError) {
      setFeedback(requestError instanceof Error ? requestError.message : 'No se pudo enviar el comprobante.');
    } finally {
      event.target.value = '';
      setBusyId(null);
    }
  };

  const money = (amount: number, currency = data?.finances?.currency || 'USD'): string => new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount);

  let content = <EmptyState />;
  if (loading) {
    content = <LoadingState />;
  } else if (error) {
    content = <ErrorState message={error} onAction={() => void load()} />;
  } else if (data) {
    content = (
        <div className="space-y-8">
          {feedback && <output className="block rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm font-semibold text-brand-800">{feedback}</output>}

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Hijos vinculados">
            {!data.children?.length ? <div className="sm:col-span-2 lg:col-span-3"><EmptyState compact title="Sin deportistas vinculados" message="Solicita a la escuela que vincule tu cuenta familiar." /></div> : data.children.map((child) => (
              <article key={child.id} className="flex items-center gap-4 rounded-3xl border border-brand-100 bg-white p-5 shadow-sm">
                {child.photoUrl ? <AuthenticatedImage src={child.photoUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : <span className="rounded-2xl bg-brand-50 p-4"><UserRound className="h-6 w-6 text-brand-700" /></span>}
                <div><h2 className="font-black">{child.name}</h2><p className="text-sm text-slate-500">{child.teamName || 'Sin equipo asignado'}</p></div>
              </article>
            ))}
          </section>

          <section id="agenda" className="scroll-mt-24 rounded-3xl border border-brand-100 bg-white p-5 shadow-sm md:p-7">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-black"><CalendarDays className="h-5 w-5 text-brand-600" /> Agenda y confirmaciones</h2>
            {!data.agenda?.length ? <EmptyState compact title="Sin eventos próximos" message="La agenda familiar está libre." /> : (
              <div className="space-y-3">
                {data.agenda.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-brand-700">{item.childName}</p>
                        <h3 className="truncate font-black">{item.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{new Date(item.startsAt).toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}{item.location ? ` · ${item.location}` : ''}</p>
                      </div>
                      {item.rsvpEnabled && (
                        <div className="flex gap-2" aria-label={`Confirmar asistencia de ${item.childName}`}>
                          <button type="button" disabled={busyId === item.id} onClick={() => void respondToEvent(item.id, 'yes')} className={`rounded-xl px-3 py-2 text-sm font-bold ${item.rsvp === 'yes' ? 'brand-gradient' : 'bg-brand-50 text-brand-800'}`}>Asistirá</button>
                          <button type="button" disabled={busyId === item.id} onClick={() => void respondToEvent(item.id, 'no')} className={`rounded-xl px-3 py-2 text-sm font-bold ${item.rsvp === 'no' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>No asistirá</button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="pagos" className="scroll-mt-24 space-y-4">
            <div className="brand-hero-dark rounded-3xl p-6 text-white shadow-xl">
              <WalletCards className="h-7 w-7 text-white/80" />
              <p className="mt-5 text-sm text-white/70">Saldo familiar pendiente</p>
              <p className="text-4xl font-black">{money(data.finances?.balance ?? 0)}</p>
            </div>
            <div className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm md:p-7">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-black"><CreditCard className="h-5 w-5 text-brand-600" /> Cargos y comprobantes</h2>
              {!data.finances?.charges?.length ? <EmptyState compact title="Estás al día" message="No tienes cargos registrados." /> : (
                <div className="space-y-3">
                  {data.finances.charges.map((charge) => (
                    <article key={charge.id} className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-4 md:flex-row md:items-center">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black">{charge.concept}</h3>
                        <p className="text-sm text-slate-500">{charge.childName ? `${charge.childName} · ` : ''}Vence {new Date(charge.dueDate).toLocaleDateString('es-ES')}</p>
                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${chargeStatusClasses(charge.status)}`}>{statusLabels[charge.status] || charge.status}</span>
                      </div>
                      <strong className="text-lg">{money(charge.amount, charge.currency)}</strong>
                      {['pending', 'overdue'].includes(charge.status) && (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <select
                            value={accountByCharge[charge.id] ?? ''}
                            onChange={(event) => setAccountByCharge((current) => ({
                              ...current,
                              [charge.id]: event.target.value,
                            }))}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                            aria-label={`Cuenta para pagar ${charge.concept}`}
                          >
                            <option value="">Seleccionar cuenta</option>
                            {data.finances?.accounts
                              ?.filter((account) => account.currency === charge.currency)
                              .map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.name || account.bankName || account.accountType}
                                </option>
                              ))}
                          </select>
                          <label className="brand-gradient inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold focus-within:ring-2 focus-within:ring-brand-200 focus-within:ring-offset-2">
                            <Upload className="h-4 w-4" /> {busyId === charge.id ? 'Enviando…' : 'Subir comprobante'}
                            <input type="file" className="sr-only" accept="image/jpeg,image/png,application/pdf" disabled={busyId === charge.id} onChange={(event) => void uploadProof(charge.id, event)} />
                          </label>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm md:p-7">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-black"><FileCheck2 className="h-5 w-5 text-brand-600" /> Cómo pagar</h2>
            {!data.finances?.accounts?.length ? <EmptyState compact title="Sin cuentas publicadas" message="Contacta a la escuela para recibir instrucciones de pago." /> : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.finances.accounts.map((account) => (
                  <article key={account.id} className="rounded-2xl bg-slate-50 p-5">
                    <h3 className="font-black">{account.name || account.bankName || 'Medio de pago'}</h3>
                    <dl className="mt-3 space-y-1 text-sm">{account.accountHolder && <div><dt className="inline text-slate-500">Titular: </dt><dd className="inline font-semibold">{account.accountHolder}</dd></div>}{account.accountNumber && <div><dt className="inline text-slate-500">Cuenta: </dt><dd className="inline font-mono font-semibold">{account.accountNumber}</dd></div>}{account.walletIdentifier && <div><dt className="inline text-slate-500">Billetera: </dt><dd className="inline font-mono font-semibold">{account.walletIdentifier}</dd></div>}<div><dt className="inline text-slate-500">Tipo: </dt><dd className="inline">{account.accountType}</dd></div></dl>
                    {account.instructions && <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{account.instructions}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="recibos" className="scroll-mt-24 rounded-3xl border border-brand-100 bg-white p-5 shadow-sm md:p-7">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-black"><Receipt className="h-5 w-5 text-brand-600" /> Recibos</h2>
            {!data.finances?.receipts?.length ? <EmptyState compact title="Sin recibos emitidos" message="Los recibos de pagos aprobados aparecerán aquí." /> : (
              <ul className="divide-y divide-slate-100">
                {data.finances.receipts.map((receipt) => (
                  <li key={receipt.id} className="flex items-center gap-3 py-4">
                    <Receipt className="h-5 w-5 text-brand-600" />
                    <div className="min-w-0 flex-1"><p className="truncate font-bold">{receipt.concept}</p><p className="text-xs text-slate-500">#{receipt.number} · {new Date(receipt.issuedAt).toLocaleDateString('es-ES')}</p></div>
                    <strong>{money(receipt.amount, receipt.currency)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div id="anuncios" className="scroll-mt-24 rounded-3xl border border-brand-100 bg-white p-5 shadow-sm md:p-7">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-black"><Bell className="h-5 w-5 text-brand-600" /> Anuncios</h2>
              {!data.announcements?.length ? <EmptyState compact title="Sin anuncios" /> : <div className="space-y-4">{data.announcements.map((announcement) => <article key={announcement.id}><p className="text-xs text-slate-500">{new Date(announcement.publishedAt).toLocaleDateString('es-ES')}</p><h3 className="font-black">{announcement.title}</h3><p className="mt-1 whitespace-pre-line text-sm text-slate-600">{announcement.body}</p></article>)}</div>}
            </div>
            <div className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm md:p-7">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-black"><TrendingUp className="h-5 w-5 text-brand-600" /> Progreso reciente</h2>
              {!data.progress?.length ? <EmptyState compact title="Sin mediciones recientes" /> : <div className="space-y-3">{data.progress.map((entry, index) => <article key={`${entry.childId}-${entry.metric}-${index}`} className="rounded-2xl bg-brand-50 p-4"><p className="text-xs font-bold uppercase text-brand-700">{entry.childName}</p><div className="mt-1 flex items-end justify-between gap-3"><div><h3 className="font-bold">{entry.metric}</h3><p className="text-xs text-slate-500">{new Date(entry.recordedAt).toLocaleDateString('es-ES')}</p></div><p className="text-xl font-black text-brand-800">{entry.value}</p></div>{entry.previousValue && <p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><Clock3 className="h-3 w-3" /> Anterior: {entry.previousValue}</p>}</article>)}</div>}
            </div>
          </section>
        </div>
    );
  }

  return (
    <AppShell title="Portal familiar" subtitle="Agenda, pagos y progreso en un solo lugar">
      {content}
    </AppShell>
  );
};

export default ParentPortal;
