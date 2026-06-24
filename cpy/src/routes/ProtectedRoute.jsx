import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="text-center mt-12">Loading...</div>;
  
  return user ? children : <Navigate to="/login" />;
}
export default ProtectedRoute;