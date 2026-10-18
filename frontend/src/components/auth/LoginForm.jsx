import { Lock, LogIn, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

function LoginForm({ setCurrForm }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-[13px] py-3 px-3.5 mb-5 rounded-xl font-sans"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-username">Username</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground pointer-events-none" />
            <Input
              id="login-username"
              name="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
              className="pl-10"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground pointer-events-none" />
            <Input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="pl-10 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-0 top-0 h-full px-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-[15px] h-[15px]" />
              ) : (
                <Eye className="w-[15px] h-[15px]" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" loading={isLoading} className="w-full mt-1">
          <LogIn className="w-4 h-4" /> Sign in
        </Button>
      </form>

      <div className="relative flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-sans select-none">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Button type="button" variant="outline" onClick={() => setCurrForm(1)} className="w-full">
        <User className="w-[15px] h-[15px]" />
        Continue as guest
      </Button>
    </>
  );
}

export default LoginForm;
