import React from 'react';
import { Trophy, Calendar, Clock, MapPin } from 'lucide-react';

const MatchesWidget: React.FC = () => {
  // Mock data - Esto se reemplazará con datos reales cuando se implemente el backend
  const matches = [
    { 
      id: '1',
      team1: 'Sub-13', 
      team2: 'Rival FC', 
      date: '2024-08-10', 
      time: '15:00', 
      location: 'Estadio Principal',
      type: 'Local'
    },
    { 
      id: '2',
      team1: 'Sub-13', 
      team2: 'Deportivo FC', 
      date: '2024-08-17', 
      time: '16:30', 
      location: 'Estadio Visitante',
      type: 'Visitante'
    }
  ];

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      if (isToday) return 'HOY';
      return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch (error) {
      console.error('Error formateando fecha:', dateStr, error);
      return 'Fecha inválida';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-emerald-700">Próximos partidos</h2>
      </div>
      
      {matches.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No hay partidos programados
        </div>
      ) : (
        <div className="space-y-6">
          {matches.map((match) => (
            <div 
              key={match.id}
              className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-100 hover:border-teal-300 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="text-center mb-4">
                <div className="inline-block bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-medium mb-2">
                  {match.type}
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-lg text-emerald-700">{match.team1}</div>
                    <div className="text-sm text-gray-600">Local</div>
                  </div>
                  <div className="text-3xl font-bold text-teal-600 px-4">VS</div>
                  <div className="text-left">
                    <div className="font-bold text-lg text-emerald-700">{match.team2}</div>
                    <div className="text-sm text-gray-600">Visitante</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(match.date)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {match.time}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {match.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchesWidget; 