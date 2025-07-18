import React from 'react';

const features = [
  {
    title: 'Gestión Multi-tenant',
    description: 'Cada escuela opera de forma independiente y segura en la misma plataforma.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" /></svg>
    ),
  },
  {
    title: 'Control de Jugadores y Equipos',
    description: 'Registra, edita y visualiza jugadores, equipos, entrenadores y partidos.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} /><path d="M8 12h8" stroke="currentColor" strokeWidth={2} /></svg>
    ),
  },
  {
    title: 'Estadísticas y Asistencia',
    description: 'Visualiza rendimiento, asistencia y estadísticas de cada jugador y equipo.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><rect x="4" y="8" width="4" height="12" rx="1" /><rect x="10" y="4" width="4" height="16" rx="1" /><rect x="16" y="12" width="4" height="8" rx="1" /></svg>
    ),
  },
  {
    title: 'Personalización de Branding',
    description: 'Cada escuela puede subir su logo, banner y definir sus colores.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth={2} /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={2} /></svg>
    ),
  },
];

const LandingFeatures: React.FC = () => (
  <section className="w-full bg-white py-16 px-4">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-green-700 mb-10">Funcionalidades principales</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((f, i) => (
          <div key={i} className="flex flex-col items-center bg-gray-50 rounded-xl p-8 shadow hover:shadow-lg transition">
            <div className="mb-4 text-green-600" aria-hidden="true">{f.icon}</div>
            <h3 className="text-xl font-semibold mb-2 text-center">{f.title}</h3>
            <p className="text-gray-700 text-center">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default LandingFeatures; 