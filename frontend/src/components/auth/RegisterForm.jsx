import { User, Lock, UserPlus, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import authService from '../../services/auth.service';

function RegisterForm({ setCurrForm }) {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState(0);
  const [dob, setDob] = useState('');
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
    if (!dob) {
      setError('Please enter your date of birth');
      return;
    }
    setIsLoading(true);
    try {
      const result = await register(username, email, gender, password, dob);
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
        <p className="text-red-500 text-sm text-center mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            id="register-username"
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
        {usernameStatus === 'checking' && <p className="text-sm text-blue-500 -mt-2 ml-2 flex items-center font-semibold"><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Checking availability...</p>}
        {usernameStatus === 'available' && <p className="text-sm text-green-500 -mt-2 ml-2 font-semibold">✓ Username is available</p>}
        {usernameStatus === 'taken' && <p className="text-sm text-red-500 -mt-2 ml-2 font-semibold">✗ Username is already taken</p>}
        {usernameStatus === 'invalid' && <p className="text-sm text-red-500 -mt-2 ml-2 font-semibold">Username must be at least 2 characters</p>}

        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            className="w-full pl-12 pr-4 py-3 bg-[#e6e6e6] border-none rounded-2xl focus:outline-none shadow-[inset_1px_1px_3px_#c9c9c9,inset_-1px_-1px_3px_#ffffff] focus:shadow-[inset_2px_2px_4px_#c9c9c9,inset_-2px_-2px_4px_#ffffff] text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
          />
        </div>

        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <select
            id="register-gender"
            name="gender"
            value={gender}
            onChange={(e) => setGender(parseInt(e.target.value))}
            disabled={isLoading}
            required
            className="w-full pl-12 pr-4 py-3 bg-[#e6e6e6] border-none rounded-2xl focus:outline-none shadow-[inset_1px_1px_3px_#c9c9c9,inset_-1px_-1px_3px_#ffffff] focus:shadow-[inset_2px_2px_4px_#c9c9c9,inset_-2px_-2px_4px_#ffffff] text-gray-800 disabled:opacity-50"
          >
            <option value={0}>Male</option>
            <option value={1}>Female</option>
            <option value={2}>Other</option>
          </select>
        </div>

        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            id="register-dob"
            name="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            disabled={isLoading}
            required
            className="w-full pl-12 pr-4 py-3 bg-[#e6e6e6] border-none rounded-2xl focus:outline-none shadow-[inset_1px_1px_3px_#c9c9c9,inset_-1px_-1px_3px_#ffffff] focus:shadow-[inset_2px_2px_4px_#c9c9c9,inset_-2px_-2px_4px_#ffffff] text-gray-800 disabled:opacity-50"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            id="register-password"
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
              Creating Account...
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Create Account
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
        Already have an account?{' '}
        <button onClick={() => setCurrForm(0)} >
          Sign in
        </button>
      </p>
    </>
  );
}

export default RegisterForm;
