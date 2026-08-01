import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Home,
  LogOut,
  Megaphone,
  Receipt,
  Settings,
  ShieldCheck,
  Trophy,
  UserRound,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navigation: Record<UserRole, NavItem[]> = {
  super_admin: [
    { href: '/dashboard', label: 'Resumen', icon: ShieldCheck },
    { href: '/tenants', label: 'Escuelas', icon: Users },
  ],
  admin: [
    { href: '/dashboard', label: 'Resumen', icon: Home },
    { href: '/familias', label: 'Familias', icon: Users },
    { href: '/players', label: 'Jugadores', icon: UserRound },
    { href: '/teams', label: 'Equipos', icon: Users },
    { href: '/coaches', label: 'Entrenadores', icon: UserRound },
    { href: '/entrenamientos', label: 'Agenda', icon: CalendarDays },
    { href: '/finanzas', label: 'Finanzas', icon: WalletCards },
    { href: '/partidos', label: 'Partidos', icon: Trophy },
    { href: '/landing', label: 'Portada pública', icon: Megaphone },
    { href: '/auditoria', label: 'Auditoría', icon: ShieldCheck },
    { href: '/configuracion', label: 'Configuración', icon: Settings },
  ],
  coach: [
    { href: '/dashboard', label: 'Inicio', icon: Home },
    { href: '/entrenamientos', label: 'Agenda', icon: CalendarDays },
    { href: '/entrenamientos?view=attendance', label: 'Asistencia', icon: ClipboardCheck },
    { href: '/partidos?view=convocations', label: 'Convocatorias', icon: Trophy },
    { href: '/players', label: 'Jugadores', icon: Users },
  ],
  parent: [
    { href: '/dashboard', label: 'Familia', icon: Home },
    { href: '/parent-dashboard#agenda', label: 'Agenda', icon: CalendarDays },
    { href: '/parent-dashboard#pagos', label: 'Pagos', icon: CreditCard },
    { href: '/parent-dashboard#recibos', label: 'Recibos', icon: Receipt },
    { href: '/parent-dashboard#anuncios', label: 'Avisos', icon: Megaphone },
  ],
};

const AppShell: React.FC<AppShellProps> = ({ children, title, subtitle, actions }) => {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const router = useRouter();
  const links = user ? navigation[user.role] : [];

  const isActive = (href: string): boolean => {
    const pathname = href.split(/[?#]/)[0];
    return pathname === '/dashboard'
      ? router.pathname === '/dashboard'
      : router.pathname.startsWith(pathname);
  };

  const handleLogout = (): void => {
    let destination = localStorage.getItem('loginPath') || '/';
    if (user?.role === 'super_admin') {
      destination = '/super-admin/login';
    } else if (branding?.slug) {
      destination = `/escuela/${branding.slug}`;
    }
    void router.replace(destination).finally(logout);
  };

  return (
    <div className="brand-page-bg min-h-screen text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-brand-100 bg-white/95 px-5 py-6 shadow-xl backdrop-blur lg:flex">
        <div className="absolute inset-x-0 top-0 h-1.5 brand-gradient" />
        <Link href="/dashboard" className="brand-focus flex items-center gap-3 rounded-2xl p-2">
          {branding?.logo_url ? (
            <img src={branding.logo_url} alt="" className="h-14 w-12 object-contain" />
          ) : (
            <span className="brand-gradient flex h-11 w-11 items-center justify-center rounded-2xl text-xl font-black">FC</span>
          )}
          <span>
            <span className="block text-sm font-black text-slate-900">{branding?.nombre || 'Futbol Clinic'}</span>
            <span className="block text-xs capitalize text-slate-500">{user?.role.replace('_', ' ')}</span>
          </span>
        </Link>

        <nav className="mt-8 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Navegación principal">
          {links.map(({ href, label, icon: Icon }, index) => (
            <Link
              key={`${href}-${index}`}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive(href) ? 'brand-gradient shadow-lg shadow-brand-200' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800'
              }`}
              aria-current={isActive(href) ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="truncate text-sm font-semibold">{user?.name || user?.email}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
          <button type="button" onClick={handleLogout} className="mt-3 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 px-4 py-4 backdrop-blur md:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-widest text-brand-700 lg:hidden">{branding?.nombre || 'Futbol Clinic'}</p>
              {title && <h1 className="truncate text-xl font-black text-slate-900 md:text-2xl">{title}</h1>}
              {subtitle && <p className="mt-1 hidden text-sm text-slate-500 sm:block">{subtitle}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <button type="button" onClick={handleLogout} className="rounded-xl p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 lg:hidden" aria-label="Cerrar sesión">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 pb-28 md:px-8 md:py-8 lg:pb-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex overflow-x-auto border-t border-slate-200 bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-2 shadow-2xl backdrop-blur lg:hidden" aria-label="Navegación móvil">
        {links.map(({ href, label, icon: Icon }, index) => (
          <Link key={`${href}-${index}`} href={href} className={`flex min-w-[4.75rem] flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold ${isActive(href) ? 'text-brand-700' : 'text-slate-500'}`} aria-current={isActive(href) ? 'page' : undefined}>
            <Icon className={`h-5 w-5 ${isActive(href) ? 'fill-brand-100' : ''}`} aria-hidden="true" />
            <span className="max-w-full truncate">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default AppShell;
