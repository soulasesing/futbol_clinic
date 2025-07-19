import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from '../components/UserMenu';
import Navbar from '../components/Navbar';

const Dashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white px-4 py-12">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          <div className="flex justify-end">
            <UserMenu />
          </div>
          <section className="bg-white/90 rounded-3xl shadow-xl p-10 border border-emerald-100 flex flex-col items-center text-center">
            <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 bg-clip-text text-transparent mb-4 drop-shadow-lg">
              ¡Bienvenido, {user?.email}!
            </h1>
            <p className="text-lg text-gray-700 mb-4">
              Este es tu panel privado. Aquí podrás gestionar jugadores, equipos, entrenadores, partidos y mucho más.
            </p>
            <div className="mt-8 text-emerald-600 font-semibold animate-pulse">
              (Aquí irá el dashboard real con widgets y datos)
            </div>
            <div className="mt-8 flex flex-col items-center gap-2 text-sm">
              <a href="/" className="text-emerald-700 hover:underline focus:outline-none focus:underline" tabIndex={0}>
                &larr; Volver a la landing
              </a>
              <a href="/forgot" className="text-emerald-700 hover:underline focus:outline-none focus:underline" tabIndex={0}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default Dashboard; 