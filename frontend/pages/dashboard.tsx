import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../components/AppShell';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import CoachDashboard from '../components/dashboards/CoachDashboard';
import ParentPortal from '../components/dashboards/ParentPortal';
import { ShieldCheck, Users } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'coach') return <CoachDashboard />;
  if (user?.role === 'parent') return <ParentPortal />;

  return <AppShell title="Administración global" subtitle="Gestiona las escuelas registradas en la plataforma"><div className="grid gap-4 sm:grid-cols-2"><Link href="/tenants" className="rounded-3xl bg-white p-6 shadow-sm"><Users className="h-7 w-7 text-emerald-600" /><h2 className="mt-4 text-lg font-black">Escuelas</h2><p className="text-sm text-slate-500">Consulta y administra los tenants de la plataforma.</p></Link><div className="rounded-3xl bg-slate-900 p-6 text-white"><ShieldCheck className="h-7 w-7 text-emerald-300" /><h2 className="mt-4 text-lg font-black">Acceso global</h2><p className="text-sm text-slate-300">Sesión de superadministrador activa.</p></div></div></AppShell>;
};

const DashboardPage: React.FC = () => <ProtectedRoute><Dashboard /></ProtectedRoute>;

export default DashboardPage;