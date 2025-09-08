import React from 'react';
import { useBranding } from '../contexts/BrandingContext';

const LandingHero: React.FC = () => {
  const { branding } = useBranding();
  
  return (
    <section 
      className="w-full min-h-[60vh] flex flex-col items-center justify-center text-white px-4 py-16"
      style={{
        background: branding 
          ? `linear-gradient(to bottom, ${branding.primary_color}, ${branding.secondary_color})`
          : 'linear-gradient(to bottom, #059669, #22c55e)'
      }}
    >
      <div className="flex flex-col items-center gap-4 max-w-2xl text-center">
        <div className="mb-2">
          {branding?.logo_url ? (
            <img
              src={branding.logo_url}
              alt={`${branding.nombre} logo`}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-2xl"
            />
          ) : (
            <span className="inline-block bg-white rounded-full p-2 shadow-lg">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={`${branding?.nombre || 'Futbol Clinic'} logo`}>
                <circle cx="28" cy="28" r="28" fill={branding?.primary_color || "#22c55e"} />
                <path d="M28 16a12 12 0 100 24 12 12 0 000-24zm0 2a10 10 0 110 20 10 10 0 010-20zm0 3a7 7 0 100 14 7 7 0 000-14z" fill="#fff" />
              </svg>
            </span>
          )}
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow-lg">
          {branding?.nombre || 'Futbol Clinic'}
        </h1>
        {branding?.slogan && (
          <h2 className="text-2xl md:text-3xl font-semibold text-white/95 italic drop-shadow">
            "{branding.slogan}"
          </h2>
        )}
        <p className="text-lg md:text-xl font-medium text-white/90 max-w-xl">
          {branding?.description || (
            <>
              Plataforma profesional multi-tenant para la gestión integral de escuelas de fútbol.<br />
              Administra jugadores, equipos, entrenadores, partidos y mucho más.
            </>
          )}
        </p>
        <a
          href="/login"
          className="mt-6 px-8 py-3 rounded-full bg-white font-bold text-lg shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition-all duration-200"
          style={{ 
            color: branding?.primary_color || '#059669',
            borderColor: branding?.primary_color || '#059669'
          }}
          tabIndex={0}
          aria-label="Iniciar sesión escuelas"
        >
          Iniciar sesión escuelas
        </a>
        <a
          href="#contacto"
          className="mt-3 px-8 py-3 rounded-full bg-white/90 font-bold text-lg shadow-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition-all duration-200"
          style={{ 
            color: branding?.secondary_color || '#0d9488',
            borderColor: branding?.secondary_color || '#0d9488'
          }}
          tabIndex={0}
          aria-label="Solicita una demo"
        >
          Solicita una demo
        </a>
      </div>
    </section>
  );
};

export default LandingHero; 