import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import ParentPortal from '../components/dashboards/ParentPortal';

const ParentDashboard: React.FC = () => {
  return <ProtectedRoute roles={['parent']}><ParentPortal /></ProtectedRoute>;
};

export default ParentDashboard; 