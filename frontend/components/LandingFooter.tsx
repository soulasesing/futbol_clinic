import React from 'react';

const LandingFooter: React.FC = () => (
  <footer className="w-full bg-green-800 text-white py-8 px-4 mt-12">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-col items-center md:items-start">
        <span className="font-bold text-lg">Futbol Clinic</span>
        <span className="text-sm text-green-100">&copy; {new Date().getFullYear()} Todos los derechos reservados</span>
      </div>
      <nav className="flex gap-6 mt-4 md:mt-0" aria-label="Redes sociales">
        <a href="#" aria-label="Instagram" tabIndex={0} className="hover:text-green-300 focus:outline-none focus:underline">Instagram</a>
        <a href="#" aria-label="Twitter" tabIndex={0} className="hover:text-green-300 focus:outline-none focus:underline">Twitter</a>
        <a href="#" aria-label="LinkedIn" tabIndex={0} className="hover:text-green-300 focus:outline-none focus:underline">LinkedIn</a>
      </nav>
      <a href="mailto:info@futbolclinic.com" className="text-green-200 hover:text-green-100 focus:underline" tabIndex={0} aria-label="Contacto">info@futbolclinic.com</a>
    </div>
  </footer>
);

export default LandingFooter; 