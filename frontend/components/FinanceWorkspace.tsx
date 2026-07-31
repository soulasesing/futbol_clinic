import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Banknote, Check, ChevronRight, FileCheck2, Plus, Receipt, Tags, WalletCards, X } from 'lucide-react';
import AppShell from './AppShell';
import { EmptyState, ErrorState, LoadingState } from './AsyncStates';
import { useAuth } from '../contexts/AuthContext';
import { api, unwrapCollection } from '../utils/api';

export type FinanceSection = 'resumen' | 'cuentas' | 'conceptos' | 'cargos' | 'comprobantes' | 'recibos' | 'cartera';

interface FinanceItem {
  id: string;
  name?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  accountType?: string;
  currency?: string;
  description?: string;
  amount?: number;
  balance?: number;
  totalCents?: number;
  balanceCents?: number;
  amountCents?: number;
  defaultAmountCents?: number;
  status?: string;
  familyName?: string;
  playerName?: string;
  concept?: string;
  dueDate?: string;
  submittedAt?: string;
  issuedAt?: string;
  number?: string;
  receiptNumber?: string;
  proofFilename?: string;
}

interface FinanceSummary {
  chargedCents: number;
  paidCents: number;
  refundedCents: number;
  pendingSubmissions: number;
  openCharges: number;
}

const sectionConfig: Record<FinanceSection, { title: string; endpoint?: string; key?: string; description: string }> = {
  resumen: { title: 'Finanzas', description: 'Configura cobros y controla la cartera de la escuela.' },
  cuentas: { title: 'Cuentas de recaudo', endpoint: '/v1/finance/accounts', key: 'accounts', description: 'Datos e instrucciones que verán las familias.' },
  conceptos: { title: 'Conceptos de cobro', endpoint: '/v1/finance/concepts', key: 'concepts', description: 'Matrículas, mensualidades y otros conceptos.' },
  cargos: { title: 'Cargos', endpoint: '/v1/finance/charges', key: 'charges', description: 'Obligaciones asignadas a jugadores o familias.' },
  comprobantes: { title: 'Comprobantes pendientes', endpoint: '/v1/finance/payment-proofs?status=pending', key: 'proofs', description: 'Aprueba o rechaza soportes enviados por las familias.' },
  recibos: { title: 'Recibos', endpoint: '/v1/finance/receipts', key: 'receipts', description: 'Comprobantes oficiales de pagos aprobados.' },
  cartera: { title: 'Cartera', endpoint: '/v1/finance/portfolio', key: 'portfolio', description: 'Saldos pendientes y vencidos por familia.' },
};

const financeLinks: Array<{ section: FinanceSection; icon: typeof WalletCards }> = [
  { section: 'cuentas', icon: WalletCards },
  { section: 'conceptos', icon: Tags },
  { section: 'cargos', icon: Banknote },
  { section: 'comprobantes', icon: FileCheck2 },
  { section: 'recibos', icon: Receipt },
  { section: 'cartera', icon: Banknote },
];

const getItemTitle = (item: FinanceItem): string =>
  item.name || item.concept || item.bankName || item.familyName
  || `Registro ${item.receiptNumber || item.number || ''}`;

interface FinanceWorkspaceProps {
  section: FinanceSection;
}

