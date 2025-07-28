import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PhysicalTestForm from './PhysicalTestForm';

interface Team {
  id: string;
  nombre: string;
  categoria: string;
}

interface Player {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  fecha_nacimiento: string;
  categoria: string;
  foto_url?: string;
  document_url?: string;
  teams?: Team[];
  correo_jugador?: string;
  padre_nombre?: string;
  padre_apellido?: string;
  padre_email?: string;
  padre_telefono?: string;
  madre_nombre?: string;
  madre_apellido?: string;
  madre_email?: string;
  madre_telefono?: string;
  created_at: string;
}

interface PlayerCardProps {
  player: Player;
  onClose: () => void;
  onEdit?: (player: Player) => void;
  onRefresh?: () => void;
}

interface PhysicalTest {
  id: string;
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

interface ExpandedTests {
  [key: string]: boolean;
}

const calcularEdad = (fecha: string) => {
  if (!fecha) return '';
  const nacimiento = new Date(fecha);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClose, onEdit, onRefresh }) => {
  const { jwt } = useAuth() as any;
  const [showPhysicalTestForm, setShowPhysicalTestForm] = useState(false);
  const [physicalTests, setPhysicalTests] = useState<PhysicalTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTests, setExpandedTests] = useState<ExpandedTests>({});

  // Fetch physical tests
  useEffect(() => {
    const fetchPhysicalTests = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/physical-tests/player/${player.id}`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPhysicalTests(data);
        }
      } catch (error) {
        console.error('Error fetching physical tests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhysicalTests();
  }, [player.id, jwt]);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        {/* Header con foto y nombre */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl font-bold z-10"
              aria-label="Cerrar ficha de jugador"
            >
              ×
            </button>
          </div>
          <div className="flex items-center gap-6">
            {player.foto_url ? (
              <img 
                src={player.foto_url} 
                alt={`${player.nombre} ${player.apellido}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-4xl font-bold text-emerald-600 shadow-lg">
                {player.nombre.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{`${player.nombre} ${player.apellido}`}</h2>
                  <p className="text-emerald-100">ID: {player.cedula}</p>
                </div>
                {onEdit && (
                  <button
                    onClick={() => onEdit(player)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span className="text-lg">✏️</span>
                    <span>Editar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-emerald-700">Información Personal</h3>
              <p className="text-gray-600">
                <span className="font-medium">Edad:</span> {calcularEdad(player.fecha_nacimiento)} años
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Fecha de nacimiento:</span>{' '}
                {new Date(player.fecha_nacimiento).toLocaleDateString()}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Fecha de inscripción:</span>{' '}
                {new Date(player.created_at).toLocaleDateString()}
              </p>
              {player.correo_jugador && (
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> {player.correo_jugador}
                </p>
              )}
            </div>

            {/* Equipos */}
            <div className="space-y-2">
              <h3 className="font-semibold text-emerald-700">Equipos</h3>
              {player.teams && player.teams.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {player.teams.map(team => (
                    <span
                      key={team.id}
                      className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {team.nombre}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No asignado a ningún equipo</p>
              )}
            </div>
          </div>

          {/* Información de contacto */}
          <div className="border-t pt-6 grid grid-cols-2 gap-6">
            {/* Información del padre */}
            {(player.padre_nombre || player.padre_apellido || player.padre_email || player.padre_telefono) && (
              <div className="space-y-2">
                <h3 className="font-semibold text-emerald-700">Información del Padre</h3>
                {player.padre_nombre && (
                  <p className="text-gray-600">
                    <span className="font-medium">Nombre:</span>{' '}
                    {`${player.padre_nombre} ${player.padre_apellido || ''}`}
                  </p>
                )}
                {player.padre_email && (
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {player.padre_email}
                  </p>
                )}
                {player.padre_telefono && (
                  <p className="text-gray-600">
                    <span className="font-medium">Teléfono:</span> {player.padre_telefono}
                  </p>
                )}
              </div>
            )}

            {/* Información de la madre */}
            {(player.madre_nombre || player.madre_apellido || player.madre_email || player.madre_telefono) && (
              <div className="space-y-2">
                <h3 className="font-semibold text-emerald-700">Información de la Madre</h3>
                {player.madre_nombre && (
                  <p className="text-gray-600">
                    <span className="font-medium">Nombre:</span>{' '}
                    {`${player.madre_nombre} ${player.madre_apellido || ''}`}
                  </p>
                )}
                {player.madre_email && (
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {player.madre_email}
                  </p>
                )}
                {player.madre_telefono && (
                  <p className="text-gray-600">
                    <span className="font-medium">Teléfono:</span> {player.madre_telefono}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Documentos */}
          {player.document_url && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-emerald-700 mb-3">Documento de Identidad</h3>
              <img
                src={player.document_url}
                alt="Documento de identidad"
                className="max-w-xs rounded-lg shadow-md mx-auto"
              />
            </div>
          )}

          {/* Physical Tests Section */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-emerald-700">Pruebas Físicas</h3>
              <button
                onClick={() => setShowPhysicalTestForm(true)}
                className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium text-sm flex items-center gap-1"
              >
                <span>+ Nueva Prueba</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center text-gray-500">Cargando pruebas físicas...</div>
            ) : physicalTests.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No hay pruebas físicas registradas</div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evaluador</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IMC</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Velocidad 40m</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {physicalTests.map((test) => (
                      <React.Fragment key={test.id}>
                        <tr 
                          className={`hover:bg-gray-50 cursor-pointer ${expandedTests[test.id] ? 'bg-emerald-50' : ''}`}
                          onClick={() => setExpandedTests(prev => ({
                            ...prev,
                            [test.id]: !prev[test.id]
                          }))}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(test.fecha_prueba).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{test.evaluador}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{test.imc || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{test.velocidad_40m ? `${test.velocidad_40m}s` : '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              className="text-emerald-600 hover:text-emerald-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedTests(prev => ({
                                  ...prev,
                                  [test.id]: !prev[test.id]
                                }));
                              }}
                            >
                              {expandedTests[test.id] ? '▼' : '▶'}
                            </button>
                          </td>
                        </tr>
                        {expandedTests[test.id] && (
                          <tr className="bg-emerald-50">
                            <td colSpan={5} className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Medidas corporales */}
                                {(test.altura || test.peso || test.imc) && (
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-emerald-700">Medidas Corporales</h4>
                                    {test.altura && (
                                      <p className="text-sm text-gray-600">Altura: {test.altura} cm</p>
                                    )}
                                    {test.peso && (
                                      <p className="text-sm text-gray-600">Peso: {test.peso} kg</p>
                                    )}
                                    {test.imc && (
                                      <p className="text-sm text-gray-600">IMC: {test.imc}</p>
                                    )}
                                  </div>
                                )}

                                {/* Velocidad y agilidad */}
                                {(test.velocidad_40m || test.agilidad_illinois || test.salto_vertical) && (
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-emerald-700">Velocidad y Agilidad</h4>
                                    {test.velocidad_40m && (
                                      <p className="text-sm text-gray-600">40m: {test.velocidad_40m}s</p>
                                    )}
                                    {test.agilidad_illinois && (
                                      <p className="text-sm text-gray-600">Illinois: {test.agilidad_illinois}s</p>
                                    )}
                                    {test.salto_vertical && (
                                      <p className="text-sm text-gray-600">Salto: {test.salto_vertical}cm</p>
                                    )}
                                  </div>
                                )}

                                {/* Resistencia */}
                                {(test.yo_yo_test || test.cooper_test) && (
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-emerald-700">Resistencia</h4>
                                    {test.yo_yo_test && (
                                      <p className="text-sm text-gray-600">Yo-Yo: {test.yo_yo_test}m</p>
                                    )}
                                    {test.cooper_test && (
                                      <p className="text-sm text-gray-600">Cooper: {test.cooper_test}m</p>
                                    )}
                                  </div>
                                )}

                                {/* Fuerza */}
                                {(test.flexiones || test.abdominales) && (
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-emerald-700">Fuerza</h4>
                                    {test.flexiones && (
                                      <p className="text-sm text-gray-600">Flexiones: {test.flexiones}</p>
                                    )}
                                    {test.abdominales && (
                                      <p className="text-sm text-gray-600">Abdominales: {test.abdominales}</p>
                                    )}
                                  </div>
                                )}

                                {/* Técnica */}
                                {(test.precision_tiro || test.control_balon || test.pase_precision) && (
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-emerald-700">Técnica</h4>
                                    {test.precision_tiro && (
                                      <p className="text-sm text-gray-600">Tiro: {test.precision_tiro}/10</p>
                                    )}
                                    {test.control_balon && (
                                      <p className="text-sm text-gray-600">Control: {test.control_balon}/10</p>
                                    )}
                                    {test.pase_precision && (
                                      <p className="text-sm text-gray-600">Pase: {test.pase_precision}/10</p>
                                    )}
                                  </div>
                                )}
                              </div>

                              {test.observaciones && (
                                <div className="mt-4">
                                  <h4 className="font-medium text-emerald-700">Observaciones</h4>
                                  <p className="text-sm text-gray-600 mt-1">{test.observaciones}</p>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Physical Test Form Modal */}
          {showPhysicalTestForm && (
            <PhysicalTestForm
              playerId={player.id}
              playerName={`${player.nombre} ${player.apellido}`}
              onClose={() => setShowPhysicalTestForm(false)}
              onSuccess={() => {
                setShowPhysicalTestForm(false);
                // Refresh physical tests
                const fetchPhysicalTests = async () => {
                  const response = await fetch(`/api/physical-tests/player/${player.id}`, {
                    headers: { Authorization: `Bearer ${jwt}` }
                  });
                  if (response.ok) {
                    const data = await response.json();
                    setPhysicalTests(data);
                  }
                };
                fetchPhysicalTests();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerCard; 