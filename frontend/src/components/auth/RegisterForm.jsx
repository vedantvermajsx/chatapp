import { User, Mail, Lock, UserPlus, Loader2, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import authService from '../../services/auth.service';
import { sanitizeUsernameInput, USERNAME_HINT } from '../../utils/validation';

const F = "'Plus Jakarta Sans', sans-serif";

const inputClass =
  'w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#008080] focus:ring-4 focus:ring-[#008080]/8 transition-all outline-none disabled:opacity-50';

function UsernameHint({ status, empty }) {
  if (empty) return <p className="text-[12px] text-gray-400 mt-1.5 ml-0.5" style={{ fontFamily: F }}>{USERNAME_HINT}</p>;
  if (status === 'checking') return <p className="text-[12px] text-gray-400 mt-1.5 ml-0.5 flex items-center gap-1" style={{ fontFamily: F }}><Loader2 className="w-3 h-3 animate-spin" /> Checking...</p>;
  if (status === 'available') return <p className="text-[12px] text-emerald-600 mt-1.5 ml-0.5 flex items-center gap-1" style={{ fontFamily: F }}><Check className="w-3 h-3" /> Available</p>;
  if (status === 'taken') return <p className="text-[12px] text-red-500 mt-1.5 ml-0.5 flex items-center gap-1" style={{ fontFamily: F }}><X className="w-3 h-3" /> Already taken</p>;
  if (status === 'invalid') return <p className="text-[12px] text-red-500 mt-1.5 ml-0.5" style={{ fontFamily: F }}>Minimum 2 characters</p>;
  return null;
}

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
        <p
          className="text-red-600 text-[13.5px] text-center mb-4 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5"
          style={{ fontFamily: F }}
        >
          {error}
        </p>
      )}

      <form onSubmit={handleRegister} className="flex flex-col gap-3">
        <div>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
            <input
              id="register-username"
              name="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(sanitizeUsernameInput(e.target.value))}
              disabled={isLoading}
              required
              style={{ fontFamily: F }}
              className={inputClass}
            />
          </div>
          <UsernameHint status={usernameStatus} empty={username.length === 0} />
        </div>

        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            style={{ fontFamily: F }}
            className={inputClass}
          />
        </div>

        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400 pointer-events-none" />
          <select
            id="register-gender"
            name="gender"
            value={gender}
            onChange={(e) => setGender(parseInt(e.target.value))}
            disabled={isLoading}
            required
            style={{ fontFamily: F }}
            className={`${inputClass} appearance-none`}
          >
            <option value={0}>Male</option>
            <option value={1}>Female</option>
            <option value={2}>Other</option>
          </select>
        </div>

        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
          <input
            id="register-password"
            name="password"
            type="password"
            placeholder="Password (6–50 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={6}
            maxLength={50}
            style={{ fontFamily: F }}
            className={inputClass}
          />
        </div>

        <label
          className="flex items-start gap-2.5 mt-0.5 text-[13px] text-gray-500 select-none cursor-pointer"
          style={{ fontFamily: F }}
        >
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
              className="font-semibold text-[#008080] hover:underline"
            >
              Terms and Conditions
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={isLoading || !agreedToTerms}
          className="w-full mt-1 py-2.5 rounded-xl text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985]"
          style={{ fontFamily: F, background: '#008080' }}
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
          ) : (
            <><UserPlus className="w-4 h-4" /> Create account</>
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

export default RegisterForm;
