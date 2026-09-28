import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Component, lazy, Suspense, useEffect } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import PageLoader from './components/common/PageLoader';
import NotFound from './components/common/NotFound';

const Login = lazy(() => import('./components/auth/Login'));
const Chat = lazy(() => import('./components/Chat'));
const TermsAndConditions = lazy(() => import('./components/auth/TermsAndConditions'));
const CookiePolicy = lazy(() => import('./components/auth/CookiePolicy'));
const LandingPage = lazy(() => import('./components/landing/LandingPage'));

function IdlePrefetch() {
  const { user } = useAuth();

  useEffect(() => {
    const conn = navigator.connection;
    if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))) return;

    const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const id = schedule(() => {
      const target = user ? import('./components/Chat') : import('./components/auth/Login');
      target.catch(() => { });
    });
    return () => cancel(id);
  }, [user]);

  return null;
}
class ChunkErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-[#0b0c0e] text-white/70 px-6 text-center">
        <p className="text-sm">Something went wrong while loading the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium"
        >
          Reload
        </button>
      </div>
    );
  }
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
          <IdlePrefetch />
          <ChunkErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <AnimatedRoutes />
            </Suspense>
          </ChunkErrorBoundary>
        </HashRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;