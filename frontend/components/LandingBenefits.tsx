import React, { useState, useEffect } from 'react';

const benefits = [
  {
    title: 'Para Escuelas',
    description: 'Centraliza la gestión, mejora la comunicación y profesionaliza tu academia.',
    icon: '🏫',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-500/10 to-teal-500/10',
    features: ['Gestión centralizada', 'Comunicación mejorada', 'Imagen profesional']
  },
  {
    title: 'Para Entrenadores',
    description: 'Acceso fácil a datos de jugadores, entrenamientos y estadísticas.',
    icon: '👨‍🏫',
    gradient: 'from-green-500 to-emerald-600',
    bgGradient: 'from-green-500/10 to-emerald-500/10',
    features: ['Datos en tiempo real', 'Planificación eficiente', 'Seguimiento detallado']
  },
  {
    title: 'Para Padres',
    description: 'Visualiza el progreso, asistencia y partidos de tus hijos en tiempo real.',
    icon: '👨‍👩‍👧‍👦',
    gradient: 'from-teal-500 to-cyan-600',
    bgGradient: 'from-teal-500/10 to-cyan-500/10',
    features: ['Progreso visible', 'Comunicación directa', 'Tranquilidad total']
  },
];

const LandingBenefits: React.FC = () => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      benefits.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems(prev => [...prev, index]);
        }, index * 300);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative w-full py-20 px-4 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-gradient-to-br from-emerald-200/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-gradient-to-br from-teal-200/30 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Título principal */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 bg-clip-text text-transparent mb-4">
            Beneficios para todos
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full"></div>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Una plataforma que beneficia a toda la comunidad del fútbol
          </p>
        </div>

        {/* Grid de beneficios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-black/5 border border-white/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 hover:scale-[1.05] ${
                visibleItems.includes(index) 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-12'
              }`}
              style={{
                transitionDelay: `${index * 150}ms`
              }}
              onMouseEnter={() => setHoveredItem(index)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Efecto de fondo gradiente */}
              <div className={`absolute inset-0 bg-gradient-to-br ${benefit.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Contenido */}
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Icono emoji grande */}
                <div className="mb-6 text-6xl transform group-hover:scale-110 transition-transform duration-300">
                  {benefit.icon}
                </div>

                {/* Título */}
                <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-emerald-700 transition-colors duration-300">
                  {benefit.title}
                </h3>

                {/* Descripción */}
                <p className="text-gray-600 leading-relaxed mb-6 group-hover:text-gray-700 transition-colors duration-300">
                  {benefit.description}
                </p>

                {/* Lista de características */}
                <div className="w-full">
                  {benefit.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className={`flex items-center gap-3 mb-2 transition-all duration-300 ${
                        hoveredItem === index 
                          ? 'opacity-100 translate-x-0' 
                          : 'opacity-70 translate-x-2'
                      }`}
                      style={{
                        transitionDelay: `${featureIndex * 100}ms`
                      }}
                    >
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${benefit.gradient} flex-shrink-0`}></div>
                      <span className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Línea decorativa */}
                <div className={`mt-6 w-16 h-1 bg-gradient-to-r ${benefit.gradient} rounded-full group-hover:w-24 transition-all duration-300`}></div>
              </div>

              {/* Elementos decorativos */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-white to-emerald-200 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 w-2 h-2 bg-gradient-to-br from-white to-teal-200 rounded-full opacity-40 group-hover:opacity-80 transition-opacity duration-300"></div>
              
              {/* Esquinas brillantes */}
              <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/30 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105">
            <span className="font-semibold">¿Listo para transformar tu escuela?</span>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingBenefits;