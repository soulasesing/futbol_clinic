import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import PlayerCard from '../components/PlayerCard';
import { useAuth } from '../contexts/AuthContext';

interface Player {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  fecha_nacimiento: string;
  categoria: string;
  foto_url?: string;
  document_url?: string;
  teams?: Team[];
  correo_jugador?: string;
  padre_nombre?: string;
  padre_apellido?: string;
  padre_email?: string;
  padre_telefono?: string;
  madre_nombre?: string;
  madre_apellido?: string;
  madre_email?: string;
  madre_telefono?: string;
  created_at: string;
}

interface Team {
  id: string;
  nombre: string;
  categoria: string;
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

// Función para calcular la edad a partir de la fecha de nacimiento
const calcularEdad = (fecha: string) => {
  if (!fecha) return '';
  const nacimiento = new Date(fecha);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

const PlayersPage: React.FC = () => {
  const { isAuthenticated, jwt } = useAuth() as any;
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<Player[]>([]);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDocUrl, setSelectedDocUrl] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);

  // Fetch teams
  const fetchTeams = () => {
    fetch('/api/teams', { headers: { Authorization: `Bearer ${jwt}` } })
      .then(res => res.json())
      .then(data => setTeams(Array.isArray(data) ? data : data.teams || []))
      .catch(() => setTeams([]));
  };
  useEffect(fetchTeams, [jwt]);

  // Fetch players
  const fetchPlayers = () => {
    setLoading(true);
    fetch('/api/players', { headers: { Authorization: `Bearer ${jwt}` } })
      .then(res => res.json())
      .then(async data => {
        const playersData = Array.isArray(data) ? data : data.players || [];
        // Para cada jugador, obtener sus equipos
        const playersWithTeams = await Promise.all(playersData.map(async (p: Player) => {
          const res = await fetch(`/api/players/${p.id}/teams`, { headers: { Authorization: `Bearer ${jwt}` } });
          const teams = await res.json();
          return { ...p, teams };
        }));
        setPlayers(playersWithTeams);
      })
      .catch(() => setError('Error al cargar jugadores'))
      .finally(() => setLoading(false));
  };
  useEffect(fetchPlayers, [jwt]);

