import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ConfirmDialog from './ConfirmDialog';

interface Team {
  id: string;
  nombre: string;
  categoria: string;
}

interface Training {
  id?: string;
  equipo_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  descripcion: string;
  es_recurrente: boolean;
  dia_semana?: string;
  fecha_fin?: string;
  color?: string;
  estado?: string;
}

interface TrainingFormProps {
  onClose: () => void;
  onSave: (wasRecurrent?: boolean) => void;
  selectedDate?: Date;
  training?: Training;
  isEdit?: boolean;
}

const TrainingForm: React.FC<TrainingFormProps> = ({
  onClose,
  onSave,
  selectedDate,
  training,
  isEdit = false
}) => {
  const { jwt } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Estado inicial del formulario
  const [formData, setFormData] = useState<Training>(() => ({
    equipo_id: training?.equipo_id || '',
    fecha: training?.fecha || selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    hora_inicio: training?.hora_inicio || '17:00',
    hora_fin: training?.hora_fin || '18:00',
    lugar: training?.lugar || '',
    descripcion: training?.descripcion || '',
    es_recurrente: training?.es_recurrente || false,
    dia_semana: training?.dia_semana || '',
    fecha_fin: training?.fecha_fin || '',
    color: training?.color || '#2563eb',
    estado: training?.estado || 'programado'
  }));

  // Cargar equipos
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams', {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        if (!response.ok) throw new Error('Error al cargar equipos');
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar equipos');
      }
    };

    fetchTeams();
  }, [jwt]);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si es recurrente y estamos editando, mostrar diálogo de confirmación
    if (isEdit && formData.es_recurrente) {
      setShowConfirmDialog(true);
      return;
    }

    await saveTraining();
  };

  const saveTraining = async () => {
    setLoading(true);
    setError('');

    try {
      // Validaciones
      if (!formData.equipo_id) throw new Error('Selecciona un equipo');
      if (!formData.fecha) throw new Error('Selecciona una fecha');
      if (!formData.hora_inicio) throw new Error('Selecciona hora de inicio');
      if (!formData.hora_fin) throw new Error('Selecciona hora de fin');
      if (!formData.lugar) throw new Error('Ingresa el lugar');
      
      // Validaciones adicionales para recurrencia
      if (formData.es_recurrente) {
        if (!formData.dia_semana) throw new Error('Selecciona el día de la semana');
        if (!formData.fecha_fin) throw new Error('Selecciona la fecha de fin');
        
        const startDate = new Date(formData.fecha);
        const endDate = new Date(formData.fecha_fin);
        
        if (endDate <= startDate) {
          throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
      }

      const url = isEdit ? `/api/trainings/${training?.id}` : '/api/trainings';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(`${url}${showConfirmDialog ? '?updateAll=true' : ''}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el entrenamiento');
      }

      onSave(formData.es_recurrente);
      onClose();
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al guardar el entrenamiento');
    } finally {
      setLoading(false);
    }
  };

  const diasSemana = [
    'Domingo', 'Lunes', 'Martes', 'Miercoles',
    'Jueves', 'Viernes', 'Sabado'
  ];

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-auto">
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Actualizar entrenamientos recurrentes"
        message="¿Deseas actualizar este y todos los entrenamientos futuros?"
        confirmText="Sí, actualizar todos"
        cancelText="No, solo este"
        type="warning"
        onConfirm={async () => {
          setShowConfirmDialog(false);
          await saveTraining();
        }}
        onCancel={async () => {
          setShowConfirmDialog(false);
          await saveTraining();
        }}
      />

      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {isEdit ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Equipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Equipo
          </label>
          <select
            name="equipo_id"
            value={formData.equipo_id}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Selecciona un equipo</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.nombre} - {team.categoria}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha y Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha
            </label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Hora Inicio
              </label>
              <input
                type="time"
                name="hora_inicio"
                value={formData.hora_inicio}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Hora Fin
              </label>
              <input
                type="time"
                name="hora_fin"
                value={formData.hora_fin}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Lugar */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Lugar
          </label>
          <input
            type="text"
            name="lugar"
            value={formData.lugar}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Recurrencia */}
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="es_recurrente"
              name="es_recurrente"
              checked={formData.es_recurrente}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="es_recurrente" className="ml-2 block text-sm font-medium text-gray-700">
              Entrenamiento recurrente
            </label>
          </div>

          {formData.es_recurrente && (
            <div className="pl-6 space-y-4 border-l-2 border-blue-100">
              {/* Día de la semana */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Día de la semana
                </label>
                <select
                  name="dia_semana"
                  value={formData.dia_semana}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required={formData.es_recurrente}
                >
                  <option value="">Selecciona un día</option>
                  {diasSemana.map(dia => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Repetir hasta
                </label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required={formData.es_recurrente}
                />
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TrainingForm; 