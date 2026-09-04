import { Lock, LogIn, User, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
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
        setError(result.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div role="alert" className="alert alert-error bg-red-50 border border-red-100 text-red-600 text-[13.5px] py-2.5 px-3 mb-4 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-sans">{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-username">Username</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground" />
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground" />
            <Input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-[15px] h-[15px]" /> : <Eye className="w-[15px] h-[15px]" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full mt-1">
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
          ) : (
            <><LogIn className="w-4 h-4" /> Sign in</>
          )}
        </Button>
      </form>

      {/* daisyUI divider */}
      <div className="divider text-[11px] text-muted-foreground uppercase tracking-widest my-5 before:bg-border after:bg-border">or</div>

      <Button type="button" variant="outline" onClick={() => setCurrForm(1)} className="w-full">
        <User className="w-[15px] h-[15px] text-muted-foreground" />
        Continue as guest
      </Button>
    </>
  );
}

export default LoginForm;
