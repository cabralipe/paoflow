import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import LoginPage from '../pages/LoginPage';
import QuickSalePage from '../pages/QuickSalePage';
import CashierQueuePage from '../pages/CashierQueuePage';
import DashboardPage from '../pages/DashboardPage';
import SettingsPage from '../pages/SettingsPage';
import CloseCashierPage from '../pages/CloseCashierPage';
import SalesHistoryPage from '../pages/SalesHistoryPage';
import { UserRole } from '../types';

interface ProtectedProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

function defaultRouteForRole(role: UserRole) {
  if (role === 'attendant') return '/venda';
  if (role === 'cashier') return '/caixa';
  if (role === 'superadmin') return '/configuracoes';
  return '/dashboard';
}

function ProtectedRoute({ children, allowedRoles }: ProtectedProps) {
  const user = authService.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={defaultRouteForRole(user.role)} replace />;
  }

  return children;
}

export default function AppRoutes() {
  const user = authService.getCurrentUser();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/venda"
          element={
            <ProtectedRoute allowedRoles={['attendant', 'admin']}>
              <QuickSalePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/caixa"
          element={
            <ProtectedRoute allowedRoles={['cashier', 'admin']}>
              <CashierQueuePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['attendant', 'cashier', 'admin']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/fechar-caixa"
          element={
            <ProtectedRoute allowedRoles={['cashier', 'admin']}>
              <CloseCashierPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/historico"
          element={
            <ProtectedRoute allowedRoles={['attendant', 'cashier', 'admin']}>
              <SalesHistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={user ? <Navigate to={defaultRouteForRole(user.role)} replace /> : <Navigate to="/login" replace />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
