import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import MatchCard from '../components/MatchCard';
import MatchForm from '../components/MatchForm';
import PlayerConvocation from '../components/PlayerConvocation';
import MatchResults from '../components/MatchResults';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Plus, 
  Search, 
  Filter, 
  Clock,
  Target
} from 'lucide-react';

interface Team {
  id: string;
  nombre: string;
  categoria: string;
}

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
  equipo_visitante_categoria?: string;
  total_convocations?: number;
  confirmed_convocations?: number;
  
  created_at: string;
  updated_at?: string;
}

const Partidos: React.FC = () => {
  const { isAuthenticated, jwt } = useAuth() as any;
  const router = useRouter();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI State
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [showConvocationModal, setShowConvocationModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | undefined>(undefined);
  const [selectedMatch, setSelectedMatch] = useState<Match | undefined>(undefined);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Load matches and teams
  useEffect(() => {
    const loadData = async () => {
      if (!jwt) return;
      
      try {
        setLoading(true);
        setError('');
        
        const [matchesResponse, teamsResponse] = await Promise.all([
          fetch('/api/matches', { headers: { Authorization: `Bearer ${jwt}` } }),
          fetch('/api/teams', { headers: { Authorization: `Bearer ${jwt}` } })
        ]);
        
        if (!matchesResponse.ok || !teamsResponse.ok) {
          throw new Error('Error al cargar los datos');
        }
        
        const matchesData = await matchesResponse.json();
        const teamsData = await teamsResponse.json();
        
        setMatches(Array.isArray(matchesData) ? matchesData : []);
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Error al cargar los partidos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [jwt]);

  // Filter matches
  const filteredMatches = matches.filter(match => {
    const matchesSearch = searchTerm === '' || 
      match.equipo_local_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.equipo_visitante_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.lugar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.competition?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTeam = filterTeam === '' || 
      match.equipo_local_id === filterTeam || 
      match.equipo_visitante_id === filterTeam;
    
    const matchesStatus = filterStatus === '' || match.status === filterStatus;
    const matchesType = filterType === '' || match.match_type === filterType;
    
    return matchesSearch && matchesTeam && matchesStatus && matchesType;
  });

  // Statistics
  const stats = {
    total: matches.length,
    upcoming: matches.filter(m => new Date(m.fecha) > new Date() && ['scheduled', 'confirmed'].includes(m.status)).length,
    thisMonth: matches.filter(m => {
      const matchDate = new Date(m.fecha);
      const now = new Date();
      return matchDate.getMonth() === now.getMonth() && matchDate.getFullYear() === now.getFullYear();
    }).length,
    home: matches.filter(m => teams.some(t => t.id === m.equipo_local_id)).length,
    completed: matches.filter(m => m.status === 'completed').length
  };

  // Handlers
  const handleCreateMatch = async (matchData: any) => {
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify(matchData)
      });

      if (!response.ok) {
        throw new Error('Error al crear el partido');
      }

      // Reload matches
      const matchesResponse = await fetch('/api/matches', { 
        headers: { Authorization: `Bearer ${jwt}` } 
      });
      const matchesData = await matchesResponse.json();
      setMatches(Array.isArray(matchesData) ? matchesData : []);
      
      setShowMatchForm(false);
      setEditingMatch(undefined);
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  const handleUpdateMatch = async (matchData: any) => {
    if (!editingMatch) return;
    
    try {
      const response = await fetch(`/api/matches/${editingMatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify(matchData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el partido');
      }

      // Reload matches
      const matchesResponse = await fetch('/api/matches', { 
        headers: { Authorization: `Bearer ${jwt}` } 
      });
      const matchesData = await matchesResponse.json();
      setMatches(Array.isArray(matchesData) ? matchesData : []);
      
      setShowMatchForm(false);
      setEditingMatch(undefined);
    } catch (error) {
      console.error('Error updating match:', error);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwt}` }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el partido');
      }

      setMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (error) {
      console.error('Error deleting match:', error);
    }
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setShowMatchForm(true);
  };

  const handleManageConvocations = (match: Match) => {
    setSelectedMatch(match);
    setShowConvocationModal(true);
  };

  const handleManageResults = (match: Match) => {
    setSelectedMatch(match);
    setShowResultsModal(true);
  };

  const reloadMatches = async () => {
    try {
      const response = await fetch('/api/matches', { 
        headers: { Authorization: `Bearer ${jwt}` } 
      });
      const data = await response.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error reloading matches:', error);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white px-4 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-gray-600 text-lg">Cargando partidos...</p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 bg-clip-text text-transparent">
                ⚽ Partidos
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Gestiona los partidos de tus equipos y convoca jugadores
              </p>
            </div>
            
            <button
              onClick={() => {
                setEditingMatch(undefined);
                setShowMatchForm(true);
              }}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Programar Partido
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <Trophy className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total Partidos</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.upcoming}</p>
                  <p className="text-sm text-gray-600">Próximos</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-100">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">{stats.thisMonth}</p>
                  <p className="text-sm text-gray-600">Este Mes</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-100">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-700">{stats.home}</p>
                  <p className="text-sm text-gray-600">En Casa</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-100">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                  <p className="text-sm text-gray-600">Finalizados</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar partidos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                />
              </div>

              {/* Team Filter */}
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              >
                <option value="">Todos los equipos</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.nombre}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              >
                <option value="">Todos los estados</option>
                <option value="scheduled">Programado</option>
                <option value="confirmed">Confirmado</option>
                <option value="in_progress">En Juego</option>
                <option value="completed">Finalizado</option>
                <option value="cancelled">Cancelado</option>
                <option value="postponed">Aplazado</option>
              </select>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              >
                <option value="">Todos los tipos</option>
                <option value="friendly">Amistoso</option>
                <option value="league">Liga</option>
                <option value="cup">Copa</option>
                <option value="tournament">Torneo</option>
              </select>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterTeam('');
                  setFilterStatus('');
                  setFilterType('');
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4" />
                Limpiar
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Matches List */}
          {filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onEdit={handleEditMatch}
                  onDelete={handleDeleteMatch}
                  onManageConvocations={handleManageConvocations}
                  onManageResults={handleManageResults}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
              <Trophy className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-700 mb-4">
                {matches.length === 0 ? '¡Programa tu primer partido!' : 'No se encontraron partidos'}
              </h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {matches.length === 0 
                  ? 'Comienza a gestionar los partidos de tus equipos creando tu primer partido.'
                  : 'Ajusta los filtros para encontrar los partidos que buscas.'
                }
              </p>
              {matches.length === 0 && (
                <button
                  onClick={() => {
                    setEditingMatch(undefined);
                    setShowMatchForm(true);
                  }}
                  className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  Programar Primer Partido
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Match Form Modal */}
      {showMatchForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <MatchForm
              match={editingMatch}
              onSave={editingMatch ? handleUpdateMatch : handleCreateMatch}
              onCancel={() => {
                setShowMatchForm(false);
                setEditingMatch(undefined);
              }}
              isEdit={!!editingMatch}
            />
          </div>
        </div>
      )}

      {/* Player Convocation Modal */}
      {showConvocationModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <PlayerConvocation
              match={selectedMatch}
              onClose={() => {
                setShowConvocationModal(false);
                setSelectedMatch(undefined);
              }}
              onSave={() => {
                setShowConvocationModal(false);
                setSelectedMatch(undefined);
                reloadMatches();
              }}
            />
          </div>
        </div>
      )}

      {/* Match Results Modal */}
      {showResultsModal && selectedMatch && (
        <MatchResults
          match={selectedMatch}
          isOpen={showResultsModal}
          onClose={() => {
            setShowResultsModal(false);
            setSelectedMatch(undefined);
          }}
          onSave={() => {
            setShowResultsModal(false);
            setSelectedMatch(undefined);
            reloadMatches();
          }}
        />
      )}
    </>
  );
};

export default Partidos; 