import React from 'react';

const socialLinks = [
  { name: 'Instagram', url: '#', icon: '📸' },
  { name: 'Twitter', url: '#', icon: '🐦' },
  { name: 'LinkedIn', url: '#', icon: '💼' },
];

const LandingFooter: React.FC = () => (
  <footer className="relative w-full bg-gradient-to-br from-emerald-700 via-green-800 to-teal-800 text-white py-16 px-4 mt-12 overflow-hidden">
    {/* Efectos de fondo */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
    </div>
    <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="flex flex-col items-center md:items-start">
        <span className="font-black text-2xl bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent drop-shadow-lg">Futbol Clinic</span>
        <span className="text-sm text-emerald-100 mt-1">&copy; {new Date().getFullYear()} Todos los derechos reservados</span>
      </div>
      <nav className="flex gap-6 mt-4 md:mt-0" aria-label="Redes sociales">
        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            aria-label={link.name}
            tabIndex={0}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-lg font-semibold shadow transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <span className="text-xl">{link.icon}</span>
            <span>{link.name}</span>
          </a>
        ))}
      </nav>
      <a
        href="mailto:info@futbolclinic.com"
        className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
        tabIndex={0}
        aria-label="Contacto"
      >
        <span>📧</span> info@futbolclinic.com
      </a>
    </div>
  </footer>
);

export default LandingFooter; 