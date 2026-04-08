import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Wraps a route, redirecting to /login if not authenticated.
 * Optionally provide `roles` to restrict to specific roles.
 */
const ProtectedRoute = ({ children, roles }) => {
  const { user, accessToken } = useAuth();

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
