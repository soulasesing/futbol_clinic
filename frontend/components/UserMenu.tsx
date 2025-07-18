import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-4 bg-white/80 rounded-xl px-4 py-2 shadow border border-emerald-100">
      <div className="flex flex-col items-end">
        <span className="font-semibold text-emerald-700">{user.email}</span>
        <span className="text-xs text-gray-500">Rol: {user.role}</span>
      </div>
      <button
        onClick={logout}
        className="ml-4 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-label="Cerrar sesión"
      >
        Cerrar sesión
      </button>
    </div>
  );
};

export default UserMenu; 