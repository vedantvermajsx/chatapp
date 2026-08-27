import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Tag, Loader2, Check, X } from 'lucide-react';
import authService from '../../services/auth.service';
import { sanitizeUsernameInput, isValidUsername, USERNAME_HINT } from '../../utils/validation';

const F = "'Plus Jakarta Sans', sans-serif";

const inputClass =
    'w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#008080] focus:ring-4 focus:ring-[#008080]/8 transition-all outline-none disabled:opacity-50';

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
        const check = async () => {
            const t = guestUsername.trim();
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
    }, [guestUsername]);

    const handleGuestSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!guestUsername.trim()) { setError('Please enter a username'); return; }
        if (guestUsername.trim().length < 2 || guestUsername.trim().length > 30) { setError('Username must be 2–30 characters'); return; }
        if (!isValidUsername(guestUsername.trim())) { setError(USERNAME_HINT); return; }
        if (!agreedToTerms) { setError('Please accept the Terms and Conditions to continue'); return; }
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

    const statusCfg = {
        checking: { cls: 'text-gray-400', icon: <Loader2 className="w-3 h-3 animate-spin" />, text: 'Checking...' },
        available: { cls: 'text-emerald-600', icon: <Check className="w-3 h-3" />, text: 'Available' },
        taken: { cls: 'text-red-500', icon: <X className="w-3 h-3" />, text: 'Already taken' },
        invalid: { cls: 'text-red-500', icon: null, text: 'Minimum 2 characters' },
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

            <form onSubmit={handleGuestSubmit} className="flex flex-col gap-3">
                <div>
                    <div className="relative">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
                        <input
                            id="guest-username"
                            name="username"
                            type="text"
                            placeholder="Choose a username"
                            value={guestUsername}
                            onChange={(e) => setGuestUsername(sanitizeUsernameInput(e.target.value))}
                            disabled={isLoading}
                            required
                            minLength={2}
                            maxLength={30}
                            style={{ fontFamily: F }}
                            className={inputClass}
                        />
                    </div>
                    {guestUsername.length === 0 && (
                        <p className="text-[12px] text-gray-400 mt-1.5 ml-0.5" style={{ fontFamily: F }}>{USERNAME_HINT}</p>
                    )}
                    {usernameStatus && statusCfg[usernameStatus] && (
                        <p className={`text-[12px] mt-1.5 ml-0.5 flex items-center gap-1 ${statusCfg[usernameStatus].cls}`} style={{ fontFamily: F }}>
                            {statusCfg[usernameStatus].icon}{statusCfg[usernameStatus].text}
                        </p>
                    )}
                </div>

                <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400 pointer-events-none" />
                    <select
                        id="guest-gender"
                        name="gender"
                        value={guestGender}
                        onChange={(e) => setGuestGender(parseInt(e.target.value))}
                        disabled={isLoading}
                        style={{ fontFamily: F }}
                        className={`${inputClass} appearance-none`}
                    >
                        <option value={0}>Male</option>
                        <option value={1}>Female</option>
                        <option value={2}>Other</option>
                    </select>
                </div>

                <label
                    className="flex items-start gap-2.5 mt-0.5 text-[13px] text-gray-500 select-none cursor-pointer"
                    style={{ fontFamily: F }}
                >
                    <input
                        id="guest-terms"
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
                        <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                    ) : (
                        'Continue as guest'
                    )}
                </button>
            </form>

            <p className="text-center text-gray-400 mt-6 text-[13.5px]" style={{ fontFamily: F }}>
                Want a full account?{' '}
                <button
                    onClick={() => setCurrForm(2)}
                    className="font-semibold text-[#008080] hover:underline"
                >
                    Register
                </button>
            </p>
        </>
    );
}

export default GuestForm;
