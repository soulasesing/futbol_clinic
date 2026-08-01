import React, { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Megaphone, Plus, Save, Tags, Trash2 } from 'lucide-react';
import AppShell from '../components/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import { ErrorState, LoadingState } from '../components/AsyncStates';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

type Tab = 'settings' | 'posts' | 'pricing';

interface LandingSettings {
  landing_enabled: boolean;
  landing_headline?: string;
  landing_subheadline?: string;
  landing_cta_label?: string;
  slug: string;
}

interface LandingPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  image_url?: string;
  status: 'draft' | 'published';
}

interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  price_label: string;
  billing_period?: string;
  features: string[];
  cta_label: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

interface LandingAdminData {
  settings: LandingSettings;
  posts: LandingPost[];
  pricing: PricingPlan[];
}

interface PostForm {
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  status: 'draft' | 'published';
}

interface PlanForm {
  name: string;
  description: string;
  priceLabel: string;
  billingPeriod: string;
  featuresText: string;
  ctaLabel: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
}

const emptyPost: PostForm = {
  title: '',
  excerpt: '',
  content: '',
  imageUrl: '',
  status: 'draft',
};

const emptyPlan: PlanForm = {
  name: '',
  description: '',
  priceLabel: '',
  billingPeriod: 'por mes',
  featuresText: '',
  ctaLabel: 'Solicitar información',
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
};

const fieldClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const cardClass = 'rounded-3xl border border-brand-100 bg-white p-5 shadow-sm md:p-7';

