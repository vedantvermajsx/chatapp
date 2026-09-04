import { HashRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Spinner from './components/common/Spinner';

const Login = lazy(() => import('./components/auth/Login'));
const Chat = lazy(() => import('./components/Chat'));
const TermsAndConditions = lazy(() => import('./components/auth/TermsAndConditions'));
const LandingPage = lazy(() => import('./components/landing/LandingPage'));

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <HashRouter>
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={3000}
          />
          <Suspense fallback={
            <div className="min-h-screen w-screen flex items-center justify-center bg-gray-900">
              <Spinner />
            </div>
          }>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/" element={<LandingPage />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;