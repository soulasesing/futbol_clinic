import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import TrainingsWidget from '../components/TrainingsWidget';
import MatchesWidget from '../components/MatchesWidget';
import { Bell, ShoppingBag, Trophy, Calendar, Gift } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
}

interface MatchResult {
  id: string;
  date: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  location: string;
}

interface StoreItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
}

const ParentDashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Mock data - Esto se reemplazará con datos reales del backend
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'Entrenamiento cancelado',
      message: 'El entrenamiento de mañana ha sido cancelado debido al mal tiempo.',
      date: '2024-02-01',
      read: false,
      type: 'warning'
    },
    {
      id: '2',
      title: 'Nuevo partido programado',
      message: 'Se ha programado un partido amistoso para el próximo sábado.',
      date: '2024-02-02',
      read: false,
      type: 'info'
    }
  ];

  const matchResults: MatchResult[] = [
    {
      id: '1',
      date: '2024-01-28',
      team1: 'Sub-13',
      team2: 'Rival FC',
      score1: 3,
      score2: 1,
      location: 'Estadio Principal'
    },
    {
      id: '2',
      date: '2024-01-21',
      team1: 'Deportivo FC',
      team2: 'Sub-13',
      score1: 2,
      score2: 2,
      location: 'Estadio Visitante'
    }
  ];

  const storeItems: StoreItem[] = [
    {
      id: '1',
      name: 'Uniforme Oficial',
      price: 45.99,
      image: '/placeholder-uniform.jpg',
      description: 'Uniforme oficial del equipo temporada 2024',
      category: 'uniformes'
    },
    {
      id: '2',
      name: 'Balón de Entrenamiento',
      price: 25.99,
      image: '/placeholder-ball.jpg',
      description: 'Balón oficial de entrenamiento',
      category: 'equipamiento'
    }
  ];

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 px-4 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header con notificaciones */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-emerald-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
                <Bell className="w-6 h-6" />
                Notificaciones
              </h2>
              {notifications.some(n => !n.read) && (
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm font-medium">
                  {notifications.filter(n => !n.read).length} nuevas
                </span>
              )}
            </div>
            <div className="space-y-4">
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-4 rounded-xl border ${
                    notification.read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-emerald-50 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                    <span className="text-sm text-gray-500">{formatDate(notification.date)}</span>
                  </div>
                  <p className="text-gray-600">{notification.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Widgets de Entrenamientos y Partidos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TrainingsWidget />
            <MatchesWidget />
          </div>

          {/* Resultados de partidos */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-700">Últimos resultados</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matchResults.map(match => (
                <div 
                  key={match.id}
                  className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100"
                >
                  <div className="text-sm text-gray-500 mb-2">{formatDate(match.date)}</div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-right flex-1">
                      <div className="font-bold text-emerald-700">{match.team1}</div>
                      <div className="text-3xl font-bold text-gray-800">{match.score1}</div>
                    </div>
                    <div className="px-4 text-gray-400">VS</div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-emerald-700">{match.team2}</div>
                      <div className="text-3xl font-bold text-gray-800">{match.score2}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 text-center">{match.location}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tienda */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-700">Tienda del club</h2>
              </div>
              <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                Ver todo
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {storeItems.map(item => (
                <div 
                  key={item.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-gray-200">
                    {/* Aquí irá la imagen del producto */}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-emerald-600">${item.price}</span>
                      <button className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors">
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ParentDashboard; 