import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Training {
  id: string;
  equipo_id: string;
  equipo_nombre: string;
  equipo_categoria: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  color: string;
}

const TrainingsWidget: React.FC = () => {
  const { jwt: contextJwt, isAuthenticated } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  if (!isAuthenticated) return null;

  // Usar JWT del localStorage como fallback
  const jwt = contextJwt || localStorage.getItem('jwt');

  useEffect(() => {
    if (!jwt) {
      console.log('No hay JWT, saltando fetch');
      return;
    }

    const fetchTrainings = async () => {
      try {
        const response = await fetch('/api/trainings', {
          headers: { 
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('Error en la respuesta:', response.status, response.statusText);
          throw new Error('Error al cargar entrenamientos');
        }

        const data = await response.json();
        
        // Filtrar entrenamientos futuros y ordenar por fecha/hora
        const now = new Date();
        const futureTrainings = data
          // Primero filtrar entrenamientos con datos válidos
          .filter((t: Training) => {
            if (!t.fecha || !t.hora_inicio) {
              console.log('Entrenamiento con datos inválidos:', t);
              return false;
            }
            return true;
          })
          // Luego filtrar por fecha futura
          .filter((t: Training) => {
            try {
              // Extraer la fecha del ISO string
              const fechaLimpia = t.fecha.split('T')[0];
              
              // Convertir la hora a formato de 24 horas (HH:mm:ss)
              const [hours, minutes] = t.hora_inicio.split(':');
              const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
              
              // Construir la fecha correctamente
              const trainingDate = new Date(`${fechaLimpia}T${formattedTime}`);
              
              const isFuture = trainingDate >= now;
              return isFuture;
            } catch (error) {
              console.error('Error procesando entrenamiento:', t, error);
              return false;
            }
          })
          .sort((a: Training, b: Training) => {
            try {
              const fechaA = a.fecha.split('T')[0];
              const fechaB = b.fecha.split('T')[0];
              const [hoursA, minutesA] = a.hora_inicio.split(':');
              const [hoursB, minutesB] = b.hora_inicio.split(':');
              const dateA = new Date(`${fechaA}T${hoursA.padStart(2, '0')}:${minutesA.padStart(2, '0')}:00`);
              const dateB = new Date(`${fechaB}T${hoursB.padStart(2, '0')}:${minutesB.padStart(2, '0')}:00`);
              return dateA.getTime() - dateB.getTime();
            } catch (error) {
              console.error('Error ordenando entrenamientos:', { a, b }, error);
              return 0;
            }
          })
          .slice(0, 3); // Solo los próximos 3 entrenamientos
        
        setTrainings(futureTrainings);
      } catch (error) {
        console.error('Error cargando entrenamientos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainings();
  }, [jwt, isAuthenticated]);

  const formatDate = (date: string) => {
    try {
      // Limpiar la fecha si viene en formato ISO
      const cleanDate = date.split('T')[0];
      const d = new Date(cleanDate);
      return d.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    } catch (error) {
      console.error('Error formateando fecha:', date, error);
      return date;
    }
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    } catch (error) {
      console.error('Error formateando hora:', time, error);
      return time;
    }
  };

      if (loading) {
      return (
        <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-lg p-4 animate-pulse flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (trainings.length === 0) {
      return null;
    }

    return (
      <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-lg p-4">
        <h2 className="text-xl font-bold text-emerald-700 flex items-center gap-2 mb-4">
          📅 Entrenamientos de la semana
        </h2>
        <div className="flex items-center gap-6">
        {trainings.map((training, index) => {
          const isToday = new Date(training.fecha).toDateString() === new Date().toDateString();
          
          return (
            <div 
              key={training.id}
              className={`flex items-center gap-3 ${index < trainings.length - 1 ? 'border-r pr-6' : ''}`}
            >
              {/* Hora y equipo */}
              <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow p-3 min-w-[4.5rem]">
                <div className="text-2xl font-bold text-gray-800">
                  {formatTime(training.hora_inicio)}
                </div>
                <div className="text-xs font-medium text-gray-500">
                  {training.equipo_nombre}
                </div>
              </div>

              {/* Detalles */}
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-800">
                  {isToday ? 'HOY' : formatDate(training.fecha)}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {training.lugar}
                </div>
              </div>

              {/* Indicador "HOY" */}
              {isToday && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Hoy
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrainingsWidget; 