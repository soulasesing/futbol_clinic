import React from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import FinanceWorkspace from '../../components/FinanceWorkspace';

const FinanceHomePage: React.FC = () => (
  <ProtectedRoute roles={['admin']}>
    <FinanceWorkspace section="resumen" />
  </ProtectedRoute>
);

export default FinanceHomePage;
