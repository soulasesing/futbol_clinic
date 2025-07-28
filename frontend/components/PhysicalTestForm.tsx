import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PhysicalTest {
  id?: string;
  player_id: string;
  fecha_prueba: string;
  altura?: number;
  peso?: number;
  imc?: number;
  velocidad_40m?: number;
  agilidad_illinois?: number;
  salto_vertical?: number;
  yo_yo_test?: number;
  cooper_test?: number;
  flexiones?: number;
  abdominales?: number;
  precision_tiro?: number;
  control_balon?: number;
  pase_precision?: number;
  observaciones?: string;
  evaluador: string;
}

interface PhysicalTestFormProps {
  playerId: string;
  playerName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const PhysicalTestForm: React.FC<PhysicalTestFormProps> = ({
  playerId,
  playerName,
  onClose,
  onSuccess
}) => {
  const { jwt } = useAuth() as any;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Calcular IMC si hay altura y peso
    const altura = formData.get('altura') ? Number(formData.get('altura')) : undefined;
    const peso = formData.get('peso') ? Number(formData.get('peso')) : undefined;
    let imc = undefined;
    if (altura && peso) {
      imc = Number(((peso / ((altura / 100) * (altura / 100)))).toFixed(2));
    }

    const testData: PhysicalTest = {
      player_id: playerId,
      fecha_prueba: formData.get('fecha_prueba') as string,
      altura,
      peso,
      imc,
      velocidad_40m: formData.get('velocidad_40m') ? Number(formData.get('velocidad_40m')) : undefined,
      agilidad_illinois: formData.get('agilidad_illinois') ? Number(formData.get('agilidad_illinois')) : undefined,
      salto_vertical: formData.get('salto_vertical') ? Number(formData.get('salto_vertical')) : undefined,
      yo_yo_test: formData.get('yo_yo_test') ? Number(formData.get('yo_yo_test')) : undefined,
      cooper_test: formData.get('cooper_test') ? Number(formData.get('cooper_test')) : undefined,
      flexiones: formData.get('flexiones') ? Number(formData.get('flexiones')) : undefined,
      abdominales: formData.get('abdominales') ? Number(formData.get('abdominales')) : undefined,
      precision_tiro: formData.get('precision_tiro') ? Number(formData.get('precision_tiro')) : undefined,
      control_balon: formData.get('control_balon') ? Number(formData.get('control_balon')) : undefined,
      pase_precision: formData.get('pase_precision') ? Number(formData.get('pase_precision')) : undefined,
      observaciones: formData.get('observaciones') as string,
      evaluador: formData.get('evaluador') as string,
    };

    try {
      const response = await fetch('/api/physical-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(testData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la prueba física');
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-emerald-700">
              Nueva Prueba Física - {playerName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-500 text-2xl font-bold"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de prueba
                </label>
                <input
                  type="date"
                  name="fecha_prueba"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evaluador
                </label>
                <input
                  type="text"
                  name="evaluador"
                  required
                  placeholder="Nombre del evaluador"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            {/* Medidas corporales */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-emerald-700 mb-3">Medidas Corporales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    name="altura"
                    step="0.1"
                    placeholder="175.5"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    name="peso"
                    step="0.1"
                    placeholder="70.5"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Velocidad y agilidad */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-emerald-700 mb-3">Velocidad y Agilidad</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Velocidad 40m (seg)
                  </label>
                  <input
                    type="number"
                    name="velocidad_40m"
                    step="0.01"
                    placeholder="5.20"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Illinois (seg)
                  </label>
                  <input
                    type="number"
                    name="agilidad_illinois"
                    step="0.01"
                    placeholder="15.20"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salto vertical (cm)
                  </label>
                  <input
                    type="number"
                    name="salto_vertical"
                    placeholder="45"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Resistencia */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-emerald-700 mb-3">Resistencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yo-Yo Test (metros)
                  </label>
                  <input
                    type="number"
                    name="yo_yo_test"
                    placeholder="2000"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Cooper (metros)
                  </label>
                  <input
                    type="number"
                    name="cooper_test"
                    placeholder="2800"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Fuerza */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-emerald-700 mb-3">Fuerza</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Flexiones (repeticiones)
                  </label>
                  <input
                    type="number"
                    name="flexiones"
                    placeholder="20"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Abdominales (1 min)
                  </label>
                  <input
                    type="number"
                    name="abdominales"
                    placeholder="30"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Técnica */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-emerald-700 mb-3">Técnica (0-10)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precisión de tiro
                  </label>
                  <input
                    type="number"
                    name="precision_tiro"
                    min="0"
                    max="10"
                    placeholder="8"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Control de balón
                  </label>
                  <input
                    type="number"
                    name="control_balon"
                    min="0"
                    max="10"
                    placeholder="7"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precisión de pase
                  </label>
                  <input
                    type="number"
                    name="pase_precision"
                    min="0"
                    max="10"
                    placeholder="8"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-emerald-700 mb-3">Observaciones</h3>
              <textarea
                name="observaciones"
                rows={3}
                placeholder="Observaciones adicionales sobre el rendimiento del jugador..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div className="flex justify-end gap-3">
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
                {loading ? 'Guardando...' : 'Guardar Prueba Física'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PhysicalTestForm; 