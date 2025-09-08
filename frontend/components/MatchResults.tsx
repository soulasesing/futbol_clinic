import React, { useState, useEffect } from 'react';
import { X, Target, Trophy, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
  home_score?: number;
  away_score?: number;
  referee?: string;
  notes?: string;
  duration_minutes?: number;
  
  // Joined data
  equipo_local_nombre: string;
  equipo_visitante_nombre?: string;
  equipo_local_categoria?: string;
  total_convocations?: number;
  confirmed_convocations?: number;
  
  created_at: string;
  updated_at?: string;
}

interface MatchResultsProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const MatchResults: React.FC<MatchResultsProps> = ({ match, isOpen, onClose, onSave }) => {
  const { jwt } = useAuth() as any;
  const [homeScore, setHomeScore] = useState<number>(match.home_score || 0);
  const [awayScore, setAwayScore] = useState<number>(match.away_score || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState<string>(match.status);

  useEffect(() => {
    if (isOpen) {
      setHomeScore(match.home_score || 0);
      setAwayScore(match.away_score || 0);
      setNewStatus(match.status);
      setError('');
    }
  }, [isOpen, match]);

  const handleSave = async () => {
    if (!jwt) return;

    try {
      setLoading(true);
      setError('');

      const updateData = {
        ...match,
        home_score: homeScore,
        away_score: awayScore,
        status: newStatus
      };

      const response = await fetch(`/api/matches/${match.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el resultado');
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error updating match results:', err);
      setError(err.message || 'Error al guardar el resultado');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getResult = () => {
    if (homeScore > awayScore) return 'Victoria local';
    if (awayScore > homeScore) return 'Victoria visitante';
    return 'Empate';
  };

  const getResultColor = () => {
    if (homeScore > awayScore) return 'text-green-600 bg-green-50';
    if (awayScore > homeScore) return 'text-red-600 bg-red-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Resultado del Partido</h2>
                <p className="text-sm text-gray-500">
                  {match.equipo_local_nombre} vs {match.equipo_visitante_nombre || 'Equipo Externo'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Match Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">
                {new Date(match.fecha).toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
              <p className="text-sm text-gray-500">{match.lugar}</p>
            </div>
          </div>

          {/* Score Input */}
          <div className="space-y-6">
            {/* Teams and Scores */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
              <div className="grid grid-cols-3 gap-4 items-center">
                {/* Home Team */}
                <div className="text-center">
                  <h3 className="font-bold text-emerald-800 mb-2">
                    {match.equipo_local_nombre}
                  </h3>
                  <label htmlFor="home-score" className="block text-sm text-gray-600 mb-1">Goles</label>
                  <input
                    id="home-score"
                    type="number"
                    min="0"
                    max="20"
                    value={homeScore}
                    onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-center text-2xl font-bold border-2 border-emerald-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  />
                </div>

                {/* VS */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-4">VS</div>
                  <div className={`px-3 py-2 rounded-lg text-sm font-medium ${getResultColor()}`}>
                    {getResult()}
                  </div>
                </div>

                {/* Away Team */}
                <div className="text-center">
                  <h3 className="font-bold text-emerald-800 mb-2">
                    {match.equipo_visitante_nombre || 'Equipo Externo'}
                  </h3>
                  <label htmlFor="away-score" className="block text-sm text-gray-600 mb-1">Goles</label>
                  <input
                    id="away-score"
                    type="number"
                    min="0"
                    max="20"
                    value={awayScore}
                    onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-center text-2xl font-bold border-2 border-emerald-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Match Status */}
            <div>
              <label htmlFor="match-status" className="block text-sm font-medium text-gray-700 mb-2">
                Estado del Partido
              </label>
              <select
                id="match-status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              >
                <option value="scheduled">Programado</option>
                <option value="confirmed">Confirmado</option>
                <option value="in_progress">En Juego</option>
                <option value="completed">Finalizado</option>
                <option value="cancelled">Cancelado</option>
                <option value="postponed">Aplazado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trophy className="w-4 h-4" />
              )}
              {loading ? 'Guardando...' : 'Guardar Resultado'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchResults;
