import { Lock, LogIn, User, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const inputClass =
  'w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14.5px] text-gray-900 placeholder:text-gray-400 focus:border-[#008080] focus:ring-4 focus:ring-[#008080]/10 transition-colors disabled:opacity-50 disabled:bg-gray-50';

function LoginForm({ setCurrForm }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        navigate('/chat');
      } else {
        setError(result.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {error && (
        <p className="text-red-600 text-sm text-center mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="login-username"
            name="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
            className={inputClass}
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 mt-1 bg-[#008080] hover:bg-[#046d6d] text-white text-[14.5px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Sign in
            </>
          )}
        </button>
      </form>

      <div className="flex items-center my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="px-3 text-xs text-gray-400 uppercase tracking-wide">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <button
        onClick={() => setCurrForm(1)}
        className="w-full py-2.5 bg-white text-gray-700 text-[14.5px] font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
      >
        <User className="w-4 h-4" />
        Continue as guest
      </button>
    </>
  );
}

export default LoginForm;
