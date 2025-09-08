import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, MapPin, Trophy, Users, X, Save } from 'lucide-react';

interface Team {
  id: string;
  nombre: string;
  categoria: string;
}

interface Match {
  id?: string;
  equipo_local_id: string;
  equipo_visitante_id?: string;
  fecha: string;
  lugar: string;
  competition?: string;
  match_type: 'friendly' | 'league' | 'cup' | 'tournament';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  kickoff_time?: string;
  referee?: string;
  notes?: string;
  duration_minutes?: number;
}

interface MatchFormProps {
  match?: Match;
  onSave: (match: Match) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const MatchForm: React.FC<MatchFormProps> = ({ match, onSave, onCancel, isEdit = false }) => {
  const { jwt } = useAuth() as any;
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<Match>({
    equipo_local_id: match?.equipo_local_id || '',
    equipo_visitante_id: match?.equipo_visitante_id || '',
    fecha: match?.fecha ? match.fecha.split('T')[0] : '',
    lugar: match?.lugar || '',
    competition: match?.competition || '',
    match_type: match?.match_type || 'friendly',
    status: match?.status || 'scheduled',
    kickoff_time: match?.kickoff_time || '15:00',
    referee: match?.referee || '',
    notes: match?.notes || '',
    duration_minutes: match?.duration_minutes || 90,
  });

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams', {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar equipos');
        
        const data = await response.json();
        setTeams(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar los equipos');
      }
    };

    if (jwt) {
      fetchTeams();
    }
  }, [jwt]);

  const handleInputChange = (field: keyof Match, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.equipo_local_id) {
        throw new Error('Debes seleccionar el equipo local');
      }
      if (!formData.fecha) {
        throw new Error('Debes seleccionar la fecha del partido');
      }
      if (!formData.lugar) {
        throw new Error('Debes especificar el lugar del partido');
      }

      // Si es equipo visitante externo, no validamos
      const isExternalOpponent = !formData.equipo_visitante_id;

      const matchData = {
        ...formData,
        equipo_visitante_id: formData.equipo_visitante_id || null,
      };

      onSave(matchData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const matchTypes = [
    { value: 'friendly', label: 'Amistoso' },
    { value: 'league', label: 'Liga/Torneo Local' },
    { value: 'cup', label: 'Copa/Eliminatorias' },
    { value: 'tournament', label: 'Torneo' },
  ];

  const statusOptions = [
    { value: 'scheduled', label: 'Programado' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'postponed', label: 'Aplazado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  if (isEdit) {
    statusOptions.push(
      { value: 'in_progress', label: 'En Juego' },
      { value: 'completed', label: 'Finalizado' }
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-emerald-700 flex items-center gap-3">
          <Trophy className="w-8 h-8" />
          {isEdit ? 'Editar Partido' : 'Programar Partido'}
        </h2>
        <button
          onClick={onCancel}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Equipos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Equipo Local */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="w-4 h-4 text-emerald-600" />
              Equipo Local *
            </label>
            <select
              value={formData.equipo_local_id}
              onChange={(e) => handleInputChange('equipo_local_id', e.target.value)}
              required
              className="w-full rounded-lg border border-emerald-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">Seleccionar equipo local...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.nombre} ({team.categoria})
                </option>
              ))}
            </select>
          </div>

          {/* Equipo Visitante */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="w-4 h-4 text-teal-600" />
              Equipo Visitante
            </label>
            <select
              value={formData.equipo_visitante_id || ''}
              onChange={(e) => handleInputChange('equipo_visitante_id', e.target.value)}
              className="w-full rounded-lg border border-emerald-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">Equipo externo (especificar en notas)</option>
              {teams
                .filter(team => team.id !== formData.equipo_local_id)
                .map(team => (
                  <option key={team.id} value={team.id}>
                    {team.nombre} ({team.categoria})
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500">
              Deja vacío si juegas contra un equipo externo y especifícalo en las notas
            </p>
          </div>
        </div>

        {/* Fecha y Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Fecha del Partido *
            </label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => handleInputChange('fecha', e.target.value)}
              required
              className="w-full rounded-lg border border-emerald-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="w-4 h-4 text-emerald-600" />
              Hora de Inicio
            </label>
            <input
              type="time"
              value={formData.kickoff_time}
              onChange={(e) => handleInputChange('kickoff_time', e.target.value)}
              className="w-full rounded-lg border border-emerald-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>

        {/* Lugar */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Lugar del Partido *
          </label>
          <input
            type="text"
            value={formData.lugar}
            onChange={(e) => handleInputChange('lugar', e.target.value)}
            placeholder="Ej: Estadio Municipal, Cancha La Esperanza..."
            required
            className="w-full rounded-lg border border-emerald-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        {/* Tipo de Partido y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Trophy className="w-4 h-4 text-emerald-600" />
              Tipo de Partido
            </label>
            <select
              value={formData.match_type}
              onChange={(e) => handleInputChange('match_type', e.target.value as any)}
              className="w-full rounded-lg border border-emerald-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {matchTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Estado del Partido
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as any)}
              className="w-full rounded-lg border border-emerald-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Competición */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Trophy className="w-4 h-4 text-emerald-600" />
            Competición/Torneo
          </label>
          <input
            type="text"
            value={formData.competition || ''}
            onChange={(e) => handleInputChange('competition', e.target.value)}
            placeholder="Ej: Liga Juvenil 2024, Copa Interclubes..."
            className="w-full rounded-lg border border-emerald-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Árbitro
            </label>
            <input
              type="text"
              value={formData.referee || ''}
              onChange={(e) => handleInputChange('referee', e.target.value)}
              placeholder="Nombre del árbitro"
              className="w-full rounded-lg border border-emerald-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Duración (minutos)
            </label>
            <input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value))}
              min="15"
              max="120"
              className="w-full rounded-lg border border-emerald-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Notas y Observaciones
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Información adicional, equipo visitante externo, condiciones especiales..."
            rows={3}
            className="w-full rounded-lg border border-emerald-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Guardando...' : (isEdit ? 'Actualizar Partido' : 'Crear Partido')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MatchForm;
