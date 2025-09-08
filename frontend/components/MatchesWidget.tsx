import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Clock, MapPin, Users, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

interface Match {
  id: string;
  equipo_local_id: string;
  equipo_visitante_id?: string;
  fecha: string;
  lugar: string;
  competition?: string;
  match_type: 'friendly' | 'league' | 'cup' | 'tournament';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  kickoff_time?: string;
  
  // Joined data
  equipo_local_nombre: string;
  equipo_visitante_nombre?: string;
  equipo_local_categoria?: string;
  total_convocations?: number;
  confirmed_convocations?: number;
  
  created_at: string;
}

const MatchesWidget: React.FC = () => {
  const { jwt, isAuthenticated } = useAuth() as any;
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUpcomingMatches = async () => {
      if (!jwt || !isAuthenticated) return;

      try {
        setLoading(true);
        setError('');
        
        const response = await fetch('/api/matches/upcoming?limit=2', {
          headers: { Authorization: `Bearer ${jwt}` }
        });

        if (!response.ok) {
          throw new Error('Error al cargar los partidos');
        }

        const data = await response.json();
        setMatches(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError('Error al cargar los partidos');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingMatches();
  }, [jwt, isAuthenticated]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) return 'HOY';
      if (date.toDateString() === tomorrow.toDateString()) return 'MAÑANA';
      
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        return date.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase();
      }
      
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch (error) {
      console.error('Error formateando fecha:', dateStr, error);
      return 'Fecha inválida';
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const getMatchTypeInfo = (type: string) => {
    switch (type) {
      case 'friendly':
        return { label: 'Amistoso', icon: '🤝', color: 'bg-blue-100 text-blue-700' };
      case 'league':
        return { label: 'Liga', icon: '🏆', color: 'bg-yellow-100 text-yellow-700' };
      case 'cup':
        return { label: 'Copa', icon: '🏅', color: 'bg-purple-100 text-purple-700' };
      case 'tournament':
        return { label: 'Torneo', icon: '⚽', color: 'bg-green-100 text-green-700' };
      default:
        return { label: type, icon: '⚽', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { label: 'Programado', color: 'text-blue-600' };
      case 'confirmed':
        return { label: 'Confirmado', color: 'text-green-600' };
      case 'in_progress':
        return { label: 'En Juego', color: 'text-orange-600' };
      case 'cancelled':
        return { label: 'Cancelado', color: 'text-red-600' };
      case 'postponed':
        return { label: 'Aplazado', color: 'text-yellow-600' };
      default:
        return { label: status, color: 'text-gray-600' };
    }
  };

  const handleViewAllMatches = () => {
    router.push('/partidos');
  };

  const getConvocationProgress = (match: Match) => {
    if (!match.total_convocations) return null;
    const progress = match.total_convocations > 0 
      ? ((match.confirmed_convocations || 0) / match.total_convocations) * 100 
      : 0;
    return {
      total: match.total_convocations,
      confirmed: match.confirmed_convocations || 0,
      progress
    };
  };

  if (!isAuthenticated) return null;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100 hover:shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-700">Próximos partidos</h2>
        </div>
        <button
          onClick={handleViewAllMatches}
          className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
        >
          Ver todos
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Cargando partidos...</p>
        </div>
      ) : error ? (
        /* Error State */
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      ) : matches.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay partidos programados</h3>
          <p className="text-gray-500 text-sm mb-4">Programa tu primer partido para ver la información aquí</p>
          <button
            onClick={handleViewAllMatches}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-colors text-sm font-medium"
          >
            Programar partido
          </button>
        </div>
      ) : (
        /* Matches List */
        <div className="space-y-4">
          {matches.map((match) => {
            const matchTypeInfo = getMatchTypeInfo(match.match_type);
            const statusInfo = getStatusInfo(match.status);
            const convocationProgress = getConvocationProgress(match);

            return (
              <div 
                key={match.id}
                onClick={handleViewAllMatches}
                className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-100 hover:border-teal-300 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
              >
                {/* Match Type and Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${matchTypeInfo.color}`}>
                    <span>{matchTypeInfo.icon}</span>
                    {matchTypeInfo.label}
                  </div>
                  <div className={`text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </div>
                </div>

                {/* Teams */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-right flex-1">
                      <div className="font-bold text-base text-emerald-700 group-hover:text-emerald-800 transition-colors">
                        {match.equipo_local_nombre}
                      </div>
                      <div className="text-xs text-gray-500">{match.equipo_local_categoria}</div>
                    </div>
                    <div className="text-2xl font-bold text-teal-600 px-3">VS</div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-base text-emerald-700 group-hover:text-emerald-800 transition-colors">
                        {match.equipo_visitante_nombre || 'Equipo Externo'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {match.equipo_visitante_nombre ? 'Visitante' : 'Ver en notas'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Details */}
                <div className="flex items-center justify-center gap-4 text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(match.fecha)}
                  </div>
                  {match.kickoff_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(match.kickoff_time)}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {match.lugar}
                  </div>
                </div>

                {/* Convocation Progress */}
                {convocationProgress && (
                  <div className="bg-white/50 rounded-lg p-3 border border-emerald-100">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-1 text-emerald-700 font-medium">
                        <Users className="w-3 h-3" />
                        Convocatorias
                      </div>
                      <span className="text-emerald-600">
                        {convocationProgress.confirmed}/{convocationProgress.total} confirmados
                      </span>
                    </div>
                    <div className="w-full bg-emerald-100 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${convocationProgress.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Competition */}
                {match.competition && (
                  <div className="text-center mt-3">
                    <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded-full border border-gray-200">
                      🏆 {match.competition}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Action */}
      {!loading && !error && matches.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={handleViewAllMatches}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Trophy className="w-4 h-4" />
            Gestionar partidos
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchesWidget; 