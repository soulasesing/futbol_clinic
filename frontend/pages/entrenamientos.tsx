import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import TrainingForm from '../components/TrainingForm';

interface Team {
  id: string;
  nombre: string;
  categoria: string;
}

interface Training {
  id: string;
  equipo_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  descripcion: string;
  es_recurrente: boolean;
  recurrence_type: 'none' | 'weekly' | 'biweekly' | 'monthly';
  recurrence_days: string[];
  recurrence_end_date: string;
  recurrence_interval: number;
  color: string;
  estado: string;
  is_cancelled?: boolean;
  is_template?: boolean;
  instance_date?: string;
  dia_semana?: string; // Mantener para compatibilidad
}

const TrainingsPage: React.FC = () => {
  const { isAuthenticated, jwt } = useAuth() as any;
  const [teams, setTeams] = useState<Team[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTraining, setSelectedTraining] = useState<Training | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'warning' | 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });
  const [viewMode, setViewMode] = useState('timeGridWeek');
  const [calendarRange, setCalendarRange] = useState({ start: '', end: '' });

  // Cargar equipos y entrenamientos
  useEffect(() => {
    if (!jwt) return;

    const fetchData = async () => {
      try {
        const [teamsRes, trainingsRes] = await Promise.all([
          fetch('/api/teams', { headers: { Authorization: `Bearer ${jwt}` } }),
          fetch(`/api/trainings${calendarRange.start && calendarRange.end ? `?startDate=${calendarRange.start}&endDate=${calendarRange.end}` : ''}`, { 
            headers: { Authorization: `Bearer ${jwt}` } 
          })
        ]);

        if (!teamsRes.ok || !trainingsRes.ok) {
          throw new Error('Error al cargar datos');
        }

        const teamsData = await teamsRes.json();
        const trainingsData = await trainingsRes.json();

        console.log('Entrenamientos cargados:', trainingsData.length, 'entrenamientos');
        console.log('Rango solicitado:', calendarRange.start, 'a', calendarRange.end);

        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setTrainings(Array.isArray(trainingsData) ? trainingsData : []);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jwt, calendarRange]);

  // Actualizar rango cuando cambia la vista del calendario
  const handleDatesSet = (dateInfo: any) => {
    const start = dateInfo.start.toISOString().split('T')[0];
    const end = dateInfo.end.toISOString().split('T')[0];
    
    console.log('Calendario cambió vista:', start, 'a', end);
    setCalendarRange({ start, end });
  };

  // Convertir entrenamientos al formato del calendario
  const calendarEvents = trainings.map(training => {
    const team = teams.find(t => t.id === training.equipo_id);
    const eventDate = training.instance_date || training.fecha.split('T')[0];

    // Colores que siguen el tema de la app
    const colors = [
      { bg: '#10b981', border: '#059669', text: '#ffffff' }, // Emerald
      { bg: '#14b8a6', border: '#0d9488', text: '#ffffff' }, // Teal
      { bg: '#06b6d4', border: '#0891b2', text: '#ffffff' }, // Cyan
      { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' }, // Blue
      { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' }, // Purple
      { bg: '#f59e0b', border: '#d97706', text: '#ffffff' }, // Amber
      { bg: '#ef4444', border: '#dc2626', text: '#ffffff' }, // Red
      { bg: '#22c55e', border: '#16a34a', text: '#ffffff' }  // Green
    ];

    // Si está cancelado, usar color gris
    const isCancelled = training.is_cancelled || training.estado === 'cancelado';
    let selectedColor;
    
    if (isCancelled) {
      selectedColor = { bg: '#6b7280', border: '#4b5563', text: '#ffffff' };
    } else {
      const colorIndex = Math.abs(training.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;
      selectedColor = colors[colorIndex];
    }

    const title = isCancelled 
      ? `[CANCELADO] ${team?.nombre || 'Equipo'} - ${training.lugar}`
      : `${team?.nombre || 'Equipo'} - ${training.lugar}`;

    return {
      id: training.id,
      title,
      start: `${eventDate}T${training.hora_inicio}`,
      end: `${eventDate}T${training.hora_fin}`,
      backgroundColor: selectedColor.bg,
      borderColor: selectedColor.border,
      textColor: selectedColor.text,
      extendedProps: {
        training,
        team,
        isCancelled,
        isTemplate: training.is_template || false
      }
    };
  });

  // Función para refrescar datos del rango actual
  const refreshData = () => {
    setLoading(true);
    // Trigger useEffect recargando el rango
    setCalendarRange(prev => ({ ...prev }));
  };



    // Manejar click en evento del calendario
  const handleEventClick = (clickInfo: any) => {
    const training = clickInfo.event.extendedProps.training;
    
    // Mostrar menú contextual
    const menu = document.createElement('div');
    menu.className = 'bg-white rounded-lg shadow-xl p-2 absolute z-50';
    menu.style.left = `${clickInfo.jsEvent.pageX}px`;
    menu.style.top = `${clickInfo.jsEvent.pageY}px`;

    // Función para cerrar el menú de forma segura
    const closeMenu = () => {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu);
      }
    };

    // Botones del menú
    const editButton = document.createElement('button');
    editButton.className = 'w-full text-left px-4 py-2 hover:bg-gray-100 rounded';
    editButton.innerText = 'Editar';
    editButton.onclick = () => {
      setSelectedTraining(training);
      setShowForm(true);
      closeMenu();
    };

    const deleteButton = document.createElement('button');
    deleteButton.className = 'w-full text-left px-4 py-2 hover:bg-gray-100 rounded text-red-600';
    deleteButton.innerText = training.es_recurrente ? 'Eliminar este y futuros' : 'Eliminar';
    deleteButton.onclick = () => {
      setConfirmDialog({
        isOpen: true,
        title: training.es_recurrente ? 'Eliminar entrenamientos recurrentes' : 'Eliminar entrenamiento',
        message: training.es_recurrente 
          ? '¿Deseas eliminar este entrenamiento y todos los futuros?' 
          : '¿Deseas eliminar este entrenamiento?',
        type: 'danger',
        onConfirm: async () => {
          try {
            const response = await fetch(`/api/trainings/${training.id}?deleteAll=${training.es_recurrente}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${jwt}` }
            });

            if (!response.ok) throw new Error('Error al eliminar');
            
            refreshData();
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar el entrenamiento');
          }
        }
      });
      closeMenu();
    };

    if (training.es_recurrente) {
      const deleteOneButton = document.createElement('button');
      deleteOneButton.className = 'w-full text-left px-4 py-2 hover:bg-gray-100 rounded text-red-600';
      deleteOneButton.innerText = 'Eliminar solo este';
      deleteOneButton.onclick = () => {
        setConfirmDialog({
          isOpen: true,
          title: 'Eliminar entrenamiento',
          message: '¿Deseas eliminar solo este entrenamiento?',
          type: 'danger',
          onConfirm: async () => {
            try {
              const response = await fetch(`/api/trainings/${training.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${jwt}` }
              });

              if (!response.ok) throw new Error('Error al eliminar');
              
              refreshData();
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            } catch (error) {
              console.error('Error:', error);
              alert('Error al eliminar el entrenamiento');
            }
          }
        });
        closeMenu();
      };
      menu.appendChild(deleteOneButton);
    }

    menu.appendChild(editButton);
    menu.appendChild(deleteButton);

    // Agregar menú al body y manejador para cerrarlo
    document.body.appendChild(menu);

    // Manejador de clic fuera del menú
    const handleClickOutside = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        closeMenu();
        document.removeEventListener('click', handleClickOutside);
      }
    };

    // Agregar el manejador después de un pequeño delay para evitar que se active inmediatamente
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
  };

  // Manejar click en fecha del calendario
  const handleDateClick = (selectInfo: any) => {
    setSelectedDate(selectInfo.date);
    setSelectedTraining(undefined);
    setShowForm(true);
  };

  // Cancelar instancia específica
  const handleCancelInstance = async (trainingId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar este entrenamiento específico?')) {
      return;
    }

    try {
      const response = await fetch(`/api/trainings/${trainingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cancelar entrenamiento');
      }

      refreshData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cancelar el entrenamiento');
    }
  };



  if (!isAuthenticated) return null;

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        type={confirmDialog.type}
      />
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Title and Description */}
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  📅 Calendario de Entrenamientos
                </h1>
                <p className="text-gray-600 text-lg">
                  Gestiona y visualiza todos los entrenamientos de tus equipos
                </p>
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedTraining(undefined);
                    setSelectedDate(new Date());
                    setShowForm(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Entrenamiento
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Entrenamientos</p>
                    <p className="text-2xl font-bold text-gray-900">{trainings.length}</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Equipos Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
                  </div>
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {trainings.filter(t => {
                        const today = new Date();
                        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                        const trainingDate = new Date(t.instance_date || t.fecha);
                        return trainingDate >= today && trainingDate <= weekFromNow;
                      }).length}
                    </p>
                  </div>
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cancelados</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {trainings.filter(t => t.is_cancelled || t.estado === 'cancelado').length}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Cargando calendario...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Calendar Toolbar */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">Vista del Calendario</h2>
                  </div>
                  
                  {/* View Mode Selector */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {[
                      { key: 'dayGridMonth', label: 'Mes', icon: '📅' },
                      { key: 'timeGridWeek', label: 'Semana', icon: '📊' },
                      { key: 'timeGridDay', label: 'Día', icon: '⏰' }
                    ].map(view => (
                      <button
                        key={view.key}
                        onClick={() => setViewMode(view.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                          viewMode === view.key
                            ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span>{view.icon}</span>
                        {view.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calendar Container */}
              <div className="p-6">
                <div className="calendar-container">
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={viewMode}
                    key={viewMode}
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: ''
                    }}
                    locale={esLocale}
                    events={calendarEvents}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    datesSet={handleDatesSet}
                    slotMinTime="06:00:00"
                    slotMaxTime="22:00:00"
                    allDaySlot={false}
                    height="auto"
                    expandRows={true}
                    stickyHeaderDates={true}
                    dayMaxEvents={true}
                    eventDisplay="block"
                    slotDuration="00:30:00"
                    slotLabelInterval="01:00"
                    slotLabelFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }}
                    buttonText={{
                      today: 'Hoy',
                      month: 'Mes',
                      week: 'Semana',
                      day: 'Día',
                      prev: '◀',
                      next: '▶'
                    }}
                    views={{
                      timeGrid: {
                        dayMaxEvents: 4,
                        dayMaxEventRows: 4
                      }
                    }}
                    eventDidMount={(info) => {
                      // Enhanced event styling
                      info.el.style.borderRadius = '8px';
                      info.el.style.border = 'none';
                      info.el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      info.el.style.transition = 'all 0.2s ease';
                      info.el.style.cursor = 'pointer';
                      
                      // Agregar tooltip con información adicional
                      const training = info.event.extendedProps.training;
                      const team = info.event.extendedProps.team;
                      const isCancelled = info.event.extendedProps.isCancelled;
                      const isTemplate = info.event.extendedProps.isTemplate;
                      
                      let tooltip = `${team?.nombre || 'Equipo'}\n`;
                      tooltip += `${training.hora_inicio} - ${training.hora_fin}\n`;
                      tooltip += `Lugar: ${training.lugar}\n`;
                      if (training.descripcion) {
                        tooltip += `Descripción: ${training.descripcion}\n`;
                      }
                      if (isCancelled) {
                        tooltip += '\n[CANCELADO]';
                      }
                      if (isTemplate) {
                        tooltip += '\n[PLANTILLA]';
                      }
                      
                      info.el.title = tooltip;
                      
                      // Agregar funcionalidad de cancelar con click derecho
                      if (!isCancelled && !isTemplate) {
                        info.el.addEventListener('contextmenu', (e) => {
                          e.preventDefault();
                          handleCancelInstance(training.id);
                        });
                      }
                      
                      info.el.addEventListener('mouseenter', () => {
                        info.el.style.transform = 'translateY(-1px)';
                        info.el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        info.el.style.zIndex = '10';
                      });
                      
                      info.el.addEventListener('mouseleave', () => {
                        info.el.style.transform = 'translateY(0)';
                        info.el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        info.el.style.zIndex = '1';
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <TrainingForm
                onClose={() => {
                  setShowForm(false);
                  setSelectedTraining(undefined);
                  setSelectedDate(undefined);
                }}
                onSave={(wasRecurrent?: boolean) => {
                  setShowForm(false);
                  setSelectedTraining(undefined);
                  setSelectedDate(undefined);
                  refreshData();
                }}
                selectedDate={selectedDate}
                training={selectedTraining}
                isEdit={!!selectedTraining}
              />
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        /* Calendar Custom Styles - Clean and Professional */
        .fc {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        
        .fc-theme-standard .fc-scrollgrid {
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }
        
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: #f3f4f6 !important;
        }
        
        .fc-col-header {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9) !important;
        }
        
        .fc-col-header-cell {
          color: #374151 !important;
          font-weight: 600 !important;
          padding: 12px 8px !important;
          font-size: 0.875rem !important;
        }
        
        .fc-daygrid-day, .fc-timegrid-slot {
          background: #ffffff !important;
          transition: background-color 0.2s ease !important;
        }
        
        .fc-daygrid-day:hover {
          background: #f9fafb !important;
        }
        
        .fc-timegrid-slot:hover {
          background: #f0fdfa !important;
        }
        
        .fc-day-today {
          background: linear-gradient(135deg, #ecfdf5, #f0fdf4) !important;
        }
        
        .fc-button {
          background: #10b981 !important;
          border: 1px solid #059669 !important;
          border-radius: 6px !important;
          padding: 6px 12px !important;
          font-weight: 500 !important;
          font-size: 0.875rem !important;
          transition: all 0.2s ease !important;
        }
        
        .fc-button:hover {
          background: #059669 !important;
          border-color: #047857 !important;
          transform: translateY(-1px) !important;
        }
        
        .fc-button:disabled {
          opacity: 0.5 !important;
          transform: none !important;
        }
        
        .fc-button-primary:not(:disabled):active,
        .fc-button-primary:not(:disabled).fc-button-active {
          background: #047857 !important;
          border-color: #065f46 !important;
        }
        
        .fc-toolbar-title {
          color: #111827 !important;
          font-weight: 700 !important;
          font-size: 1.5rem !important;
        }
        
        .fc-timegrid-axis {
          color: #6b7280 !important;
          font-weight: 500 !important;
          font-size: 0.75rem !important;
        }
        
        .fc-event {
          cursor: pointer !important;
          border-radius: 8px !important;
          border: none !important;
          font-weight: 500 !important;
          font-size: 0.875rem !important;
          padding: 2px 6px !important;
        }
        
        .fc-event-title {
          font-weight: 600 !important;
        }
        
        .fc-timegrid-event {
          margin: 1px !important;
        }
        
        .fc-more-link {
          color: #10b981 !important;
          font-weight: 600 !important;
          font-size: 0.75rem !important;
        }
        
        .fc-more-link:hover {
          color: #059669 !important;
        }
        
        /* Scrollbar styling for calendar */
        .fc-scroller::-webkit-scrollbar {
          width: 6px;
        }
        
        .fc-scroller::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 3px;
        }
        
        .fc-scroller::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        
        .fc-scroller::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        
        /* Calendar animation */
        .calendar-container {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Responsive improvements */
        @media (max-width: 768px) {
          .fc-toolbar {
            flex-direction: column !important;
            gap: 1rem !important;
          }
          
          .fc-toolbar-chunk {
            display: flex !important;
            justify-content: center !important;
          }
          
          .fc-button {
            font-size: 0.75rem !important;
            padding: 4px 8px !important;
          }
          
          .fc-toolbar-title {
            font-size: 1.25rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default TrainingsPage;