import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import PageLoader from './components/common/PageLoader';
import NotFound from './components/common/NotFound';

const Login = lazy(() => import('./components/auth/Login'));
const Chat = lazy(() => import('./components/Chat'));
const TermsAndConditions = lazy(() => import('./components/auth/TermsAndConditions'));
const CookiePolicy = lazy(() => import('./components/auth/CookiePolicy'));
const LandingPage = lazy(() => import('./components/landing/LandingPage'));

function useIdlePrefetch() {
  useEffect(() => {
    const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const id = schedule(() => {
      import('./components/auth/Login');
      schedule(() => import('./components/Chat'));
    });
    return () => cancel(id);
  }, []);
}

function AnimatedRoutes() {
  const location = useLocation();
  const isChatRoute = location.pathname === '/chat';

  return (
    <div key={isChatRoute ? 'chat' : location.pathname} className="route-fade-in h-full w-full">
      <Routes location={location}>
        <Route path="/login" element={<Login />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  useIdlePrefetch();
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
          <Suspense fallback={<PageLoader />}>
            <AnimatedRoutes />
          </Suspense>
        </HashRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;