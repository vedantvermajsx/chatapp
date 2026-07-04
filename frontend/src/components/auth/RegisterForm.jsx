import { User, Mail, Lock, UserPlus, Loader2, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import authService from '../../services/auth.service';

const inputClass =
  'w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14.5px] text-gray-900 placeholder:text-gray-400 focus:border-[#008080] focus:ring-4 focus:ring-[#008080]/10 transition-colors disabled:opacity-50 disabled:bg-gray-50';

function RegisterForm({ setCurrForm }) {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const trimmed = username.trim();
      if (trimmed.length === 0) {
        setUsernameStatus(null);
        return;
      }
      if (trimmed.length < 2) {
        setUsernameStatus('invalid');
        return;
      }
      setUsernameStatus('checking');
      try {
        const res = await authService.checkUsername(trimmed);
        setUsernameStatus(!res.isTaken ? 'available' : 'taken');
      } catch (err) {
        setUsernameStatus('error');
      }
    };
    const timeout = setTimeout(checkUser, 500);
    return () => clearTimeout(timeout);
  }, [username]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!agreedToTerms) {
      setError('Please accept the Terms and Conditions to continue');
      return;
    }
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
        <p className="text-red-600 text-sm text-center mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
        <div>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="register-username"
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
          {usernameStatus === 'checking' && (
            <p className="text-xs text-gray-400 mt-1.5 ml-1 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
            </p>
          )}
          {usernameStatus === 'available' && (
            <p className="text-xs text-emerald-600 mt-1.5 ml-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> Username is available
            </p>
          )}
          {usernameStatus === 'taken' && (
            <p className="text-xs text-red-500 mt-1.5 ml-1 flex items-center gap-1">
              <X className="w-3 h-3" /> Username is already taken
            </p>
          )}
          {usernameStatus === 'invalid' && (
            <p className="text-xs text-red-500 mt-1.5 ml-1">Username must be at least 2 characters</p>
          )}
        </div>

        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            className={inputClass}
          />
        </div>

        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            id="register-gender"
            name="gender"
            value={gender}
            onChange={(e) => setGender(parseInt(e.target.value))}
            disabled={isLoading}
            required
            className={`${inputClass} appearance-none`}
          >
            <option value={0}>Male</option>
            <option value={1}>Female</option>
            <option value={2}>Other</option>
          </select>
        </div>

        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="register-password"
            name="password"
            type="password"
            placeholder="Password (6-50 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={6}
            maxLength={50}
            className={inputClass}
          />
        </div>

        <label className="flex items-start gap-2 px-0.5 text-[13px] text-gray-600 select-none cursor-pointer">
          <input
            id="register-terms"
            name="agreedToTerms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            disabled={isLoading}
            required
            className="mt-0.5 w-4 h-4 rounded accent-[#008080] shrink-0 cursor-pointer"
          />
          <span>
            I agree to the{' '}
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#008080] hover:underline"
            >
              Terms and Conditions
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={isLoading || !agreedToTerms}
          className="w-full py-2.5 mt-1 bg-[#008080] hover:bg-[#046d6d] text-white text-[14.5px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Create account
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

export default RegisterForm;
