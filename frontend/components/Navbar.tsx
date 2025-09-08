import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { useRouter } from 'next/router';
import { ChevronDown, Lock, LogOut } from 'lucide-react';
import PasswordChangeModal from './PasswordChangeModal';

const getInitial = (email?: string) => email ? email.charAt(0).toUpperCase() : '?';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Simulación: si el usuario tuviera foto, sería user.foto_url
  const avatarUrl = (user as any)?.foto_url;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Menú para super admin
  const superAdminLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/tenants', label: 'Escuelas' },
    { href: '/invitations', label: 'Invitaciones' },
    // Puedes agregar más links globales aquí
  ];

  // Menú normal
  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/players', label: 'Jugadores' },
    { href: '/teams', label: 'Equipos' },
    { href: '/coaches', label: 'Entrenadores' },
    { href: '/entrenamientos', label: 'Entrenamientos' },
    { href: '/partidos', label: 'Partidos' },
    { href: '/configuracion', label: 'Configurar escuela', onlyAdmin: true },
  ];

  const linksToShow = user?.role === 'super_admin'
    ? superAdminLinks
    : navLinks.filter(link => !link.onlyAdmin || user?.role === 'admin');

  return (
    <nav 
      className="w-full shadow-lg px-4 py-2 flex items-center justify-between sticky top-0 z-50"
      style={{
        background: branding 
          ? `linear-gradient(to right, ${branding.primary_color}, ${branding.secondary_color})`
          : 'linear-gradient(to right, #059669, #0d9488)'
      }}
    >
      {/* Logo/Branding */}
      <Link href="/dashboard" className="flex items-center gap-2">
        {branding?.logo_url ? (
          <img
            src={branding.logo_url}
            alt={`${branding.nombre} logo`}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-lg"
          />
        ) : (
          <span className="inline-block bg-white rounded-full p-1 shadow">
            <svg width="36" height="36" viewBox="0 0 56 56" fill="none" aria-label={`${branding?.nombre || 'Futbol Clinic'} logo`}>
              <circle cx="28" cy="28" r="28" fill={branding?.primary_color || "#22c55e"} />
              <path d="M28 16a12 12 0 100 24 12 12 0 000-24zm0 2a10 10 0 110 20 10 10 0 010-20zm0 3a7 7 0 100 14 7 7 0 000-14z" fill="#fff" />
            </svg>
          </span>
        )}
        <span className="ml-2 text-xl font-black text-white tracking-wide drop-shadow">
          {branding?.nombre || 'Futbol Clinic'}
        </span>
      </Link>

      {/* Links */}
      <div className="hidden md:flex gap-6 ml-8">
        {linksToShow.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="text-white/90 font-semibold hover:text-white transition-colors px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Usuario y dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-3 hover:bg-white/10 rounded-lg px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          {/* Avatar */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
            />
          ) : (
            <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-xl shadow">
              {getInitial(user?.email)}
            </span>
          )}
          <div className="flex flex-col items-start text-left">
            <span className="text-white font-semibold text-sm">{user?.email}</span>
            <span className="text-emerald-100 text-xs">{user?.role}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-white transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-sm">
                    {getInitial(user?.email)}
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setShowPasswordModal(true);
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Lock className="w-4 h-4 text-emerald-600" />
                Cambiar contraseña
              </button>
              
              <div className="border-t border-gray-100 my-1"></div>
              
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  router.push('/');
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Menú móvil */}
      {/* (Para MVP, solo links en desktop. Se puede agregar menú hamburguesa luego) */}
    </nav>
  );
};

export default Navbar; 