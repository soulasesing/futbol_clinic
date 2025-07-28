import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
  dia_semana?: string;
  es_recurrente: boolean;
  color: string;
  estado: string;
}

interface TrainingFormProps {
  onClose: () => void;
  onSave: () => void;
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
  const { jwt } = useAuth() as any;
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<Training>({
    equipo_id: training?.equipo_id || '',
    fecha: training?.fecha || selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    hora_inicio: training?.hora_inicio || '09:00',
    hora_fin: training?.hora_fin || '10:30',
    lugar: training?.lugar || 'Campo principal',
    descripcion: training?.descripcion || '',
    es_recurrente: training?.es_recurrente || false,
    color: training?.color || '#22c55e',
    estado: training?.estado || 'programado'
  });

  // Cargar equipos
  useEffect(() => {
    fetch('/api/teams', { headers: { Authorization: `Bearer ${jwt}` } })
      .then(res => res.json())
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error cargando equipos:', err));
  }, [jwt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEdit ? `/api/trainings/${training?.id}` : '/api/trainings';
      const method = isEdit ? 'PUT' : 'POST';

      // Asegurarnos de que la fecha y hora estén en el formato correcto
      const trainingData = {
        ...formData,
        fecha: formData.fecha, // Ya está en formato YYYY-MM-DD
        hora_inicio: `${formData.hora_inicio}:00`, // Asegurar formato HH:MM:SS
        hora_fin: `${formData.hora_fin}:00`, // Asegurar formato HH:MM:SS
      };

      console.log('Enviando datos:', trainingData); // Para debug

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify(trainingData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar el entrenamiento');
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
      console.error('Error al guardar:', err); // Para debug
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-emerald-700">
              {isEdit ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-500 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipo
              </label>
              <select
                value={formData.equipo_id}
                onChange={e => setFormData(prev => ({ ...prev, equipo_id: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              >
                <option value="">Seleccionar equipo</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.nombre} - {team.categoria}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={e => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-300 px-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora inicio
                </label>
                <input
                  type="time"
                  value={formData.hora_inicio}
                  onChange={e => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora fin
                </label>
                <input
                  type="time"
                  value={formData.hora_fin}
                  onChange={e => setFormData(prev => ({ ...prev, hora_fin: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lugar
              </label>
              <input
                type="text"
                value={formData.lugar}
                onChange={e => setFormData(prev => ({ ...prev, lugar: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={e => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="es_recurrente"
                checked={formData.es_recurrente}
                onChange={e => setFormData(prev => ({ ...prev, es_recurrente: e.target.checked }))}
                className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-400"
              />
              <label htmlFor="es_recurrente" className="text-sm text-gray-700">
                Entrenamiento recurrente
              </label>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear entrenamiento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrainingForm; 