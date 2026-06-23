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

// Componente para rotas protegidas gerais (verifica apenas se está logado)
interface ProtectedProps {
  children: React.ReactElement;
  allowedRoles?: ('attendant' | 'cashier' | 'admin')[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedProps) {
  const user = authService.getCurrentUser();

  if (!user) {
    // Redireciona para o login se não estiver autenticado
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Se logado mas sem permissão específica, manda para a rota principal respectiva do seu perfil
    if (user.role === 'attendant') {
      return <Navigate to="/venda" replace />;
    } else if (user.role === 'cashier') {
      return <Navigate to="/caixa" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

export default function AppRoutes() {
  const user = authService.getCurrentUser();

  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Venda Rápida (Atendente ou Admin) */}
        <Route
          path="/venda"
          element={
            <ProtectedRoute allowedRoles={['attendant', 'admin']}>
              <QuickSalePage />
            </ProtectedRoute>
          }
        />

        {/* Fila do Caixa (Caixa ou Admin) */}
        <Route
          path="/caixa"
          element={
            <ProtectedRoute allowedRoles={['cashier', 'admin']}>
              <CashierQueuePage />
            </ProtectedRoute>
          }
        />

        {/* Dashboard do Dia (Admin ou Caixa ou Atendente - apenas leitura em Atendente) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Ajustes / Configurações (Apenas Admin) */}
        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Fechar Caixa (Caixa ou Admin) */}
        <Route
          path="/fechar-caixa"
          element={
            <ProtectedRoute allowedRoles={['cashier', 'admin']}>
              <CloseCashierPage />
            </ProtectedRoute>
          }
        />

        {/* Histórico completo de vendas */}
        <Route
          path="/historico"
          element={
            <ProtectedRoute>
              <SalesHistoryPage />
            </ProtectedRoute>
          }
        />

        {/* Rota Raiz - Direcionamento Inteligente */}
        <Route
          path="/"
          element={
            user ? (
              user.role === 'attendant' ? (
                <Navigate to="/venda" replace />
              ) : user.role === 'cashier' ? (
                <Navigate to="/caixa" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