  // Búsqueda instantánea
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      players.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.apellido.toLowerCase().includes(q) ||
        p.cedula.toLowerCase().includes(q)
      )
    );
    setPage(1);
  }, [search, players]);

  // Paginación
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // Crear/editar jugador
  const handleSave = async (player: Player, file?: File, docFile?: File, teamIds?: string[]) => {
    setFormLoading(true);
    setFormError('');
    try {
      let foto_url: string | undefined = player.foto_url ?? undefined;
      let document_url: string | undefined = player.document_url ?? undefined;
      if (file) {
        const uploaded = await uploadImage(file);
        foto_url = uploaded ?? undefined;
      }
      if (docFile) {
        const uploadedDoc = await uploadImage(docFile);
        document_url = uploadedDoc ?? undefined;
      }
      const payload = { ...player, foto_url, document_url, team_ids: teamIds };
      if (editPlayer) {
        // Editar
        const res = await fetch(`/api/players/${editPlayer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Error al editar jugador');
      } else {
        // Crear
        const res = await fetch('/api/players', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Error al crear jugador');
      }
      fetchPlayers();
      setShowForm(false);
      setEditPlayer(null);
      setPreview(null);
      setDocPreview(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este jugador?')) return;
    setLoading(true);
    await fetch(`/api/players/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${jwt}` } });
    fetchPlayers();
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white px-4 py-12">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 bg-clip-text text-transparent drop-shadow">Jugadores</h1>
            <button
              onClick={() => { setShowForm(true); setEditPlayer(null); setPreview(null); }}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              + Nuevo jugador
            </button>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o cédula..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md mb-4 rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {loading ? (
            <div className="text-center text-emerald-600">Cargando jugadores...</div>
          ) : paginated.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No hay jugadores para mostrar.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700">
                    <th className="p-3 text-left">Foto</th>
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Apellido</th>
                    <th className="p-3 text-left">Cédula</th>
                    <th className="p-3 text-left">Categoría(s)</th>
                    <th className="p-3 text-left">Edad</th>
                    <th className="p-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(player => (
                    <tr 
                      key={player.id} 
                      className="border-b last:border-0 hover:bg-emerald-50/40 cursor-pointer"
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <td className="p-2">
                        {player.foto_url ? (
                          <img src={player.foto_url} alt="Foto" className="w-10 h-10 rounded-full object-cover border" />
                        ) : (
                          <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-lg shadow">
                            {player.nombre.charAt(0)}
                          </span>
                        )}
                      </td>
                      <td className="p-2 font-semibold">{player.nombre}</td>
                      <td className="p-2">{player.apellido}</td>
                      <td className="p-2">{player.cedula}</td>
                      <td className="p-2">
                        {player.teams && player.teams.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {player.teams.map(team => (
                              <span key={team.id} className="bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                                {team.nombre}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="p-2">{calcularEdad(player.fecha_nacimiento)}</td>
                      <td className="p-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(player.id);
                          }}
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
              <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => { setShowForm(false); setEditPlayer(null); setPreview(null); }}
                  className="absolute top-2 right-2 text-emerald-700 hover:text-red-500 text-2xl font-bold"
                  aria-label="Cerrar"
                >
                  ×
                </button>
                <h2 className="text-2xl font-bold mb-4 text-emerald-700">{editPlayer ? 'Editar jugador' : 'Nuevo jugador'}</h2>
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const nombre = (form.elements.namedItem('nombre') as HTMLInputElement).value;
                    const apellido = (form.elements.namedItem('apellido') as HTMLInputElement).value;
                    const cedula = (form.elements.namedItem('cedula') as HTMLInputElement).value;
                    const fecha_nacimiento = (form.elements.namedItem('fecha_nacimiento') as HTMLInputElement).value;
                    const file = fileInputRef.current?.files?.[0];
                    const docFile = docInputRef.current?.files?.[0];
                    const teamSelect = form.elements.namedItem('team_ids') as HTMLSelectElement;
                    const teamIds = Array.from(teamSelect.selectedOptions).map(opt => opt.value);
                    const correo_jugador = (form.elements.namedItem('correo_jugador') as HTMLInputElement).value;
                    const padre_nombre = (form.elements.namedItem('padre_nombre') as HTMLInputElement).value;
                    const padre_apellido = (form.elements.namedItem('padre_apellido') as HTMLInputElement).value;
                    const padre_email = (form.elements.namedItem('padre_email') as HTMLInputElement).value;
                    const padre_telefono = (form.elements.namedItem('padre_telefono') as HTMLInputElement).value;
                    const madre_nombre = (form.elements.namedItem('madre_nombre') as HTMLInputElement).value;
                    const madre_apellido = (form.elements.namedItem('madre_apellido') as HTMLInputElement).value;
                    const madre_email = (form.elements.namedItem('madre_email') as HTMLInputElement).value;
                    const madre_telefono = (form.elements.namedItem('madre_telefono') as HTMLInputElement).value;
                    await handleSave({
                      id: editPlayer?.id || '',
                      nombre,
                      apellido,
                      cedula,
                      fecha_nacimiento,
                      categoria: editPlayer?.categoria || 'Sin categoría',
                      foto_url: editPlayer?.foto_url,
                      document_url: editPlayer?.document_url,
                      correo_jugador,
                      padre_nombre,
                      padre_apellido,
                      padre_email,
                      padre_telefono,
                      madre_nombre,
                      madre_apellido,
                      madre_email,
                      madre_telefono,
                      created_at: editPlayer?.created_at || new Date().toISOString()
                    }, file, docFile, teamIds);
                  }}
                  className="flex flex-col gap-4"
                >
                  <input
                    name="nombre"
                    defaultValue={editPlayer?.nombre || ''}
                    placeholder="Nombre"
                    required
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <input
                    name="apellido"
                    defaultValue={editPlayer?.apellido || ''}
                    placeholder="Apellido"
                    required
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <input
                    name="cedula"
                    defaultValue={editPlayer?.cedula || ''}
                    placeholder="Cédula"
                    required
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <select
                    name="team_ids"
                    multiple
                    defaultValue={editPlayer?.teams?.map(t => t.id) || []}
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 h-28"
                    required={teams.length > 0}
                  >
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.nombre}</option>
                    ))}
                  </select>
                  <input
                    name="fecha_nacimiento"
                    type="date"
                    defaultValue={editPlayer?.fecha_nacimiento ? editPlayer.fecha_nacimiento.slice(0, 10) : ''}
                    placeholder="Fecha de nacimiento"
                    required
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <input
                    name="correo_jugador"
                    defaultValue={editPlayer?.correo_jugador || ''}
                    placeholder="Correo del jugador (opcional)"
                    type="email"
                    className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <div className="flex flex-col gap-2 border-t pt-4 mt-2">
                    <span className="font-semibold text-emerald-700">Datos del padre</span>
                    <input
                      name="padre_nombre"
                      defaultValue={editPlayer?.padre_nombre || ''}
                      placeholder="Nombre del padre"
                      className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <input
                      name="padre_apellido"
                      defaultValue={editPlayer?.padre_apellido || ''}
                      placeholder="Apellido del padre"
                      className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <input
                      name="padre_email"
                      defaultValue={editPlayer?.padre_email || ''}
                      placeholder="Correo del padre"
                      type="email"
                      className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <input
                      name="padre_telefono"
                      defaultValue={editPlayer?.padre_telefono || ''}
                      placeholder="Teléfono del padre"
                      type="tel"
                      className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="flex flex-col gap-2 border-t pt-4 mt-2">
                    <span className="font-semibold text-emerald-700">Datos de la madre</span>
                    <input
                      name="madre_nombre"
                      defaultValue={editPlayer?.madre_nombre || ''}
                      placeholder="Nombre de la madre"
                      className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <input
                      name="madre_apellido"
                      defaultValue={editPlayer?.madre_apellido || ''}
                      placeholder="Apellido de la madre"
                      className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <input
                      name="madre_email"
                      defaultValue={editPlayer?.madre_email || ''}
                      placeholder="Correo de la madre"
                      type="email"
                      className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <input
                      name="madre_telefono"
                      defaultValue={editPlayer?.madre_telefono || ''}
                      placeholder="Teléfono de la madre"
                      type="tel"
                      className="rounded-lg border border-emerald-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
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
                          setPreview(editPlayer?.foto_url || null);
                        }
                      }}
                      className="border border-emerald-200 rounded px-2 py-1"
                    />
                    {preview && (
                      <img src={preview || undefined} alt="Preview" className="w-20 h-20 rounded-full object-cover border mt-2 mx-auto" />
                    )}
                  </div>
                  {/* Subida de documento de identidad */}
                  <div className="flex flex-col gap-2">
                    <label className="font-medium text-gray-700">Documento de identidad (cédula/pasaporte, opcional)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      ref={docInputRef}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => setDocPreview(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        } else {
                          setDocPreview(editPlayer?.document_url || null);
                        }
                      }}
                      className="border border-emerald-200 rounded px-2 py-1"
                    />
                    {docPreview && (
                      <img src={docPreview || undefined} alt="Preview documento" className="w-28 h-20 rounded object-cover border mt-2 mx-auto" />
                    )}
                  </div>
                  {formError && <div className="text-red-600 text-sm text-center">{formError}</div>}
                  <button
                    type="submit"
                    className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-2 rounded-lg shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Guardando...' : editPlayer ? 'Guardar cambios' : 'Crear jugador'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      {/* Modal para mostrar documento */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] relative">
            <button
              onClick={() => setShowDocModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-2xl font-bold z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow"
              aria-label="Cerrar"
            >
              ×
            </button>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4 text-emerald-700">Documento de Identidad</h3>
              <div className="flex justify-center">
                <img 
                  src={selectedDocUrl} 
                  alt="Documento de identidad" 
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Card Modal */}
      {selectedPlayer && (
        <PlayerCard 
          player={selectedPlayer} 
          onClose={() => setSelectedPlayer(null)}
          onEdit={(player) => {
            setEditPlayer(player);
            setShowForm(true);
            setPreview(player.foto_url || null);
            setDocPreview(player.document_url || null);
            setSelectedPlayer(null);
          }}
          onRefresh={fetchPlayers}
        />
      )}
    </>
  );
};

export default PlayersPage; 