import { Lock, LogIn, User, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';


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
        <p className="text-red-500 text-sm text-center mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            id="login-username"
            name="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
            className="w-full pl-12 pr-4 py-3 bg-[#e6e6e6] border-none rounded-2xl focus:outline-none shadow-[inset_1px_1px_3px_#c9c9c9,inset_-1px_-1px_3px_#ffffff] focus:shadow-[inset_2px_2px_4px_#c9c9c9,inset_-2px_-2px_4px_#ffffff] text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            className="w-full pl-12 pr-4 py-3 bg-[#e6e6e6] border-none rounded-2xl focus:outline-none shadow-[inset_1px_1px_3px_#c9c9c9,inset_-1px_-1px_3px_#ffffff] focus:shadow-[inset_2px_2px_4px_#c9c9c9,inset_-2px_-2px_4px_#ffffff] text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-[#e6e6e6] text-gray-800 font-bold rounded-2xl shadow-[2px_2px_4px_#c9c9c9,-2px_-2px_4px_#ffffff] hover:shadow-[inset_3px_3px_6px_#c9c9c9,inset_-3px_-3px_6px_#ffffff] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing In...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Sign In
            </>
          )}
        </button>
      </form>

      <div className="flex items-center my-4">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="px-3 text-sm text-gray-500">or</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>


      <button
        onClick={() => setCurrForm(1)}
        className="w-full py-3 bg-[#e6e6e6] text-gray-800 font-bold rounded-2xl shadow-[2px_2px_4px_#c9c9c9,-2px_-2px_4px_#ffffff] hover:shadow-[inset_3px_3px_6px_#c9c9c9,inset_-3px_-3px_6px_#ffffff] transition-all flex items-center justify-center gap-2"
      >
        <User className="w-4 h-4" />
        Continue as Guest
      </button>

      <p className="text-center text-gray-700 mt-6">
        Don't have an account?{' '}
        <button onClick={() => setCurrForm(2)}>
          Register
        </button>
      </p>
    </>
  );
}

export default LoginForm;