const FinanceWorkspace: React.FC<FinanceWorkspaceProps> = ({ section }) => {
  const { jwt } = useAuth();
  const config = sectionConfig[section];
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      if (section === 'resumen') {
        setSummary(await api.get<FinanceSummary>('/v1/finance/admin/summary', jwt));
        return;
      }
      if (!config.endpoint || !config.key) return;
      const response = await api.get<unknown>(config.endpoint, jwt);
      setItems(unwrapCollection<FinanceItem>(response, config.key));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar finanzas.');
    } finally {
      setLoading(false);
    }
  }, [config.endpoint, config.key, jwt, section]);

  useEffect(() => { void load(); }, [load]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!config.endpoint) return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    let payload: Record<string, unknown> = values;
    if (section === 'conceptos') {
      payload = {
        ...values,
        currency: values.currency || 'USD',
        defaultAmountCents: values.defaultAmount
          ? Math.round(Number(values.defaultAmount) * 100)
          : undefined,
      };
      delete payload.defaultAmount;
    } else if (section === 'cargos') {
      const amountCents = Math.round(Number(values.amount) * 100);
      payload = {
        householdId: values.householdId,
        playerId: values.playerId || undefined,
        description: values.description,
        dueOn: values.dueOn,
        currency: values.currency || 'USD',
        items: [{
          feeConceptId: values.feeConceptId || undefined,
          description: values.description,
          quantity: 1,
          unitAmountCents: amountCents,
        }],
      };
    } else if (section === 'cuentas') {
      payload = { ...values, currency: values.currency || 'USD' };
    }
    try {
      setBusyId('create');
      setError('');
      await api.post(config.endpoint, payload, jwt);
      setShowForm(false);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible guardar.');
    } finally {
      setBusyId(null);
    }
  };

  const reviewProof = async (id: string, decision: 'approved' | 'rejected'): Promise<void> => {
    const reviewNote = decision === 'rejected' ? window.prompt('Motivo del rechazo:') : undefined;
    if (decision === 'rejected' && !reviewNote) return;
    try {
      setBusyId(id);
      await api.patch(`/v1/finance/payment-proofs/${id}`, { decision, reviewNote }, jwt);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible revisar el comprobante.');
    } finally {
      setBusyId(null);
    }
  };

  const openProof = async (id: string): Promise<void> => {
    try {
      setBusyId(id);
      const proof = await api.blob(`/v1/finance/payment-proofs/${id}/file`, jwt);
      const objectUrl = URL.createObjectURL(proof);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible abrir el comprobante.');
    } finally {
      setBusyId(null);
    }
  };

  const canCreate = ['cuentas', 'conceptos', 'cargos'].includes(section);
  const amount = (value = 0, currency = 'USD'): string =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(value);

  return (
    <AppShell
      title={config.title}
      subtitle={config.description}
      actions={canCreate ? <button type="button" onClick={() => setShowForm((value) => !value)} className="brand-gradient brand-focus inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nuevo</span></button> : undefined}
    >
      <nav className="mb-6 flex gap-2 overflow-x-auto pb-2" aria-label="Secciones de finanzas">
        {financeLinks.map((link) => <Link key={link.section} href={`/finanzas/${link.section}`} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${section === link.section ? 'brand-gradient' : 'bg-white text-slate-600'}`}>{sectionConfig[link.section].title}</Link>)}
      </nav>

      {section === 'resumen' ? (
        <div className="space-y-6">
          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onAction={() => void load()} />}
          {!loading && !error && summary && (
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Resumen financiero">
              <SummaryCard label="Facturado" value={amount(summary.chargedCents / 100)} />
              <SummaryCard label="Recaudado" value={amount(summary.paidCents / 100)} />
              <SummaryCard label="Reembolsado" value={amount(summary.refundedCents / 100)} />
              <SummaryCard label="Comprobantes pendientes" value={String(summary.pendingSubmissions)} />
              <SummaryCard label="Cargos abiertos" value={String(summary.openCharges)} />
            </section>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {financeLinks.map(({ section: target, icon: Icon }) => (
              <Link key={target} href={`/finanzas/${target}`} className="group rounded-3xl border border-brand-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <span className="inline-flex rounded-2xl bg-brand-50 p-3"><Icon className="h-6 w-6 text-brand-700" /></span>
                <h2 className="mt-5 text-lg font-black">{sectionConfig[target].title}</h2>
                <p className="mt-1 text-sm text-slate-500">{sectionConfig[target].description}</p>
                <span className="mt-4 flex items-center gap-1 text-sm font-bold text-brand-700">Abrir <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {showForm && (
            <form onSubmit={(event) => void handleCreate(event)} className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                {section === 'cuentas' && <><Field name="name" label="Nombre visible" required /><Field name="bankName" label="Banco o entidad" /><Field name="accountHolder" label="Titular" /><Field name="accountNumber" label="Número de cuenta" /><SelectField name="accountType" label="Tipo de cuenta" options={[['bank', 'Cuenta bancaria'], ['wallet', 'Billetera'], ['cash', 'Efectivo']]} /><Field name="currency" label="Moneda" defaultValue="USD" required /><Field name="instructions" label="Instrucciones para las familias" required wide /></>}
                {section === 'conceptos' && <><Field name="name" label="Nombre del concepto" required /><Field name="defaultAmount" label="Valor predeterminado" type="number" step="0.01" /><Field name="currency" label="Moneda" defaultValue="USD" required /><Field name="description" label="Descripción" wide /></>}
                {section === 'cargos' && <><Field name="householdId" label="ID de familia" required /><Field name="playerId" label="ID de deportista (opcional)" /><Field name="feeConceptId" label="ID de concepto (opcional)" /><Field name="description" label="Descripción" required /><Field name="amount" label="Valor" type="number" step="0.01" required /><Field name="currency" label="Moneda" defaultValue="USD" required /><Field name="dueOn" label="Fecha de vencimiento" type="date" required /></>}
              </div>
              <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600">Cancelar</button><button type="submit" disabled={busyId === 'create'} className="brand-gradient rounded-xl px-4 py-2 text-sm font-bold">{busyId === 'create' ? 'Guardando…' : 'Guardar'}</button></div>
            </form>
          )}
          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onAction={() => void load()} />}
          {!loading && !error && !items.length && <EmptyState title={`Sin ${config.title.toLocaleLowerCase('es-ES')}`} />}
          {!loading && !error && items.length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm">
              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-black">{getItemTitle(item)}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {[item.playerName, item.accountHolder, item.accountNumber, item.description, item.dueDate && `Vence ${new Date(item.dueDate).toLocaleDateString('es-ES')}`, item.submittedAt && `Enviado ${new Date(item.submittedAt).toLocaleDateString('es-ES')}`, item.issuedAt && `Emitido ${new Date(item.issuedAt).toLocaleDateString('es-ES')}`].filter(Boolean).join(' · ')}
                      </p>
                      {item.status && <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{item.status}</span>}
                    </div>
                    {(item.amount !== undefined || item.balance !== undefined || item.totalCents !== undefined || item.balanceCents !== undefined || item.amountCents !== undefined || item.defaultAmountCents !== undefined) && <strong className="text-lg">{amount(item.amount ?? item.balance ?? ((item.balanceCents ?? item.amountCents ?? item.totalCents ?? item.defaultAmountCents ?? 0) / 100), item.currency)}</strong>}
                    {section === 'comprobantes' && <div className="flex gap-2"><button type="button" disabled={busyId === item.id} onClick={() => void openProof(item.id)} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold">Ver soporte</button><button type="button" disabled={busyId === item.id} onClick={() => void reviewProof(item.id, 'approved')} className="brand-gradient rounded-xl p-2" aria-label="Aprobar comprobante"><Check className="h-4 w-4" /></button><button type="button" disabled={busyId === item.id} onClick={() => void reviewProof(item.id, 'rejected')} className="rounded-xl bg-red-50 p-2 text-red-700" aria-label="Rechazar comprobante"><X className="h-4 w-4" /></button></div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
};

interface FieldProps {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  wide?: boolean;
  step?: string;
  defaultValue?: string;
}

const Field: React.FC<FieldProps> = ({ name, label, type = 'text', required, wide, step, defaultValue }) => (
  <label className={`text-sm font-bold text-slate-700 ${wide ? 'md:col-span-2' : ''}`}>{label}<input name={name} type={type} required={required} step={step} defaultValue={defaultValue} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label>
);

interface SelectFieldProps {
  name: string;
  label: string;
  options: Array<[string, string]>;
}

const SelectField: React.FC<SelectFieldProps> = ({ name, label, options }) => (
  <label className="text-sm font-bold text-slate-700">{label}<select name={name} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
);

const SummaryCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <article className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-xl font-black text-slate-900">{value}</p>
  </article>
);

export default FinanceWorkspace;
