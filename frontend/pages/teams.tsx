import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

interface Team {
  id: string;
  nombre: string;
  categoria: string;
  entrenador_id?: string;
  descripcion?: string;
}

interface Coach {
  id: string;
  nombre: string;
  apellido: string;
}

interface Category {
  id: string;
  nombre: string;
  edad_min: number;
  edad_max: number;
  anio_nacimiento_min: number;
  anio_nacimiento_max: number;
  descripcion: string;
}

const PAGE_SIZE = 10;

const TeamsPage: React.FC = () => {
  const { isAuthenticated, jwt } = useAuth() as any;
  const [teams, setTeams] = useState<Team[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<Team[]>([]);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch teams
  const fetchTeams = () => {
    setLoading(true);
    fetch('/api/teams', { headers: { Authorization: `Bearer ${jwt}` } })
      .then(res => res.json())
      .then(data => setTeams(Array.isArray(data) ? data : data.teams || []))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  };
  useEffect(fetchTeams, [jwt]);

  // Fetch coaches
  const fetchCoaches = () => {
    fetch('/api/coaches', { headers: { Authorization: `Bearer ${jwt}` } })
      .then(res => res.json())
      .then(data => setCoaches(Array.isArray(data) ? data : data.coaches || []))
      .catch(() => setCoaches([]));
  };
  useEffect(fetchCoaches, [jwt]);

  // Fetch categories
  const fetchCategories = () => {
    fetch('/api/categories', { headers: { Authorization: `Bearer ${jwt}` } })
      .then(res => res.json())
      .then(data => {
        const categoriesData = Array.isArray(data) ? data : data.categories || [];
        if (categoriesData.length === 0) {
          // Si no hay categorías, insertar las por defecto
          fetch('/api/categories/default', { 
            method: 'POST',
            headers: { Authorization: `Bearer ${jwt}` }
          })
          .then(() => fetchCategories()) // Recargar después de insertar
          .catch(() => setCategories([]));
        } else {
          setCategories(categoriesData);
        }
      })
      .catch(() => setCategories([]));
  };
  useEffect(fetchCategories, [jwt]);

  // Búsqueda instantánea
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      teams.filter(t =>
        t.nombre.toLowerCase().includes(q) ||
        t.categoria.toLowerCase().includes(q)
      )
    );
    setPage(1);
  }, [search, teams]);

  // Paginación
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // Crear/editar equipo
  const handleSave = async (team: Team) => {
    setFormLoading(true);
    setFormError('');
    try {
      if (editTeam) {
        // Editar
        const res = await fetch(`/api/teams/${editTeam.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
          body: JSON.stringify(team),
        });
        if (!res.ok) throw new Error('Error al editar equipo');
      } else {
        // Crear
        const res = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
          body: JSON.stringify(team),
        });
        if (!res.ok) throw new Error('Error al crear equipo');
      }
      fetchTeams();
      setShowForm(false);
      setEditTeam(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este equipo?')) return;
    setLoading(true);
    await fetch(`/api/teams/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${jwt}` } });
    fetchTeams();
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white px-4 py-12">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 bg-clip-text text-transparent drop-shadow">Equipos</h1>
            <button
              onClick={() => { setShowForm(true); setEditTeam(null); }}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              + Nuevo equipo
            </button>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md mb-4 rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {loading ? (
            <div className="text-center text-emerald-600">Cargando equipos...</div>
          ) : paginated.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No hay equipos para mostrar.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700">
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Categoría</th>
                    <th className="p-3 text-left">Entrenador</th>
                    <th className="p-3 text-left">Descripción</th>
                    <th className="p-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(team => (
                    <tr key={team.id} className="border-b last:border-0 hover:bg-emerald-50/40">
                      <td className="p-2 font-semibold">{team.nombre}</td>
                      <td className="p-2">{team.categoria}</td>
                      <td className="p-2">
                        {team.entrenador_id ? (
                          coaches.find(c => c.id === team.entrenador_id)?.nombre + ' ' + coaches.find(c => c.id === team.entrenador_id)?.apellido
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-2">{team.descripcion || <span className="text-gray-300">—</span>}</td>
                      <td className="p-2 flex gap-2">
                        <button
                          onClick={() => { setEditTeam(team); setShowForm(true); }}
                          className="px-3 py-1 rounded bg-emerald-100 text-emerald-700 font-bold hover:bg-emerald-200"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(team.id)}
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
                  onClick={() => { setShowForm(false); setEditTeam(null); }}
                  className="absolute top-2 right-2 text-emerald-700 hover:text-red-500 text-2xl font-bold"
                  aria-label="Cerrar"
                >
                  ×
                </button>
                <h2 className="text-2xl font-bold mb-4 text-emerald-700">{editTeam ? 'Editar equipo' : 'Nuevo equipo'}</h2>
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const nombre = (form.elements.namedItem('nombre') as HTMLInputElement).value;
                    const categoria = (form.elements.namedItem('categoria') as HTMLSelectElement).value;
                    const entrenador_id = (form.elements.namedItem('entrenador_id') as HTMLSelectElement).value || undefined;
                    const descripcion = (form.elements.namedItem('descripcion') as HTMLInputElement).value;
                    await handleSave({
                      id: editTeam?.id || '',
                      nombre,
                      categoria,
                      entrenador_id,
                      descripcion,
                    });
                  }}
                  className="flex flex-col gap-4"
                >
                  <input
                    name="nombre"
                    defaultValue={editTeam?.nombre || ''}
                    placeholder="Nombre del equipo"
                    required
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <select
                    name="categoria"
                    defaultValue={editTeam?.categoria || ''}
                    required
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="" disabled>Selecciona una categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.nombre}>
                        {cat.nombre} ({cat.edad_min}-{cat.edad_max} años) - {cat.descripcion}
                      </option>
                    ))}
                  </select>
                  <select
                    name="entrenador_id"
                    defaultValue={editTeam?.entrenador_id || ''}
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="">Sin entrenador</option>
                    {coaches.map(coach => (
                      <option key={coach.id} value={coach.id}>{coach.nombre} {coach.apellido}</option>
                    ))}
                  </select>
                  <input
                    name="descripcion"
                    defaultValue={editTeam?.descripcion || ''}
                    placeholder="Descripción (opcional)"
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  {formError && <div className="text-red-600 text-sm text-center">{formError}</div>}
                  <button
                    type="submit"
                    className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-2 rounded-lg shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Guardando...' : editTeam ? 'Guardar cambios' : 'Crear equipo'}
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

export default TeamsPage; 