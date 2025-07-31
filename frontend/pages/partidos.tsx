import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { Trophy, Calendar, MapPin, Users } from 'lucide-react';

const Partidos: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 bg-clip-text text-transparent">
                Partidos
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona los partidos de tus equipos
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <Trophy className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">Próximos</h3>
              </div>
              <p className="text-3xl font-bold text-emerald-700">0</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">Este mes</h3>
              </div>
              <p className="text-3xl font-bold text-emerald-700">0</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">Locales</h3>
              </div>
              <p className="text-3xl font-bold text-emerald-700">0</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">Equipos</h3>
              </div>
              <p className="text-3xl font-bold text-emerald-700">0</p>
            </div>
          </div>

          {/* Próximamente */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100 text-center">
            <div className="max-w-lg mx-auto">
              <Trophy className="w-24 h-24 text-emerald-600 mx-auto mb-6 opacity-50" />
              <h2 className="text-3xl font-bold text-emerald-700 mb-4">
                ¡Próximamente!
              </h2>
              <p className="text-gray-600 mb-8">
                Estamos trabajando en esta funcionalidad para ayudarte a gestionar los partidos de tus equipos de manera eficiente.
                Pronto podrás:
              </p>
              <ul className="text-left space-y-4 max-w-md mx-auto mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Programar partidos amistosos y oficiales
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Registrar resultados y estadísticas
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Gestionar calendarios de competiciones
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Ver histórico de partidos por equipo
                </li>
              </ul>
              <div className="text-sm text-gray-500">
                ¡Mantente atento a las actualizaciones!
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Partidos; 