const LandingAdminPage: React.FC = () => {
  const { jwt } = useAuth();
  const [tab, setTab] = useState<Tab>('settings');
  const [data, setData] = useState<LandingAdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [postId, setPostId] = useState<string>();
  const [post, setPost] = useState(emptyPost);
  const [planId, setPlanId] = useState<string>();
  const [plan, setPlan] = useState(emptyPlan);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      setData(await apiRequest<LandingAdminData>('/landing', { token: jwt }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar la portada');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    void load();
  }, [load]);

  const notifySuccess = (message: string): void => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(''), 3500);
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await apiRequest<{ url: string }>('/upload/branding', {
        method: 'POST',
        body: formData,
        token: jwt,
      });
      setPost((current) => ({ ...current, imageUrl: result.url }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible subir la imagen');
    } finally {
      setSaving(false);
    }
  };

  const handleSettings = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!data) return;
    setSaving(true);
    setError('');
    try {
      await apiRequest('/landing/settings', {
        method: 'PUT',
        token: jwt,
        body: {
          enabled: data.settings.landing_enabled,
          headline: data.settings.landing_headline,
          subheadline: data.settings.landing_subheadline,
          ctaLabel: data.settings.landing_cta_label,
        },
      });
      notifySuccess('Portada actualizada');
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible guardar');
    } finally {
      setSaving(false);
    }
  };

  const handlePost = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiRequest(postId ? `/landing/posts/${postId}` : '/landing/posts', {
        method: postId ? 'PUT' : 'POST',
        token: jwt,
        body: { ...post },
      });
      setPostId(undefined);
      setPost(emptyPost);
      notifySuccess(postId ? 'Publicación actualizada' : 'Publicación creada');
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible guardar');
    } finally {
      setSaving(false);
    }
  };

  const handlePlan = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiRequest(planId ? `/landing/pricing/${planId}` : '/landing/pricing', {
        method: planId ? 'PUT' : 'POST',
        token: jwt,
        body: {
          ...plan,
          features: plan.featuresText.split('\n').map((item) => item.trim()).filter(Boolean),
        },
      });
      setPlanId(undefined);
      setPlan(emptyPlan);
      notifySuccess(planId ? 'Programa actualizado' : 'Programa creado');
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (resource: 'posts' | 'pricing', id: string): Promise<void> => {
    if (!window.confirm('¿Eliminar este contenido de forma permanente?')) return;
    try {
      await apiRequest(`/landing/${resource}/${id}`, { method: 'DELETE', token: jwt });
      notifySuccess('Contenido eliminado');
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible eliminar');
    }
  };

  const selectPost = (item: LandingPost): void => {
    setPostId(item.id);
    setPost({
      title: item.title,
      excerpt: item.excerpt,
      content: item.content || '',
      imageUrl: item.image_url || '',
      status: item.status,
    });
  };

  const selectPlan = (item: PricingPlan): void => {
    setPlanId(item.id);
    setPlan({
      name: item.name,
      description: item.description || '',
      priceLabel: item.price_label,
      billingPeriod: item.billing_period || '',
      featuresText: item.features.join('\n'),
      ctaLabel: item.cta_label,
      isFeatured: item.is_featured,
      isActive: item.is_active,
      sortOrder: item.sort_order,
    });
  };

  const updateSettings = (patch: Partial<LandingSettings>): void => {
    setData((current) => current
      ? { ...current, settings: { ...current.settings, ...patch } }
      : current);
  };

  return (
    <ProtectedRoute roles={['admin']}>
      <AppShell
        title="Portada pública"
        subtitle="Gestiona noticias, programas y el contenido que ven las familias."
        actions={data?.settings.slug ? (
          <Link href={`/escuela/${data.settings.slug}`} target="_blank" className="brand-gradient flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black">
            Ver portada <ExternalLink className="h-4 w-4" />
          </Link>
        ) : null}
      >
        {loading ? <LoadingState message="Preparando el editor de la academia…" /> : null}
        {!loading && error && !data ? <ErrorState message={error} onAction={() => void load()} /> : null}
        {!loading && data ? (
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm">
              {([
                ['settings', 'Portada', Save],
                ['posts', 'Noticias', Megaphone],
                ['pricing', 'Programas y precios', Tags],
              ] as const).map(([value, label, Icon]) => (
                <button key={value} type="button" onClick={() => setTab(value)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-black ${tab === value ? 'brand-gradient' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
            {success && <output className="block rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-800">{success}</output>}

            {tab === 'settings' && (
              <form onSubmit={(event) => void handleSettings(event)} className={cardClass}>
                <h2 className="text-xl font-black">Mensaje principal</h2>
                <label className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-brand-50 p-4 text-sm font-bold">
                  <span>Publicar la portada</span>
                  <input type="checkbox" checked={data.settings.landing_enabled} onChange={(event) => updateSettings({ landing_enabled: event.target.checked })} className="h-5 w-5 accent-brand-700" />
                </label>
                <label className="mt-5 block text-sm font-bold">
                  <span>Título principal</span>
                  <input value={data.settings.landing_headline || ''} onChange={(event) => updateSettings({ landing_headline: event.target.value })} maxLength={180} className={fieldClass} placeholder="Formamos campeones dentro y fuera de la cancha" />
                </label>
                <label className="mt-5 block text-sm font-bold">
                  <span>Mensaje de bienvenida</span>
                  <textarea value={data.settings.landing_subheadline || ''} onChange={(event) => updateSettings({ landing_subheadline: event.target.value })} maxLength={1000} rows={4} className={fieldClass} />
                </label>
                <label className="mt-5 block text-sm font-bold">
                  <span>Texto del botón de acceso</span>
                  <input value={data.settings.landing_cta_label || ''} onChange={(event) => updateSettings({ landing_cta_label: event.target.value })} maxLength={80} className={fieldClass} />
                </label>
                <button type="submit" disabled={saving} className="brand-gradient mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 font-black disabled:opacity-50">
                  <Save className="h-4 w-4" /> {saving ? 'Guardando…' : 'Guardar portada'}
                </button>
              </form>
            )}

            {tab === 'posts' && (
              <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                <form onSubmit={(event) => void handlePost(event)} className={cardClass}>
                  <h2 className="text-xl font-black">{postId ? 'Editar noticia' : 'Nueva noticia'}</h2>
                  <label className="mt-5 block text-sm font-bold">Título<input required maxLength={180} value={post.title} onChange={(event) => setPost({ ...post, title: event.target.value })} className={fieldClass} /></label>
                  <label className="mt-5 block text-sm font-bold">Resumen<textarea required maxLength={320} rows={3} value={post.excerpt} onChange={(event) => setPost({ ...post, excerpt: event.target.value })} className={fieldClass} /></label>
                  <label className="mt-5 block text-sm font-bold">Contenido ampliado<textarea maxLength={10000} rows={5} value={post.content} onChange={(event) => setPost({ ...post, content: event.target.value })} className={fieldClass} /></label>
                  <label className="mt-5 block text-sm font-bold">Imagen pública<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadImage(event)} className={fieldClass} /></label>
                  {post.imageUrl && <img src={post.imageUrl} alt="Vista previa" className="mt-4 h-40 w-full rounded-2xl object-cover" />}
                  <label className="mt-5 block text-sm font-bold">Estado<select value={post.status} onChange={(event) => setPost({ ...post, status: event.target.value as 'draft' | 'published' })} className={fieldClass}><option value="draft">Borrador</option><option value="published">Publicado</option></select></label>
                  <div className="mt-6 flex gap-3">
                    <button type="submit" disabled={saving} className="brand-gradient inline-flex items-center gap-2 rounded-xl px-5 py-3 font-black disabled:opacity-50"><Save className="h-4 w-4" /> Guardar</button>
                    {postId && <button type="button" onClick={() => { setPostId(undefined); setPost(emptyPost); }} className="rounded-xl border px-5 py-3 font-bold">Cancelar</button>}
                  </div>
                </form>
                <div className="space-y-3">
                  {data.posts.map((item) => (
                    <article key={item.id} className={cardClass}>
                      <div className="flex items-start justify-between gap-4">
                        <div><span className={`text-xs font-black uppercase ${item.status === 'published' ? 'text-green-700' : 'text-amber-700'}`}>{item.status === 'published' ? 'Publicado' : 'Borrador'}</span><h3 className="mt-1 font-black">{item.title}</h3><p className="mt-2 text-sm text-slate-500">{item.excerpt}</p></div>
                        <button type="button" onClick={() => void remove('posts', item.id)} aria-label="Eliminar noticia" className="rounded-xl p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <button type="button" onClick={() => selectPost(item)} className="mt-4 text-sm font-black text-brand-700">Editar noticia</button>
                    </article>
                  ))}
                  {!data.posts.length && <p className={`${cardClass} text-center text-sm text-slate-500`}>Todavía no hay noticias.</p>}
                </div>
              </div>
            )}

            {tab === 'pricing' && (
              <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                <form onSubmit={(event) => void handlePlan(event)} className={cardClass}>
                  <h2 className="text-xl font-black">{planId ? 'Editar programa' : 'Nuevo programa o precio'}</h2>
                  <label className="mt-5 block text-sm font-bold">Nombre<input required maxLength={120} value={plan.name} onChange={(event) => setPlan({ ...plan, name: event.target.value })} className={fieldClass} /></label>
                  <label className="mt-5 block text-sm font-bold">Descripción<textarea maxLength={320} rows={3} value={plan.description} onChange={(event) => setPlan({ ...plan, description: event.target.value })} className={fieldClass} /></label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="mt-5 block text-sm font-bold">Precio visible<input required maxLength={100} value={plan.priceLabel} onChange={(event) => setPlan({ ...plan, priceLabel: event.target.value })} className={fieldClass} placeholder="$60 USD" /></label>
                    <label className="mt-5 block text-sm font-bold">Periodo<input maxLength={40} value={plan.billingPeriod} onChange={(event) => setPlan({ ...plan, billingPeriod: event.target.value })} className={fieldClass} placeholder="por mes" /></label>
                  </div>
                  <label className="mt-5 block text-sm font-bold">Beneficios (uno por línea)<textarea rows={5} value={plan.featuresText} onChange={(event) => setPlan({ ...plan, featuresText: event.target.value })} className={fieldClass} /></label>
                  <label className="mt-5 block text-sm font-bold">Texto del botón<input maxLength={80} value={plan.ctaLabel} onChange={(event) => setPlan({ ...plan, ctaLabel: event.target.value })} className={fieldClass} /></label>
                  <div className="mt-5 flex flex-wrap gap-5">
                    <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={plan.isFeatured} onChange={(event) => setPlan({ ...plan, isFeatured: event.target.checked })} /> Destacado</label>
                    <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={plan.isActive} onChange={(event) => setPlan({ ...plan, isActive: event.target.checked })} /> Visible</label>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button type="submit" disabled={saving} className="brand-gradient inline-flex items-center gap-2 rounded-xl px-5 py-3 font-black disabled:opacity-50"><Plus className="h-4 w-4" /> Guardar programa</button>
                    {planId && <button type="button" onClick={() => { setPlanId(undefined); setPlan(emptyPlan); }} className="rounded-xl border px-5 py-3 font-bold">Cancelar</button>}
                  </div>
                </form>
                <div className="space-y-3">
                  {data.pricing.map((item) => (
                    <article key={item.id} className={cardClass}>
                      <div className="flex items-start justify-between gap-4">
                        <div><p className="text-xs font-black uppercase text-brand-700">{item.is_active ? 'Visible' : 'Oculto'}</p><h3 className="mt-1 font-black">{item.name}</h3><p className="mt-2 text-2xl font-black text-brand-700">{item.price_label}</p></div>
                        <button type="button" onClick={() => void remove('pricing', item.id)} aria-label="Eliminar programa" className="rounded-xl p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <button type="button" onClick={() => selectPlan(item)} className="mt-4 text-sm font-black text-brand-700">Editar programa</button>
                    </article>
                  ))}
                  {!data.pricing.length && <p className={`${cardClass} text-center text-sm text-slate-500`}>Todavía no hay programas publicados.</p>}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </AppShell>
    </ProtectedRoute>
  );
};

export default LandingAdminPage;
