import React from 'react';

const LandingHero: React.FC = () => (
  <section className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-b from-green-700 to-green-400 text-white px-4 py-16">
    <div className="flex flex-col items-center gap-4 max-w-2xl text-center">
      <div className="mb-2">
        <span className="inline-block bg-white rounded-full p-2 shadow-lg">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Futbol Clinic logo">
            <circle cx="28" cy="28" r="28" fill="#22c55e" />
            <path d="M28 16a12 12 0 100 24 12 12 0 000-24zm0 2a10 10 0 110 20 10 10 0 010-20zm0 3a7 7 0 100 14 7 7 0 000-14z" fill="#fff" />
          </svg>
        </span>
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow-lg">Futbol Clinic</h1>
      <p className="text-lg md:text-xl font-medium text-white/90 max-w-xl">
        Plataforma profesional multi-tenant para la gestión integral de escuelas de fútbol.<br />
        Administra jugadores, equipos, entrenadores, partidos y mucho más.
      </p>
      <a
        href="/login"
        className="mt-6 px-8 py-3 rounded-full bg-gradient-to-r from-white to-green-100 text-green-700 font-bold text-lg shadow-lg hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-700 transition"
        tabIndex={0}
        aria-label="Iniciar sesión escuelas"
      >
        Iniciar sesión escuelas
      </a>
      <a
        href="#contacto"
        className="mt-3 px-8 py-3 rounded-full bg-white text-green-700 font-bold text-lg shadow-lg hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-700 transition"
        tabIndex={0}
        aria-label="Solicita una demo"
      >
        Solicita una demo
      </a>
    </div>
  </section>
);

export default LandingHero; 