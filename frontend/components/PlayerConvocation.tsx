import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  Shield, 
  Hash, 
  Save, 
  X, 
  Clock,
  AlertTriangle
} from 'lucide-react';

interface Player {
  id: string;
  nombre: string;
  apellido: string;
  foto_url?: string;
  categoria: string;
  edad: number;
}

interface Convocation {
  id?: string;
  player_id: string;
  position?: string;
  is_starter: boolean;
  jersey_number?: number;
  status: 'convocado' | 'confirmado' | 'ausente' | 'lesionado';
  notes?: string;
  // Player data
  nombre?: string;
  apellido?: string;
  foto_url?: string;
  categoria?: string;
  edad?: number;
}

interface Match {
  id: string;
  equipo_local_id: string;
  equipo_visitante_id?: string;
  fecha: string;
  lugar: string;
  equipo_local_nombre: string;
  equipo_visitante_nombre?: string;
}

interface PlayerConvocationProps {
  match: Match;
  onClose: () => void;
  onSave: () => void;
}

const PlayerConvocation: React.FC<PlayerConvocationProps> = ({ match, onClose, onSave }) => {
  const { jwt } = useAuth() as any;
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [convocations, setConvocations] = useState<Convocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'convoked'>('available');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());

  const positions = [
    { value: 'portero', label: 'Portero', icon: '🥅' },
    { value: 'defensa', label: 'Defensa', icon: '🛡️' },
    { value: 'centrocampista', label: 'Centrocampista', icon: '⚽' },
    { value: 'delantero', label: 'Delantero', icon: '🎯' },
  ];

  // Load available players and existing convocations
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load team players
        const playersResponse = await fetch(`/api/matches/team/${match.equipo_local_id}/players`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        
        if (!playersResponse.ok) throw new Error('Error al cargar jugadores');
        const playersData = await playersResponse.json();
        setAvailablePlayers(playersData);
        
        // Load existing convocations
        const convocationsResponse = await fetch(`/api/matches/${match.id}/convocations`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        
        if (convocationsResponse.ok) {
          const convocationsData = await convocationsResponse.json();
          setConvocations(convocationsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    if (jwt && match.id) {
      loadData();
    }
  }, [jwt, match.id, match.equipo_local_id]);

  // Filter available players (show all, including convoked for visual feedback)
  const filteredAvailablePlayers = availablePlayers.filter(player => {
    const matchesSearch = searchTerm === '' || 
      `${player.nombre} ${player.apellido}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  
  // Get truly available players (not convoked) for selection counts
  const trulyAvailablePlayers = filteredAvailablePlayers.filter(player => 
    !convocations.some(conv => conv.player_id === player.id)
  );

  // Filter convoked players for search
  const filteredConvokedPlayers = convocations.filter(conv => {
    const fullName = `${conv.nombre} ${conv.apellido}`;
    return searchTerm === '' || fullName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle player selection for multi-select
  const handlePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  // Select all truly available players (not already convoked)
  const handleSelectAll = () => {
    const allAvailableIds = trulyAvailablePlayers.map(p => p.id);
    setSelectedPlayers(new Set(allAvailableIds));
  };

  // Deselect all players
  const handleDeselectAll = () => {
    setSelectedPlayers(new Set());
  };

  // Add multiple selected players to convocation
  const handleAddSelectedPlayers = () => {
    const playersToAdd = filteredAvailablePlayers.filter(player => 
      selectedPlayers.has(player.id)
    );
    
    const newConvocations = playersToAdd.map(player => ({
      player_id: player.id,
      position: 'centrocampista',
      is_starter: false,
      status: 'convocado' as const,
      nombre: player.nombre,
      apellido: player.apellido,
      foto_url: player.foto_url,
      categoria: player.categoria,
      edad: player.edad,
    }));
    
    setConvocations(prev => [...prev, ...newConvocations]);
    setSelectedPlayers(new Set());
    setActiveTab('convoked');
  };

  // Add single player to convocation (keep for individual selection)
  const handleAddPlayer = (player: Player) => {
    const newConvocation: Convocation = {
      player_id: player.id,
      position: 'centrocampista',
      is_starter: false,
      status: 'convocado',
      nombre: player.nombre,
      apellido: player.apellido,
      foto_url: player.foto_url,
      categoria: player.categoria,
      edad: player.edad,
    };
    
    setConvocations(prev => [...prev, newConvocation]);
    setActiveTab('convoked');
  };

  // Remove player from convocation
  const handleRemovePlayer = (playerId: string) => {
    setConvocations(prev => prev.filter(conv => conv.player_id !== playerId));
  };

  // Update convocation details
  const handleUpdateConvocation = (playerId: string, updates: Partial<Convocation>) => {
    setConvocations(prev => prev.map(conv => 
      conv.player_id === playerId ? { ...conv, ...updates } : conv
    ));
  };

  // Save convocations
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Prepare convocation data for API
      const convocationData = convocations.map(conv => ({
        player_id: conv.player_id,
        position: conv.position,
        is_starter: conv.is_starter,
        jersey_number: conv.jersey_number,
        notes: conv.notes,
      }));

      // Clear existing convocations and add new ones
      const response = await fetch(`/api/matches/${match.id}/convocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({ convocations: convocationData })
      });

      if (!response.ok) {
        throw new Error('Error al guardar convocatorias');
      }

      onSave();
    } catch (error) {
      console.error('Error saving convocations:', error);
      setError('Error al guardar las convocatorias');
    } finally {
      setSaving(false);
    }
  };

  const starters = filteredConvokedPlayers.filter(conv => conv.is_starter);
  const substitutes = filteredConvokedPlayers.filter(conv => !conv.is_starter);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-6xl w-full relative">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando jugadores...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-6xl w-full relative max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-emerald-700 flex items-center gap-3">
            <Users className="w-8 h-8" />
            Convocar Jugadores
          </h2>
          <p className="text-gray-600 mt-1">
            {match.equipo_local_nombre} vs {match.equipo_visitante_nombre || 'Equipo Externo'}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(match.fecha).toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} - {match.lugar}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-700">{convocations.length}</div>
          <div className="text-sm text-emerald-600">Total Convocados</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{starters.length}</div>
          <div className="text-sm text-blue-600">Titulares</div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-700">{substitutes.length}</div>
          <div className="text-sm text-orange-600">Suplentes</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar jugadores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'available'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Jugadores Disponibles ({filteredAvailablePlayers.length})
        </button>
        <button
          onClick={() => setActiveTab('convoked')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'convoked'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Convocados ({convocations.length})
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'available' ? (
          <div>
            {/* Bulk Actions */}
            {trulyAvailablePlayers.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-emerald-700">
                    {selectedPlayers.size} de {trulyAvailablePlayers.length} jugadores disponibles seleccionados
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-2 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    Seleccionar todos
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Deseleccionar
                  </button>
                  {selectedPlayers.size > 0 && (
                    <button
                      onClick={handleAddSelectedPlayers}
                      className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                    >
                      Convocar seleccionados ({selectedPlayers.size})
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Available Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAvailablePlayers.map(player => {
              const isSelected = selectedPlayers.has(player.id);
              const isAlreadyConvoked = convocations.some(conv => conv.player_id === player.id);
              
              return (
                <div
                  key={player.id}
                  className={`rounded-xl p-4 transition-all duration-200 border-2 ${
                    isSelected 
                      ? 'bg-emerald-100 border-emerald-300 shadow-md' 
                      : isAlreadyConvoked
                      ? 'bg-gray-200 border-gray-300'
                      : 'bg-gray-50 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isAlreadyConvoked}
                        onChange={() => !isAlreadyConvoked && handlePlayerSelection(player.id)}
                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    
                    {/* Avatar */}
                    {player.foto_url ? (
                      <img
                        src={player.foto_url}
                        alt={`${player.nombre} ${player.apellido}`}
                        className={`w-12 h-12 rounded-full object-cover border-2 ${
                          isSelected ? 'border-emerald-400' : 'border-emerald-200'
                        } ${isAlreadyConvoked ? 'opacity-50' : ''}`}
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-lg flex items-center justify-center ${
                        isAlreadyConvoked ? 'opacity-50' : ''
                      }`}>
                        {player.nombre.charAt(0)}{player.apellido.charAt(0)}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isAlreadyConvoked ? 'text-gray-500' : 'text-gray-900'}`}>
                        {player.nombre} {player.apellido}
                        {isAlreadyConvoked && <span className="ml-2 text-xs text-orange-600">(Ya convocado)</span>}
                      </h3>
                      <p className={`text-sm ${isAlreadyConvoked ? 'text-gray-400' : 'text-gray-500'}`}>
                        {player.categoria} • {player.edad} años
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddPlayer(player)}
                      disabled={isAlreadyConvoked}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                        isAlreadyConvoked
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      {isAlreadyConvoked ? 'Convocado' : 'Convocar'}
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredAvailablePlayers.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'No se encontraron jugadores' : 'Todos los jugadores han sido convocados'}
                </p>
              </div>
            )}
            </div>
          </div>
        ) : (
          /* Convoked Players */
          <div className="space-y-6">
            {/* Titulares */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Titulares ({starters.length})
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {starters.map(conv => (
                  <ConvocationCard
                    key={conv.player_id}
                    convocation={conv}
                    positions={positions}
                    onUpdate={handleUpdateConvocation}
                    onRemove={handleRemovePlayer}
                  />
                ))}
              </div>
            </div>

            {/* Suplentes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Suplentes ({substitutes.length})
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {substitutes.map(conv => (
                  <ConvocationCard
                    key={conv.player_id}
                    convocation={conv}
                    positions={positions}
                    onUpdate={handleUpdateConvocation}
                    onRemove={handleRemovePlayer}
                  />
                ))}
              </div>
            </div>

            {convocations.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aún no has convocado jugadores para este partido</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-6 mt-6 border-t">
        <button
          onClick={onClose}
          className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving || convocations.length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Guardando...' : `Guardar Convocatorias (${convocations.length})`}
        </button>
      </div>
    </div>
  );
};

// Convocation Card Component
interface ConvocationCardProps {
  convocation: Convocation;
  positions: Array<{ value: string; label: string; icon: string }>;
  onUpdate: (playerId: string, updates: Partial<Convocation>) => void;
  onRemove: (playerId: string) => void;
}

const ConvocationCard: React.FC<ConvocationCardProps> = ({ 
  convocation, 
  positions, 
  onUpdate, 
  onRemove 
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start gap-4">
        {/* Player Avatar */}
        <div className="flex-shrink-0">
          {convocation.foto_url ? (
            <img
              src={convocation.foto_url}
              alt={`${convocation.nombre} ${convocation.apellido}`}
              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-lg flex items-center justify-center">
              {convocation.nombre?.charAt(0)}{convocation.apellido?.charAt(0)}
            </div>
          )}
        </div>

        {/* Player Info and Controls */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Basic Info */}
          <div>
            <h4 className="font-semibold text-gray-900">
              {convocation.nombre} {convocation.apellido}
            </h4>
            <p className="text-sm text-gray-500">
              {convocation.categoria} • {convocation.edad} años
            </p>
            
            {/* Starter Toggle */}
            <div className="mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={convocation.is_starter}
                  onChange={(e) => onUpdate(convocation.player_id, { is_starter: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">Titular</span>
              </label>
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Posición
            </label>
            <select
              value={convocation.position || ''}
              onChange={(e) => onUpdate(convocation.player_id, { position: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
            >
              <option value="">Sin asignar</option>
              {positions.map(pos => (
                <option key={pos.value} value={pos.value}>
                  {pos.icon} {pos.label}
                </option>
              ))}
            </select>
          </div>

          {/* Jersey Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Hash className="w-4 h-4 inline mr-1" />
              Dorsal
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={convocation.jersey_number || ''}
              onChange={(e) => onUpdate(convocation.player_id, { 
                jersey_number: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              placeholder="Ej: 10"
            />
          </div>

          {/* Actions */}
          <div className="flex items-end">
            <button
              onClick={() => onRemove(convocation.player_id)}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <UserX className="w-4 h-4" />
              Quitar
            </button>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas
        </label>
        <input
          type="text"
          value={convocation.notes || ''}
          onChange={(e) => onUpdate(convocation.player_id, { notes: e.target.value })}
          placeholder="Observaciones del entrenador..."
          className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
        />
      </div>
    </div>
  );
};

export default PlayerConvocation;
