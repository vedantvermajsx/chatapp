import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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

function AnimatedRoutes() {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const isChatRoute = location.pathname === '/chat';

  const variants = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } // Tier 2: fade only, no displacement
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={isChatRoute ? 'chat' : location.pathname}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{ duration: prefersReducedMotion ? 0.12 : 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="h-full w-full"
      >
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
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
          <Suspense fallback={<PageLoader />}>
            <AnimatedRoutes />
          </Suspense>
        </HashRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;