import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

interface Coach {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  foto_url?: string;
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

const CoachesPage: React.FC = () => {
  const { isAuthenticated, jwt } = useAuth() as any;
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<Coach[]>([]);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editCoach, setEditCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch coaches
  const fetchCoaches = () => {
    setLoading(true);
    fetch('/api/coaches', { headers: { Authorization: `Bearer ${jwt}` } })
      .then(res => res.json())
      .then(data => setCoaches(Array.isArray(data) ? data : data.coaches || []))
      .catch(() => setCoaches([]))
      .finally(() => setLoading(false));
  };
  useEffect(fetchCoaches, [jwt]);

  // Búsqueda instantánea
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      coaches.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.apellido.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.telefono.toLowerCase().includes(q)
      )
    );
    setPage(1);
  }, [search, coaches]);

  // Paginación
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // Crear/editar entrenador
  const handleSave = async (coach: Coach, file?: File) => {
    setFormLoading(true);
    setFormError('');
    try {
      let foto_url: string | undefined = coach.foto_url ?? undefined;
      if (file) {
        const uploaded = await uploadImage(file);
        foto_url = uploaded ?? undefined;
      }
      if (editCoach) {
        // Editar
        const res = await fetch(`/api/coaches/${editCoach.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
          body: JSON.stringify({ ...coach, foto_url }),
        });
        if (!res.ok) throw new Error('Error al editar entrenador');
      } else {
        // Crear
        const res = await fetch('/api/coaches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
          body: JSON.stringify({ ...coach, foto_url }),
        });
        if (!res.ok) throw new Error('Error al crear entrenador');
      }
      fetchCoaches();
      setShowForm(false);
      setEditCoach(null);
      setPreview(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este entrenador?')) return;
    setLoading(true);
    await fetch(`/api/coaches/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${jwt}` } });
    fetchCoaches();
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white px-4 py-12">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 bg-clip-text text-transparent drop-shadow">Entrenadores</h1>
            <button
              onClick={() => { setShowForm(true); setEditCoach(null); setPreview(null); }}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              + Nuevo entrenador
            </button>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, email o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md mb-4 rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {loading ? (
            <div className="text-center text-emerald-600">Cargando entrenadores...</div>
          ) : paginated.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No hay entrenadores para mostrar.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700">
                    <th className="p-3 text-left">Foto</th>
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Apellido</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Teléfono</th>
                    <th className="p-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(coach => (
                    <tr key={coach.id} className="border-b last:border-0 hover:bg-emerald-50/40">
                      <td className="p-2">
                        {coach.foto_url ? (
                          <img src={coach.foto_url} alt="Foto" className="w-10 h-10 rounded-full object-cover border" />
                        ) : (
                          <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-lg shadow">
                            {coach.nombre.charAt(0)}
                          </span>
                        )}
                      </td>
                      <td className="p-2 font-semibold">{coach.nombre}</td>
                      <td className="p-2">{coach.apellido}</td>
                      <td className="p-2">{coach.email}</td>
                      <td className="p-2">{coach.telefono}</td>
                      <td className="p-2 flex gap-2">
                        <button
                          onClick={() => { setEditCoach(coach); setShowForm(true); setPreview(coach.foto_url || null); }}
                          className="px-3 py-1 rounded bg-emerald-100 text-emerald-700 font-bold hover:bg-emerald-200"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(coach.id)}
                          className="px-3 py-1 rounded bg-red-100 text-red-700 font-bold hover:bg-red-200"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  onClick={() => { setShowForm(false); setEditCoach(null); setPreview(null); }}
                  className="absolute top-2 right-2 text-emerald-700 hover:text-red-500 text-2xl font-bold"
                  aria-label="Cerrar"
                >
                  ×
                </button>
                <h2 className="text-2xl font-bold mb-4 text-emerald-700">{editCoach ? 'Editar entrenador' : 'Nuevo entrenador'}</h2>
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const nombre = (form.elements.namedItem('nombre') as HTMLInputElement).value;
                    const apellido = (form.elements.namedItem('apellido') as HTMLInputElement).value;
                    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                    const telefono = (form.elements.namedItem('telefono') as HTMLInputElement).value;
                    const file = fileInputRef.current?.files?.[0];
                    await handleSave({
                      id: editCoach?.id || '',
                      nombre,
                      apellido,
                      email,
                      telefono,
                      foto_url: editCoach?.foto_url,
                    }, file);
                  }}
                  className="flex flex-col gap-4"
                >
                  <input
                    name="nombre"
                    defaultValue={editCoach?.nombre || ''}
                    placeholder="Nombre"
                    required
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <input
                    name="apellido"
                    defaultValue={editCoach?.apellido || ''}
                    placeholder="Apellido"
                    required
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <input
                    name="email"
                    type="email"
                    defaultValue={editCoach?.email || ''}
                    placeholder="Email"
                    required
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <input
                    name="telefono"
                    defaultValue={editCoach?.telefono || ''}
                    placeholder="Teléfono"
                    required
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  {/* Subida de foto */}
                  <div className="flex flex-col gap-2">
                    <label className="font-medium text-gray-700">Foto (opcional)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      ref={fileInputRef}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => setPreview(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        } else {
                          setPreview(editCoach?.foto_url || null);
                        }
                      }}
                      className="border border-emerald-200 rounded px-2 py-1"
                    />
                    {preview && (
                      <img src={preview || undefined} alt="Preview" className="w-20 h-20 rounded-full object-cover border mt-2 mx-auto" />
                    )}
                  </div>
                  {formError && <div className="text-red-600 text-sm text-center">{formError}</div>}
                  <button
                    type="submit"
                    className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-2 rounded-lg shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Guardando...' : editCoach ? 'Guardar cambios' : 'Crear entrenador'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default CoachesPage; 