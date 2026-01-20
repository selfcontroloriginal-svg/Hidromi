import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: 'admin' | 'vendor';
}

function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, profile } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (profile?.role !== role) {
    return <Navigate to={profile?.role === 'admin' ? '/admin' : '/vendor'} />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;