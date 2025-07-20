import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

interface Tenant {
  id: string;
  nombre: string;
  email_contacto: string;
  logo_url?: string;
  banner_url?: string;
  responsable_nombre?: string;
}

const PAGE_SIZE = 10;

const uploadImage = async (file: File): Promise<string | null> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Error al subir imagen');
  const data = await res.json();
  return data.url;
};

const TenantsPage: React.FC = () => {
  const { isAuthenticated, user, jwt } = useAuth() as any;
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<Tenant[]>([]);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [responsableWarning, setResponsableWarning] = useState(false);

  // Fetch tenants
  const fetchTenants = () => {
    fetch('/api/tenants', { headers: { Authorization: `Bearer ${jwt}` } })
      .then(res => res.json())
      .then(data => setTenants(Array.isArray(data) ? data : data.tenants || []))
      .catch(() => setTenants([]));
  };
  useEffect(fetchTenants, [jwt]);

  // Búsqueda instantánea
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      tenants.filter(t =>
        t.nombre.toLowerCase().includes(q) ||
        t.email_contacto.toLowerCase().includes(q)
      )
    );
    setPage(1);
  }, [search, tenants]);

  // Paginación
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // Crear escuela
  const handleSave = async (form: HTMLFormElement) => {
    setFormLoading(true);
    setFormError('');
    try {
      const nombre = (form.elements.namedItem('nombre') as HTMLInputElement).value;
      const email_contacto = (form.elements.namedItem('email_contacto') as HTMLInputElement).value;
      const responsable_nombre = (form.elements.namedItem('responsable_nombre') as HTMLInputElement).value;
      let logo_url: string | undefined = editTenant?.logo_url;
      let banner_url: string | undefined = editTenant?.banner_url;
      const logoFile = logoInputRef.current?.files?.[0];
      const bannerFile = bannerInputRef.current?.files?.[0];
      if (logoFile) logo_url = (await uploadImage(logoFile)) ?? undefined;
      if (bannerFile) banner_url = (await uploadImage(bannerFile)) ?? undefined;
      const payload = { nombre, email_contacto, responsable_nombre, logo_url, banner_url };
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error al crear escuela');
      fetchTenants();
      setShowForm(false);
      setEditTenant(null);
      setLogoPreview(null);
      setBannerPreview(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'super_admin') return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white px-4 py-12">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 bg-clip-text text-transparent drop-shadow">Escuelas de Fútbol</h1>
            <button
              onClick={() => { setShowForm(true); setEditTenant(null); setLogoPreview(null); setBannerPreview(null); }}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              + Nueva escuela
            </button>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md mb-4 rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {paginated.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No hay escuelas para mostrar.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {paginated.map(tenant => (
                <div
                  key={tenant.id}
                  className="[perspective:1000px] cursor-pointer"
                  onClick={async () => {
                    if (flippedId === tenant.id) {
                      setFlippedId(null);
                    } else {
                      setFlippedId(tenant.id);
                      setSelectedTenant(tenant);
                      setDetailLoading(true);
                      try {
                        const res = await fetch(`/api/tenants/${tenant.id}/detail`, { headers: { Authorization: `Bearer ${jwt}` } });
                        const data = await res.json();
                        setDetail(data);
                      } catch {
                        setDetail(null);
                      } finally {
                        setDetailLoading(false);
                      }
                    }
                  }}
                >
                  <div className={`relative w-full h-64 transition-transform duration-700 [transform-style:preserve-3d] ${flippedId === tenant.id ? '[transform:rotateY(180deg)]' : ''}`}> 
                    {/* Cara frontal */}
                    <div className="absolute inset-0 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center gap-4 [backface-visibility:hidden] border border-emerald-100">
                      {tenant.logo_url ? (
                        <img src={tenant.logo_url} alt="Logo" className="w-20 h-20 rounded-full object-cover border" />
                      ) : (
                        <span className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-3xl shadow">
                          {tenant.nombre.charAt(0)}
                        </span>
                      )}
                      <div className="text-xl font-bold text-emerald-700 text-center">{tenant.nombre}</div>
                    </div>
                    {/* Cara trasera */}
                    <div className="absolute inset-0 bg-white rounded-2xl shadow-xl p-4 flex flex-col justify-center [transform:rotateY(180deg)] [backface-visibility:hidden] border border-emerald-100">
                      <button
                        onClick={e => { e.stopPropagation(); setFlippedId(null); }}
                        className="absolute top-2 right-2 text-emerald-700 hover:text-red-500 text-2xl font-bold"
                        aria-label="Cerrar"
                      >×</button>
                      <div className="mb-2"><span className="font-semibold">Email:</span> {tenant.email_contacto}</div>
                      {tenant.banner_url && (
                        <div className="mb-2 flex items-center gap-2"><span className="font-semibold">Banner:</span><img src={tenant.banner_url} alt="Banner" className="w-20 h-10 rounded object-cover border" /></div>
                      )}
                      {detailLoading && selectedTenant?.id === tenant.id ? (
                        <div className="text-emerald-600 text-center py-4">Cargando detalle...</div>
                      ) : detail && selectedTenant?.id === tenant.id ? (
                        <>
                          <div className="mb-2"><span className="font-semibold">Jugadores:</span> {detail.cantidad_jugadores}</div>
                          <div className="mb-2"><span className="font-semibold">Entrenadores:</span> {detail.cantidad_entrenadores}</div>
                          <div className="mb-2">
                            <span className="font-semibold">Equipos:</span>
                            {detail.equipos.length === 0 ? (
                              <span className="ml-2 text-gray-400">No hay equipos</span>
                            ) : (
                              <ul className="ml-4 list-disc">
                                {detail.equipos.map((team: any) => (
                                  <li key={team.id}>{team.nombre}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          {/* Botones de acción */}
                          <div className="flex gap-2 mt-4 justify-center">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setEditTenant(tenant);
                                setShowForm(true);
                                setLogoPreview(tenant.logo_url || null);
                                setBannerPreview(tenant.banner_url || null);
                                setFlippedId(null);
                              }}
                              className="px-3 py-1 rounded bg-emerald-100 text-emerald-700 font-bold hover:bg-emerald-200"
                            >
                              Editar
                            </button>
                            <button
                              onClick={async e => {
                                e.stopPropagation();
                                if (confirm('¿Seguro que deseas eliminar esta escuela?')) {
                                  await fetch(`/api/tenants/${tenant.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${jwt}` } });
                                  fetchTenants();
                                  setFlippedId(null);
                                }
                              }}
                              className="px-3 py-1 rounded bg-red-100 text-red-700 font-bold hover:bg-red-200"
                            >
                              Eliminar
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-red-600 text-center py-4">No se pudo cargar el detalle.</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`px-3 py-1 rounded-full font-bold ${n === page ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          {/* Formulario modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
                <button
                  onClick={() => { setShowForm(false); setEditTenant(null); setLogoPreview(null); setBannerPreview(null); }}
                  className="absolute top-2 right-2 text-emerald-700 hover:text-red-500 text-2xl font-bold"
                  aria-label="Cerrar"
                >
                  ×
                </button>
                <h2 className="text-2xl font-bold mb-4 text-emerald-700">{editTenant ? 'Editar escuela' : 'Nueva escuela'}</h2>
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    if (editTenant) {
                      // Editar
                      setFormLoading(true);
                      setFormError('');
                      try {
                        const form = e.target as HTMLFormElement;
                        const nombre = (form.elements.namedItem('nombre') as HTMLInputElement).value;
                        const email_contacto = (form.elements.namedItem('email_contacto') as HTMLInputElement).value;
                        const responsable_nombre = (form.elements.namedItem('responsable_nombre') as HTMLInputElement).value;
                        let logo_url: string | undefined = editTenant.logo_url;
                        let banner_url: string | undefined = editTenant.banner_url;
                        const logoFile = logoInputRef.current?.files?.[0];
                        const bannerFile = bannerInputRef.current?.files?.[0];
                        if (logoFile) logo_url = (await uploadImage(logoFile)) ?? undefined;
                        if (bannerFile) banner_url = (await uploadImage(bannerFile)) ?? undefined;
                        const payload = { nombre, email_contacto, logo_url, banner_url, responsable_nombre };
                        const res = await fetch(`/api/tenants/${editTenant.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
                          body: JSON.stringify(payload),
                        });
                        if (!res.ok) throw new Error('Error al editar escuela');
                        fetchTenants();
                        setShowForm(false);
                        setEditTenant(null);
                        setLogoPreview(null);
                        setBannerPreview(null);
                        setResponsableWarning(false);
                      } catch (err: any) {
                        setFormError(err.message);
                      } finally {
                        setFormLoading(false);
                      }
                    } else {
                      await handleSave(e.target as HTMLFormElement);
                    }
                  }}
                  className="flex flex-col gap-4"
                >
                  <input
                    name="nombre"
                    defaultValue={editTenant?.nombre || ''}
                    placeholder="Nombre de la escuela"
                    required
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <input
                    name="email_contacto"
                    type="email"
                    defaultValue={editTenant?.email_contacto || ''}
                    placeholder="Email del responsable"
                    required
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <input
                    name="responsable_nombre"
                    defaultValue={editTenant?.responsable_nombre || ''}
                    placeholder="Nombre del responsable"
                    required
                    onChange={e => {
                      if (editTenant && e.target.value !== editTenant.responsable_nombre) setResponsableWarning(true);
                      else setResponsableWarning(false);
                    }}
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  {responsableWarning && (
                    <div className="text-yellow-600 text-sm text-center font-semibold">Estás cambiando el nombre del administrador de la escuela.</div>
                  )}
                  {/* Subida de logo */}
                  <div className="flex flex-col gap-2">
                    <label className="font-medium text-gray-700">Logo (opcional)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      ref={logoInputRef}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => setLogoPreview(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        } else {
                          setLogoPreview(editTenant?.logo_url || null);
                        }
                      }}
                      className="border border-emerald-200 rounded px-2 py-1"
                    />
                    {logoPreview && (
                      <img src={logoPreview || undefined} alt="Preview logo" className="w-20 h-20 rounded-full object-cover border mt-2 mx-auto" />
                    )}
                  </div>
                  {/* Subida de banner */}
                  <div className="flex flex-col gap-2">
                    <label className="font-medium text-gray-700">Banner (opcional)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      ref={bannerInputRef}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => setBannerPreview(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        } else {
                          setBannerPreview(editTenant?.banner_url || null);
                        }
                      }}
                      className="border border-emerald-200 rounded px-2 py-1"
                    />
                    {bannerPreview && (
                      <img src={bannerPreview || undefined} alt="Preview banner" className="w-32 h-12 rounded object-cover border mt-2 mx-auto" />
                    )}
                  </div>
                  {formError && <div className="text-red-600 text-sm text-center">{formError}</div>}
                  <button
                    type="submit"
                    className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-2 rounded-lg shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Guardando...' : editTenant ? 'Guardar cambios' : 'Crear escuela'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      {/* Modal de detalle */}
      {/* (El modal de detalle anterior ya no es necesario, ahora el detalle está en el flip card) */}
    </>
  );
};

export default TenantsPage; 