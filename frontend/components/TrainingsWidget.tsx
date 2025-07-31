import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin } from 'lucide-react';

interface Training {
  id: string;
  equipo_id: string;
  equipo_nombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  color?: string;
}

const TrainingsWidget: React.FC = () => {
  const { jwt } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const parseTime = (timeStr: string | null | undefined): { hours: number, minutes: number } => {
    if (!timeStr) return { hours: 0, minutes: 0 };
    const [hours = "0", minutes = "0"] = timeStr.split(':');
    return {
      hours: parseInt(hours, 10),
      minutes: parseInt(minutes, 10)
    };
  };

  useEffect(() => {
    const fetchTrainings = async () => {
      if (!jwt) {
        console.log('No hay JWT disponible');
        return;
      }
      try {
        console.log('Iniciando fetch de entrenamientos...');
        const response = await fetch('/api/trainings', {
          headers: { 
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('Error en la respuesta:', response.status, response.statusText);
          throw new Error('Error al cargar entrenamientos');
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        // Filtrar y ordenar entrenamientos futuros
        const now = new Date();
        console.log('Fecha actual:', now.toISOString());
        
        const futureTrainings = data
          .filter((t: Training) => {
            if (!t?.fecha || !t?.hora_inicio) {
              console.log('Entrenamiento inválido:', t);
              return false;
            }

            try {
              // Convertir la fecha y hora del entrenamiento a un objeto Date
              const { hours, minutes } = parseTime(t.hora_inicio);
              const trainingDate = new Date(t.fecha);
              trainingDate.setHours(hours, minutes, 0, 0);
              
              // Comparar solo las fechas sin considerar la zona horaria
              const isFuture = trainingDate > now;
              console.log('Entrenamiento:', {
                fecha: t.fecha,
                hora: t.hora_inicio,
                fechaCompleta: trainingDate.toISOString(),
                fechaActual: now.toISOString(),
                esFuturo: isFuture
              });
              return isFuture;
            } catch (error) {
              console.error('Error procesando entrenamiento:', t, error);
              return false;
            }
          })
          .sort((a: Training, b: Training) => {
            const timeA = parseTime(a.hora_inicio);
            const timeB = parseTime(b.hora_inicio);
            
            const dateA = new Date(a.fecha);
            const dateB = new Date(b.fecha);
            
            dateA.setHours(timeA.hours, timeA.minutes, 0, 0);
            dateB.setHours(timeB.hours, timeB.minutes, 0, 0);

            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 3); // Solo mostrar los próximos 3 entrenamientos

        console.log('Entrenamientos filtrados:', futureTrainings);
        setTrainings(futureTrainings);
      } catch (error) {
        console.error('Error cargando entrenamientos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrainings();
  }, [jwt]);

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

  const formatTime = (timeStr: string) => {
    try {
      return timeStr.substring(0, 5);
    } catch (error) {
      console.error('Error formateando hora:', timeStr, error);
      return 'Hora inválida';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-emerald-100">
            <Calendar className="w-6 h-6 text-emerald-300" />
          </div>
          <div className="h-8 bg-emerald-100 rounded-lg w-64"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-emerald-50 rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-10 bg-emerald-100 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-5 bg-emerald-100 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-emerald-100 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-emerald-700">Entrenamientos de la semana</h2>
      </div>
      
      {trainings.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No hay entrenamientos programados
        </div>
      ) : (
        <div className="space-y-4">
          {trainings.map((training, index) => (
            <div 
              key={training.id || index}
              className="group bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100 hover:border-emerald-300 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-600 text-white rounded-xl px-4 py-2 font-bold text-lg min-w-[80px] text-center shadow-lg">
                    {formatTime(training.hora_inicio)}
                  </div>
                  <div>
                    <div className="font-bold text-emerald-700 text-lg">{training.equipo_nombre}</div>
                    <div className="text-gray-600 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {training.lugar}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  formatDate(training.fecha) === 'HOY'
                    ? 'bg-red-100 text-red-700 animate-pulse'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {formatDate(training.fecha)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainingsWidget; 