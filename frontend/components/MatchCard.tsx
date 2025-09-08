import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Trophy, 
  Edit, 
  Trash2, 
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Target
} from 'lucide-react';

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

interface MatchCardProps {
  match: Match;
  onEdit: (match: Match) => void;
  onDelete: (matchId: string) => void;
  onManageConvocations: (match: Match) => void;
  onManageResults: (match: Match) => void;
  className?: string;
}

const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  onEdit, 
  onDelete, 
  onManageConvocations,
  onManageResults,
  className = '' 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'postponed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <AlertCircle className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'postponed':
        return <Pause className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programado';
      case 'confirmed':
        return 'Confirmado';
      case 'in_progress':
        return 'En Juego';
      case 'completed':
        return 'Finalizado';
      case 'cancelled':
        return 'Cancelado';
      case 'postponed':
        return 'Aplazado';
      default:
        return status;
    }
  };

  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'friendly':
        return 'Amistoso';
      case 'league':
        return 'Liga';
      case 'cup':
        return 'Copa';
      case 'tournament':
        return 'Torneo';
      default:
        return type;
    }
  };

  const getMatchTypeIcon = (type: string) => {
    switch (type) {
      case 'friendly':
        return '🤝';
      case 'league':
        return '🏆';
      case 'cup':
        return '🏅';
      case 'tournament':
        return '⚽';
      default:
        return '⚽';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const isUpcoming = new Date(match.fecha) > new Date();
  const isPast = new Date(match.fecha) < new Date();

  const convocationProgress = match.total_convocations ? 
    (match.confirmed_convocations || 0) / match.total_convocations * 100 : 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-emerald-200 ${className}`}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getMatchTypeIcon(match.match_type)}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {match.equipo_local_nombre}
                  {/* Show scores if available */}
                  {(match.home_score !== null && match.away_score !== null) ? (
                    <span className="mx-2">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-bold text-base">
                        {match.home_score}
                      </span>
                      <span className="text-gray-400 mx-2">-</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-bold text-base">
                        {match.away_score}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-400 mx-2">vs</span>
                  )}
                  {match.equipo_visitante_nombre || 'Equipo Externo'}
                </h3>
              </div>
              {match.competition && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Trophy className="w-4 h-4" />
                  {match.competition}
                </p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(match.status)}`}>
            {getStatusIcon(match.status)}
            {getStatusLabel(match.status)}
          </span>
        </div>

        {/* Match Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>{formatDate(match.fecha)}</span>
          </div>
          
          {match.kickoff_time && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{formatTime(match.kickoff_time)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="truncate">{match.lugar}</span>
          </div>
        </div>

        {/* Score (if completed) */}
        {match.status === 'completed' && (match.home_score !== undefined || match.away_score !== undefined) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {match.home_score || 0} - {match.away_score || 0}
              </div>
              <div className="text-sm text-gray-500">Resultado Final</div>
            </div>
          </div>
        )}

        {/* Convocation Status */}
        {match.total_convocations !== undefined && match.total_convocations > 0 && (
          <div className="bg-emerald-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-700 font-medium">Convocatorias</span>
              <span className="text-emerald-600">
                {match.confirmed_convocations || 0}/{match.total_convocations} confirmados
              </span>
            </div>
            <div className="w-full bg-emerald-100 rounded-full h-2 mt-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${convocationProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Match Type and Additional Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            {getMatchTypeLabel(match.match_type)}
          </span>
          
          {match.referee && (
            <span>Árbitro: {match.referee}</span>
          )}
        </div>

        {/* Notes */}
        {match.notes && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
            <p className="text-sm text-yellow-800">{match.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {/* Manage Convocations */}
            <button
              onClick={() => onManageConvocations(match)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
              title="Gestionar convocatorias"
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Convocatorias</span>
            </button>

            {/* Manage Results */}
            <button
              onClick={() => onManageResults(match)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 rounded-lg transition-colors"
              title="Agregar resultado"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Resultado</span>
            </button>

            {/* Edit Match */}
            <button
              onClick={() => onEdit(match)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
              title="Editar partido"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </button>
          </div>

          <div className="flex gap-2">
            {/* Match Status Indicator */}
            {isUpcoming && (
              <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                Próximo
              </span>
            )}
            
            {isPast && match.status !== 'completed' && (
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                Pendiente
              </span>
            )}

            {/* Delete */}
            <button
              onClick={() => {
                if (confirm('¿Estás seguro de que quieres eliminar este partido?')) {
                  onDelete(match.id);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 rounded-lg transition-colors"
              title="Eliminar partido"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
