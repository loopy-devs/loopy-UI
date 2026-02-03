import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { ScrollToTop } from './components/ScrollToTop';
import Onboarding from './pages/Onboarding';
import Pitchdeck from './pages/Pitchdeck';
import Dashboard from './pages/Dashboard';
import Shield from './pages/Shield';
import Send from './pages/Send';
import Receive from './pages/Receive';
import Swap from './pages/Swap';
import Profile from './pages/Profile';
import TestSDK from './pages/TestSDK';
import TestMagicBlock from './pages/TestMagicBlock';
import AppShell from './components/layout/AppShell';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isRegistered } = useAuthStore();

  // Trust persisted auth state only - no wallet checks here
  // Wallet connection is only needed for actions (sign, send), not navigation
  if (!isRegistered) {
    return <Navigate to="/" replace />;
  }

  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<Onboarding />} />
      <Route path="/pitchdeck" element={<Pitchdeck />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shield"
        element={
          <ProtectedRoute>
            <Shield />
          </ProtectedRoute>
        }
      />
      <Route
        path="/send"
        element={
          <ProtectedRoute>
            <Send />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receive"
        element={
          <ProtectedRoute>
            <Receive />
          </ProtectedRoute>
        }
      />
      <Route
        path="/swap"
        element={
          <ProtectedRoute>
            <Swap />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/test-sdk"
        element={
          <ProtectedRoute>
            <TestSDK />
          </ProtectedRoute>
        }
      />
      <Route
        path="/test-magicblock"
        element={
          <ProtectedRoute>
            <TestMagicBlock />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
