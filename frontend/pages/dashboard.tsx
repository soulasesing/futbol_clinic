import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from '../components/UserMenu';
import Navbar from '../components/Navbar';

interface TeamCard {
  id: string;
  nombre: string;
  categoria: string;
  entrenador_nombre?: string;
  entrenador_apellido?: string;
  jugadores: { id: string; nombre: string; apellido: string; foto_url?: string }[];
}

const Dashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [birthdays, setBirthdays] = useState<{ mes: any[]; proximos: any[] }>({ mes: [], proximos: [] });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/teams/with-players', { headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` } })
        .then(res => res.json())
        .then(data => setTeams(Array.isArray(data) ? data : []));
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/players/birthdays', { headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` } })
        .then(res => res.json())
        .then(data => setBirthdays(data));
    }
  }, [user]);

  if (!isAuthenticated) return null;

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white px-4 py-12">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          {/* <div className="flex justify-end">
            <UserMenu />
          </div> */}
          {isSuperAdmin ? (
            <>
              <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 bg-clip-text text-transparent mb-4 drop-shadow-lg">
                Panel Global de Super Admin
              </h1>
              <p className="text-lg text-gray-700 mb-4">
                Aquí puedes administrar todas las escuelas, enviar invitaciones y gestionar la plataforma completa.
              </p>
              <div className="mt-8 text-emerald-600 font-semibold animate-pulse">
                (Aquí irá el dashboard global con widgets y datos de todas las escuelas)
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 bg-clip-text text-transparent drop-shadow mb-8">Tus Equipos / Categorías</h1>
              {/* Widget de cumpleaños */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-emerald-100">
                  <h2 className="text-xl font-bold text-emerald-700 flex items-center gap-2 mb-4">🎂 Cumpleaños del mes</h2>
                  {(birthdays.mes?.length ?? 0) === 0 ? (
                    <div className="text-gray-400">Nadie cumple años este mes.</div>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      {birthdays.mes.map(j => (
                        <div key={j.id} className="flex flex-col items-center bg-emerald-50 rounded-xl p-3 w-32 shadow hover:scale-105 transition">
                          {j.foto_url ? (
                            <img src={j.foto_url} alt="Foto" className="w-12 h-12 rounded-full object-cover border mb-2" />
                          ) : (
                            <span className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-lg shadow mb-2">
                              {j.nombre.charAt(0)}
                            </span>
                          )}
                          <div className="text-sm font-bold text-emerald-700 text-center">{j.nombre} {j.apellido}</div>
                          <div className="text-xs text-gray-500 text-center">{j.categoria}</div>
                          <div className="text-xs text-emerald-600 mt-1">{new Date(j.fecha_nacimiento).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-emerald-100">
                  <h2 className="text-xl font-bold text-emerald-700 flex items-center gap-2 mb-4">🎉 Próximos cumpleaños</h2>
                  {(birthdays.proximos?.length ?? 0) === 0 ? (
                    <div className="text-gray-400">No hay próximos cumpleaños.</div>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      {birthdays.proximos.map(j => (
                        <div key={j.id} className="flex flex-col items-center bg-teal-50 rounded-xl p-3 w-32 shadow hover:scale-105 transition">
                          {j.foto_url ? (
                            <img src={j.foto_url} alt="Foto" className="w-12 h-12 rounded-full object-cover border mb-2" />
                          ) : (
                            <span className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white font-bold text-lg shadow mb-2">
                              {j.nombre.charAt(0)}
                            </span>
                          )}
                          <div className="text-sm font-bold text-emerald-700 text-center">{j.nombre} {j.apellido}</div>
                          <div className="text-xs text-gray-500 text-center">{j.categoria}</div>
                          <div className="text-xs text-teal-600 mt-1">{new Date(j.fecha_nacimiento).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {teams.map(team => (
                  <div
                    key={team.id}
                    className="[perspective:1000px] cursor-pointer"
                    onClick={() => setFlippedId(flippedId === team.id ? null : team.id)}
                  >
                    <div className={`relative w-full h-64 transition-transform duration-700 [transform-style:preserve-3d] ${flippedId === team.id ? '[transform:rotateY(180deg)]' : ''}`}> 
                      {/* Cara frontal */}
                      <div className="absolute inset-0 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center gap-4 [backface-visibility:hidden] border border-emerald-100">
                        <div className="text-2xl font-bold text-emerald-700 text-center">{team.nombre}</div>
                        <div className="text-lg text-gray-700">{team.categoria}</div>
                        <div className="text-sm text-gray-500">Jugadores: {team.jugadores.length}</div>
                        <div className="text-sm text-gray-500">Entrenador: {team.entrenador_nombre ? `${team.entrenador_nombre} ${team.entrenador_apellido || ''}` : '—'}</div>
                      </div>
                      {/* Cara trasera */}
                      <div className="absolute inset-0 bg-white rounded-2xl shadow-xl p-4 flex flex-col justify-center [transform:rotateY(180deg)] [backface-visibility:hidden] border border-emerald-100">
                        <button
                          onClick={e => { e.stopPropagation(); setFlippedId(null); }}
                          className="absolute top-2 right-2 text-emerald-700 hover:text-red-500 text-2xl font-bold"
                          aria-label="Cerrar"
                        >×</button>
                        <div className="mb-2 font-semibold text-emerald-700">Jugadores:</div>
                        {team.jugadores.length === 0 ? (
                          <div className="text-gray-400 mb-2">No hay jugadores</div>
                        ) : (
                          <ul className="ml-2 mb-2 flex flex-col gap-1 max-h-40 overflow-y-auto pr-2">
                            {team.jugadores.map(j => (
                              <li key={j.id} className="flex items-center gap-2">
                                {j.foto_url ? (
                                  <img src={j.foto_url} alt="Foto" className="w-8 h-8 rounded-full object-cover border" />
                                ) : (
                                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-sm shadow">
                                    {j.nombre.charAt(0)}
                                  </span>
                                )}
                                <span>{j.nombre} {j.apellido}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-2 font-semibold text-emerald-700">Entrenador:</div>
                        <div className="text-gray-700">{team.entrenador_nombre ? `${team.entrenador_nombre} ${team.entrenador_apellido || ''}` : '—'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default Dashboard; 