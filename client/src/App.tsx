import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AssessmentPage from './pages/AssessmentPage';
import SelfSelectLevelPage from './pages/SelfSelectLevelPage';
import AssessmentResultPage from './pages/AssessmentResultPage';
import DashboardPage from './pages/DashboardPage';
import LessonPage from './pages/LessonPage';
import GroupSessionPage from './pages/GroupSessionPage';
import AdminPanel from './pages/AdminPanel';
import ProfilePage from './pages/ProfilePage';

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Semi-public routes (accessible after registration) */}
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/self-select-level" element={<SelfSelectLevelPage />} />
        <Route path="/assessment-result" element={<AssessmentResultPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/lessons/:id" element={<LessonPage />} />
          <Route path="/group-session" element={<GroupSessionPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
