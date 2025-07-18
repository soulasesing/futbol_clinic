import React, { useState, useEffect } from 'react';

const features = [
  {
    title: 'Gestión Multi-tenant',
    description: 'Cada escuela opera de forma independiente y segura en la misma plataforma.',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-50 to-teal-50'
  },
  {
    title: 'Control de Jugadores y Equipos',
    description: 'Registra, edita y visualiza jugadores, equipos, entrenadores y partidos.',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    gradient: 'from-green-500 to-emerald-600',
    bgGradient: 'from-green-50 to-emerald-50'
  },
  {
    title: 'Estadísticas y Asistencia',
    description: 'Visualiza rendimiento, asistencia y estadísticas de cada jugador y equipo.',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    gradient: 'from-teal-500 to-cyan-600',
    bgGradient: 'from-teal-50 to-cyan-50'
  },
  {
    title: 'Personalización de Branding',
    description: 'Cada escuela puede subir su logo, banner y definir sus colores.',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21h10a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-cyan-500 to-blue-600',
    bgGradient: 'from-cyan-50 to-blue-50'
  },
];

const LandingFeatures: React.FC = () => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      features.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems(prev => [...prev, index]);
        }, index * 200);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50 py-20 px-4 overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Título principal */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 bg-clip-text text-transparent mb-4">
            Funcionalidades principales
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full"></div>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre las herramientas que transformarán la gestión de tu escuela de fútbol
          </p>
        </div>

        {/* Grid de características */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${feature.bgGradient} p-8 shadow-xl shadow-black/5 backdrop-blur-sm border border-white/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 hover:scale-[1.02] ${
                visibleItems.includes(index) 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{
                transitionDelay: `${index * 100}ms`
              }}
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Contenido */}
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Icono con efectos */}
                <div className={`mb-6 p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>

                {/* Título */}
                <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-emerald-700 transition-colors duration-300">
                  {feature.title}
                </h3>

                {/* Descripción */}
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  {feature.description}
                </p>

                {/* Línea decorativa */}
                <div className={`mt-6 w-16 h-1 bg-gradient-to-r ${feature.gradient} rounded-full group-hover:w-24 transition-all duration-300`}></div>
              </div>

              {/* Partículas decorativas */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 w-1 h-1 bg-white rounded-full opacity-40 group-hover:opacity-80 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Indicador de más características */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-emerald-200/50">
            <span className="text-emerald-600 font-medium">Y muchas más funcionalidades</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;