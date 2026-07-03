import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Tag, Loader2, Check, X } from 'lucide-react';
import authService from '../../services/auth.service';

const inputClass =
  'w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[14.5px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#008080] focus:ring-4 focus:ring-[#008080]/10 transition-colors disabled:opacity-50 disabled:bg-gray-50';

function GuestForm({ setCurrForm }) {
    const navigate = useNavigate();
    const { guestLogin } = useAuth();

    const [guestUsername, setGuestUsername] = useState('');
    const [guestGender, setGuestGender] = useState(0);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            const trimmed = guestUsername.trim();
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
    }, [guestUsername]);

    const handleGuestSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!guestUsername.trim()) {
            setError('Please enter a username');
            return;
        }
        if (guestUsername.trim().length < 2 || guestUsername.trim().length > 30) {
            setError('Username must be 2–30 characters');
            return;
        }
        if (!agreedToTerms) {
            setError('Please accept the Terms and Conditions to continue');
            return;
        }
        setIsLoading(true);
        try {
            const result = await guestLogin(guestUsername.trim(), guestGender);
            if (result.success) {
                navigate('/chat');
            } else {
                setError(result.message || 'Could not create guest session');
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

            <form onSubmit={handleGuestSubmit} className="flex flex-col gap-3.5">
                <div>
                    <label className="block text-[13px] font-medium text-gray-600 mb-1.5" htmlFor="guest-username">Username</label>
                    <div className="relative">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            id="guest-username"
                            name="username"
                            type="text"
                            placeholder="Choose a username"
                            value={guestUsername}
                            onChange={(e) => setGuestUsername(e.target.value)}
                            disabled={isLoading}
                            required
                            minLength={2}
                            maxLength={30}
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

                <div>
                    <label className="block text-[13px] font-medium text-gray-600 mb-1.5" htmlFor="guest-gender">Gender</label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                            id="guest-gender"
                            name="gender"
                            value={guestGender}
                            onChange={(e) => setGuestGender(parseInt(e.target.value))}
                            disabled={isLoading}
                            className={`${inputClass} appearance-none`}
                        >
                            <option value={0}>Male</option>
                            <option value={1}>Female</option>
                            <option value={2}>Other</option>
                        </select>
                    </div>
                </div>

                <label className="flex items-start gap-2 px-0.5 text-[13px] text-gray-600 select-none cursor-pointer">
                    <input
                        id="guest-terms"
                        name="agreedToTerms"
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        disabled={isLoading}
                        required
                        className="mt-0.5 w-4 h-4 rounded accent-[#008080] shrink-0"
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
                            Connecting...
                        </>
                    ) : (
                        "Continue as guest"
                    )}
                </button>
            </form>

            <p className="text-center text-gray-500 mt-6 text-[13.5px]">
                Don't have an account?{' '}
                <button onClick={() => setCurrForm(2)} className="font-medium text-[#008080] hover:underline">
                    Register
                </button>
            </p>
        </>
    )
}

export default GuestForm;
