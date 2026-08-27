import { Lock, LogIn, User, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const F = "'Plus Jakarta Sans', sans-serif";

const inputClass =
  'w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#008080] focus:ring-4 focus:ring-[#008080]/8 transition-all outline-none disabled:opacity-50';

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
        <p
          className="text-red-600 text-[13.5px] text-center mb-4 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5"
          style={{ fontFamily: F }}
        >
          {error}
        </p>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
          <input
            id="login-username"
            name="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
            style={{ fontFamily: F }}
            className={inputClass}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            style={{ fontFamily: F }}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-1 py-2.5 rounded-xl text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-55 disabled:cursor-not-allowed active:scale-[0.985]"
          style={{ fontFamily: F, background: '#008080' }}
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
          ) : (
            <><LogIn className="w-4 h-4" /> Sign in</>
          )}
        </button>
      </form>

      <div className="flex items-center my-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="px-3 text-[11px] text-gray-400 uppercase tracking-widest" style={{ fontFamily: F }}>or</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <button
        onClick={() => setCurrForm(1)}
        className="w-full py-2.5 bg-white text-gray-600 text-[14px] font-medium rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-[0.985]"
        style={{ fontFamily: F }}
      >
        <User className="w-[15px] h-[15px] text-gray-400" />
        Continue as guest
      </button>
    </>
  );
}

export default LoginForm;
