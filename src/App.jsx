import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import ContentProvider from './data/ContentProvider';
import HomePage from './pages/HomePage';
import TopicsPage from './pages/TopicsPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './auth/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './auth/pages/LoginPage';
import RegisterPage from './auth/pages/RegisterPage';
import ForgotPasswordPage from './auth/pages/ForgotPasswordPage';
import PendingApprovalPage from './auth/pages/PendingApprovalPage';
import Placeholder from './auth/pages/Placeholder';
import UsersPage from './pages/admin/Users';

export default function App() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) {
        window.requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, location.hash]);

  return (
    <ContentProvider>
      <div className="site" id="top">
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="content" tabIndex="-1">
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/pending-approval" element={<PendingApprovalPage />} />
            </Route>

            <Route path="/" element={<HomePage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/topics/:id" element={<ModuleDetailPage />} />
            <Route path="/about" element={<AboutPage />} />

            <Route path="/student" element={<ProtectedRoute roles={['student']}><Placeholder title="Student dashboard" /></ProtectedRoute>} />
            <Route path="/student/join" element={<ProtectedRoute roles={['student']}><Placeholder title="Join subject" /></ProtectedRoute>} />
            <Route path="/student/subjects/:id" element={<ProtectedRoute roles={['student']}><Placeholder title="Subject topics" /></ProtectedRoute>} />
            <Route path="/student/topics/:id" element={<ProtectedRoute roles={['student']}><Placeholder title="Topic view" /></ProtectedRoute>} />
            <Route path="/student/subjects/:id/grades" element={<ProtectedRoute roles={['student']}><Placeholder title="My grades" /></ProtectedRoute>} />

            <Route path="/faculty" element={<ProtectedRoute roles={['faculty']}><Placeholder title="Faculty dashboard" /></ProtectedRoute>} />
            <Route path="/faculty/subjects/new" element={<ProtectedRoute roles={['faculty']}><Placeholder title="New subject" /></ProtectedRoute>} />
            <Route path="/faculty/subjects/:id" element={<ProtectedRoute roles={['faculty']}><Placeholder title="Subject overview" /></ProtectedRoute>} />
            <Route path="/faculty/subjects/:id/settings" element={<ProtectedRoute roles={['faculty']}><Placeholder title="Subject settings" /></ProtectedRoute>} />
            <Route path="/faculty/subjects/:id/students" element={<ProtectedRoute roles={['faculty']}><Placeholder title="Roster" /></ProtectedRoute>} />
            <Route path="/faculty/subjects/:id/topics" element={<ProtectedRoute roles={['faculty']}><Placeholder title="Topics" /></ProtectedRoute>} />
            <Route path="/faculty/topics/:id" element={<ProtectedRoute roles={['faculty']}><Placeholder title="Topic editor" /></ProtectedRoute>} />
            <Route path="/faculty/topics/:id/quiz" element={<ProtectedRoute roles={['faculty']}><Placeholder title="Quiz builder" /></ProtectedRoute>} />
            <Route path="/faculty/subjects/:id/grading" element={<ProtectedRoute roles={['faculty']}><Placeholder title="Grading queue" /></ProtectedRoute>} />
            <Route path="/faculty/subjects/:id/report" element={<ProtectedRoute roles={['faculty']}><Placeholder title="Report" /></ProtectedRoute>} />
            <Route path="/faculty/subjects/:id/students/:studentId" element={<ProtectedRoute roles={['faculty']}><Placeholder title="Student scores" /></ProtectedRoute>} />

            <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <SiteFooter />
      </div>
    </ContentProvider>
  );
}
