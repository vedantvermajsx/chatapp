import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, LogIn, Tag, Loader2 } from 'lucide-react';
import authService from '../../services/auth.service';

function GuestForm({ setCurrForm }) {
    const navigate = useNavigate();
    const { guestLogin } = useAuth();

    const [guestUsername, setGuestUsername] = useState('');
    const [guestGender, setGuestGender] = useState(0);
    const [guestDob, setGuestDob] = useState('');
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
        if (!guestDob) {
            setError('Please enter your date of birth');
            return;
        }
        setIsLoading(true);
        try {
            const result = await guestLogin(guestUsername.trim(), guestGender, guestDob);
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
            <p className="text-gray-600 text-center mb-6 text-sm">Continue without creating an account</p>

            {error && (
                <p className="text-red-500 text-sm text-center mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {error}
                </p>
            )}

            <form onSubmit={handleGuestSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="guest-username">Username</label>
                    <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
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
                            className="w-full pl-12 pr-4 py-3 bg-[#e6e6e6] border-none rounded-2xl focus:outline-none shadow-[inset_1px_1px_3px_#c9c9c9,inset_-1px_-1px_3px_#ffffff] focus:shadow-[inset_2px_2px_4px_#c9c9c9,inset_-2px_-2px_4px_#ffffff] text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
                        />
                    </div>
                    {usernameStatus === 'checking' && <p className="text-sm text-blue-500 mt-2 ml-2 flex items-center font-semibold"><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Checking availability...</p>}
                    {usernameStatus === 'available' && <p className="text-sm text-green-500 mt-2 ml-2 font-semibold">✓ Username is available</p>}
                    {usernameStatus === 'taken' && <p className="text-sm text-red-500 mt-2 ml-2 font-semibold">✗ Username is already taken</p>}
                    {usernameStatus === 'invalid' && <p className="text-sm text-red-500 mt-2 ml-2 font-semibold">Username must be at least 2 characters</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="guest-gender">Gender</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <select
                            id="guest-gender"
                            name="gender"
                            value={guestGender}
                            onChange={(e) => setGuestGender(parseInt(e.target.value))}
                            disabled={isLoading}
                            className="w-full pl-12 pr-4 py-3 bg-[#e6e6e6] border-none rounded-2xl focus:outline-none shadow-[inset_1px_1px_3px_#c9c9c9,inset_-1px_-1px_3px_#ffffff] focus:shadow-[inset_2px_2px_4px_#c9c9c9,inset_-2px_-2px_4px_#ffffff] text-gray-800 disabled:opacity-50"
                        >
                            <option value={0}>Male</option>
                            <option value={1}>Female</option>
                            <option value={2}>Other</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="guest-dob">Date of Birth</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            id="guest-dob"
                            name="dob"
                            type="date"
                            value={guestDob}
                            onChange={(e) => setGuestDob(e.target.value)}
                            disabled={isLoading}
                            required
                            className="w-full pl-12 pr-4 py-3 bg-[#e6e6e6] border-none rounded-2xl focus:outline-none shadow-[inset_1px_1px_3px_#c9c9c9,inset_-1px_-1px_3px_#ffffff] focus:shadow-[inset_2px_2px_4px_#c9c9c9,inset_-2px_-2px_4px_#ffffff] text-gray-800 disabled:opacity-50"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#e6e6e6] text-gray-800 font-bold rounded-2xl shadow-[2px_2px_4px_#c9c9c9,-2px_-2px_4px_#ffffff] hover:shadow-[inset_3px_3px_6px_#c9c9c9,inset_-3px_-3px_6px_#ffffff] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        "Continue as Guest"
                    )}
                </button>
            </form>

            <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="px-3 text-sm text-gray-500">or</span>
                <div className="flex-1 h-px bg-gray-300" />
            </div>

            <button
                onClick={() => setCurrForm(0)}
                className="w-full py-3 bg-[#e6e6e6] text-gray-800 font-bold rounded-2xl shadow-[2px_2px_4px_#c9c9c9,-2px_-2px_4px_#ffffff] hover:shadow-[inset_3px_3px_6px_#c9c9c9,inset_-3px_-3px_6px_#ffffff] transition-all flex items-center justify-center gap-2"
            >
                <LogIn className="w-4 h-4" />
                Sign In
            </button>

            <p className="text-center text-gray-700 mt-6 text-sm">
                Don't have an account?{' '}
                <button onClick={() => setCurrForm(2)}>
                    Register
                </button>
            </p>
        </>
    )
}

export default GuestForm;