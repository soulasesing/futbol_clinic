import React from 'react';

const benefits = [
  {
    title: 'Para Escuelas',
    description: 'Centraliza la gestión, mejora la comunicación y profesionaliza tu academia.',
    color: 'bg-green-100',
  },
  {
    title: 'Para Entrenadores',
    description: 'Acceso fácil a datos de jugadores, entrenamientos y estadísticas.',
    color: 'bg-green-50',
  },
  {
    title: 'Para Padres',
    description: 'Visualiza el progreso, asistencia y partidos de tus hijos en tiempo real.',
    color: 'bg-white',
  },
];

const LandingBenefits: React.FC = () => (
  <section className="w-full py-16 px-4 bg-gradient-to-b from-white to-green-50">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-green-700 mb-10">Beneficios para todos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {benefits.map((b, i) => (
          <div key={i} className={`rounded-xl p-8 shadow flex flex-col items-center ${b.color}`}>
            <h3 className="text-xl font-semibold mb-2 text-green-700">{b.title}</h3>
            <p className="text-gray-700 text-center">{b.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default LandingBenefits; 