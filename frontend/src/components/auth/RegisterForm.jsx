import { User, Mail, Lock, UserPlus, Loader2, Check, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import authService from '../../services/auth.service';
import { sanitizeUsernameInput, USERNAME_HINT } from '../../utils/validation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';

function UsernameHint({ status, empty }) {
  if (empty) return <p className="text-[12px] text-muted-foreground mt-1.5 ml-0.5 font-sans">{USERNAME_HINT}</p>;
  if (status === 'checking') return <p className="text-[12px] text-muted-foreground mt-1.5 ml-0.5 flex items-center gap-1 font-sans"><Loader2 className="w-3 h-3 animate-spin" /> Checking...</p>;
  if (status === 'available') return <p className="text-[12px] text-emerald-600 mt-1.5 ml-0.5 flex items-center gap-1 font-sans"><Check className="w-3 h-3" /> Available</p>;
  if (status === 'taken') return <p className="text-[12px] text-red-500 mt-1.5 ml-0.5 flex items-center gap-1 font-sans"><X className="w-3 h-3" /> Already taken</p>;
  if (status === 'invalid') return <p className="text-[12px] text-red-500 mt-1.5 ml-0.5 font-sans">Minimum 2 characters</p>;
  return null;
}

function RegisterForm({ setCurrForm }) {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);

  useEffect(() => {
    const check = async () => {
      const t = username.trim();
      if (!t) { setUsernameStatus(null); return; }
      if (t.length < 2) { setUsernameStatus('invalid'); return; }
      setUsernameStatus('checking');
      try {
        const res = await authService.checkUsername(t);
        setUsernameStatus(!res.isTaken ? 'available' : 'taken');
      } catch {
        setUsernameStatus('error');
      }
    };
    const id = setTimeout(check, 500);
    return () => clearTimeout(id);
  }, [username]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!agreedToTerms) { setError('Please accept the Terms and Conditions to continue'); return; }
    setIsLoading(true);
    try {
      const result = await register(username, email, gender, password);
      if (result.success) {
        navigate('/chat');
      } else {
        setError(result.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div role="alert" className="alert alert-error bg-red-50 border border-red-100 text-red-600 text-[13.5px] py-2.5 px-3 mb-4 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-sans">{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="register-username">Username</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground" />
            <Input
              id="register-username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(sanitizeUsernameInput(e.target.value))}
              disabled={isLoading}
              required
              className="pl-10"
            />
          </div>
          <UsernameHint status={usernameStatus} empty={username.length === 0} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="register-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground" />
            <Input
              id="register-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="register-gender">Gender</Label>
          {/* daisyUI select */}
          <select
            id="register-gender"
            name="gender"
            value={gender}
            onChange={(e) => setGender(parseInt(e.target.value))}
            disabled={isLoading}
            required
            className="select select-bordered w-full h-11 min-h-11 rounded-xl bg-secondary/60 border-input text-[14px] font-sans focus:outline-primary"
          >
            <option value={0}>Male</option>
            <option value={1}>Female</option>
            <option value={2}>Other</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground" />
            <Input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="6–50 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={6}
              maxLength={50}
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

        <label
          htmlFor="register-terms"
          className="flex items-start gap-2.5 mt-0.5 text-[13px] text-muted-foreground select-none cursor-pointer font-sans"
        >
          <Checkbox
            id="register-terms"
            checked={agreedToTerms}
            onCheckedChange={(v) => setAgreedToTerms(v === true)}
            disabled={isLoading}
            required
            className="mt-0.5"
          />
          <span>
            I agree to the{' '}
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              Terms and Conditions
            </Link>
          </span>
        </label>

        <Button type="submit" disabled={isLoading || !agreedToTerms} className="w-full mt-1">
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
          ) : (
            <><UserPlus className="w-4 h-4" /> Create account</>
          )}
        </Button>
      </form>

      <div className="divider text-[11px] text-muted-foreground uppercase tracking-widest my-5 before:bg-border after:bg-border">or</div>

      <Button type="button" variant="outline" onClick={() => setCurrForm(1)} className="w-full">
        <User className="w-[15px] h-[15px] text-muted-foreground" />
        Continue as guest
      </Button>
    </>
  );
}

export default RegisterForm;
