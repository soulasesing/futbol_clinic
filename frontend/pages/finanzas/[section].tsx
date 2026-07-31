import React from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import FinanceWorkspace, { FinanceSection } from '../../components/FinanceWorkspace';
import { ErrorState, LoadingState } from '../../components/AsyncStates';

const validSections: FinanceSection[] = ['cuentas', 'conceptos', 'cargos', 'comprobantes', 'recibos', 'cartera'];

const FinanceSectionPage: React.FC = () => {
  const router = useRouter();
  if (!router.isReady) return <LoadingState title="Abriendo finanzas" />;

  const section = typeof router.query.section === 'string' ? router.query.section : '';
  if (!validSections.includes(section as FinanceSection)) {
    return <main className="min-h-screen bg-slate-50 p-6 pt-24"><div className="mx-auto max-w-lg"><ErrorState title="Sección no encontrada" message="La sección financiera solicitada no existe." actionLabel="Ir a finanzas" onAction={() => void router.replace('/finanzas')} /></div></main>;
  }

  return <ProtectedRoute roles={['admin']}><FinanceWorkspace section={section as FinanceSection} /></ProtectedRoute>;
};

export default FinanceSectionPage;
