import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import TrainingsWidget from '../components/TrainingsWidget';
import MatchesWidget from '../components/MatchesWidget';
import { Users, Trophy, Calendar, Zap, TrendingUp } from 'lucide-react';

interface TeamCard {
  id: string;
  nombre: string;
  categoria: string;
  entrenador_nombre?: string;
  entrenador_apellido?: string;
  jugadores: { id: string; nombre: string; apellido: string; foto_url?: string }[];
}

interface StatCardProps {
  icon: React.ComponentType<any>;
  title: string;
  value: string;
  trend?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, trend, color = "emerald" }) => (
  <div className={`bg-gradient-to-br from-${color}-50 to-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-${color}-100 group hover:scale-105`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl bg-gradient-to-r from-${color}-500 to-${color}-600 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">+{trend}%</span>
        </div>
      )}
    </div>
    <h3 className={`text-2xl font-bold text-${color}-700 mb-1`}>{value}</h3>
    <p className="text-gray-600 text-sm">{title}</p>
  </div>
);

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
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 px-4 py-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
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
            <div className="flex flex-col gap-8">
              {/* Header */}
              <div className="mb-2">
                <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  Dashboard
                </h1>
                <p className="text-lg text-gray-600">
                  {new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  icon={Users} 
                  title="Total Jugadores" 
                  value={teams.reduce((acc, team) => acc + team.jugadores.length, 0).toString()}
                  trend="12"
                  color="emerald"
                />
                <StatCard 
                  icon={Trophy} 
                  title="Equipos Activos" 
                  value={teams.length.toString()}
                  trend="5"
                  color="green"
                />
                <StatCard 
                  icon={Calendar} 
                  title="Entrenamientos" 
                  value="3" 
                  color="teal"
                />
                <StatCard 
                  icon={Zap} 
                  title="Partidos Próximos" 
                  value="2" 
                  trend="8"
                  color="emerald"
                />
              </div>

              {/* Widgets de próximos eventos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="w-full">
                  <TrainingsWidget />
                </div>
                <div className="w-full">
                  <MatchesWidget />
                </div>
              </div>

              {/* Cumpleaños */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="text-3xl">🎂</div>
                    <h2 className="text-2xl font-bold text-emerald-700">Cumpleaños del mes</h2>
                  </div>
                  {(birthdays.mes?.length ?? 0) === 0 ? (
                    <div className="text-gray-400 text-center py-8">Nadie cumple años este mes.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {birthdays.mes.map(j => (
                        <div key={j.id} className="group bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100 hover:border-emerald-300 transition-all duration-300 hover:scale-105 cursor-pointer">
                          <div className="text-center">
                            {j.foto_url ? (
                              <img src={j.foto_url} alt={`Foto de ${j.nombre}`} className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-200 mx-auto mb-3 group-hover:border-emerald-400 transition-all duration-300 shadow-lg group-hover:shadow-xl" />
                            ) : (
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                {j.nombre.charAt(0).toUpperCase()}{j.apellido.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="font-bold text-emerald-700 text-lg mb-1">{j.nombre} {j.apellido}</div>
                            <div className="text-sm text-gray-600 mb-1">{j.categoria}</div>
                            <div className="text-sm bg-emerald-100 text-emerald-700 font-medium px-2 py-1 rounded-full inline-block">
                              {new Date(j.fecha_nacimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="text-3xl">🎉</div>
                    <h2 className="text-2xl font-bold text-emerald-700">Próximos cumpleaños</h2>
                  </div>
                  {(birthdays.proximos?.length ?? 0) === 0 ? (
                    <div className="text-gray-400 text-center py-8">No hay próximos cumpleaños.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {birthdays.proximos.map(j => (
                        <div key={j.id} className="group bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-4 border border-teal-100 hover:border-teal-300 transition-all duration-300 hover:scale-105 cursor-pointer">
                          <div className="text-center">
                            {j.foto_url ? (
                              <img src={j.foto_url} alt={`Foto de ${j.nombre}`} className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-200 mx-auto mb-3 group-hover:border-teal-400 transition-all duration-300 shadow-lg group-hover:shadow-xl" />
                            ) : (
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                {j.nombre.charAt(0).toUpperCase()}{j.apellido.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="font-bold text-emerald-700 text-lg mb-1">{j.nombre} {j.apellido}</div>
                            <div className="text-sm text-gray-600 mb-1">{j.categoria}</div>
                            <div className="text-sm bg-teal-100 text-teal-700 font-medium px-2 py-1 rounded-full inline-block">
                              {new Date(j.fecha_nacimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Equipos */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="text-3xl">⚽</div>
                  <h2 className="text-2xl font-bold text-emerald-700">Mis equipos</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {teams.map(team => (
                    <div
                      key={team.id}
                      className="[perspective:1000px]"
                    >
                      <div className={`relative w-full h-80 transition-transform duration-700 [transform-style:preserve-3d] ${flippedId === team.id ? '[transform:rotateY(180deg)]' : ''}`}>
                        {/* Cara frontal */}
                        <div 
                          onClick={() => setFlippedId(team.id)}
                          className="absolute inset-0 bg-gradient-to-br from-white to-emerald-50 rounded-3xl shadow-xl flex flex-col items-center justify-center gap-6 [backface-visibility:hidden] border border-emerald-100 p-6 cursor-pointer hover:shadow-2xl transition-shadow"
                        >
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold text-3xl flex items-center justify-center shadow-lg">
                            {team.nombre.split(' ')[0]}
                          </div>
                          <div className="text-center">
                            <h3 className="text-2xl font-bold text-emerald-700 mb-2">{team.nombre}</h3>
                            <div className="text-lg text-gray-700 mb-4">{team.categoria}</div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-center gap-2 text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>{team.jugadores.length} jugadores</span>
                              </div>
                              <div className="text-gray-600">
                                <strong>Entrenador:</strong> {team.entrenador_nombre ? `${team.entrenador_nombre} ${team.entrenador_apellido || ''}` : '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Cara trasera */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white to-teal-50 rounded-3xl shadow-xl p-6 flex flex-col [transform:rotateY(180deg)] [backface-visibility:hidden] border border-teal-100">
                          <button
                            onClick={() => setFlippedId(null)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center font-bold"
                            aria-label="Cerrar"
                          >×</button>
                          
                          <div className="mb-4">
                            <h4 className="font-bold text-emerald-700 text-lg mb-3 flex items-center gap-2">
                              <Users className="w-5 h-5" />
                              Jugadores:
                            </h4>
                            {team.jugadores.length === 0 ? (
                              <div className="text-gray-400 text-center py-4">No hay jugadores</div>
                            ) : (
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {team.jugadores.map(j => (
                                  <div key={j.id} className="flex items-center gap-3 bg-white rounded-xl p-2 shadow-sm hover:shadow-md transition-shadow">
                                    {j.foto_url ? (
                                      <img src={j.foto_url} alt={`Foto de ${j.nombre}`} className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-200" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-sm flex items-center justify-center shadow">
                                        {j.nombre.charAt(0).toUpperCase()}{j.apellido.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <span className="font-medium text-gray-700">{j.nombre} {j.apellido}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-auto">
                            <h4 className="font-bold text-emerald-700 mb-2">Entrenador:</h4>
                            <div className="bg-emerald-50 rounded-xl p-3 text-gray-700 font-medium">
                              {team.entrenador_nombre ? `${team.entrenador_nombre} ${team.entrenador_apellido || ''}` : 'Sin asignar'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Dashboard; 