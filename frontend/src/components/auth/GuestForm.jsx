import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Tag, Loader2, Check, X, AlertCircle } from 'lucide-react';
import authService from '../../services/auth.service';
import { sanitizeUsernameInput, isValidUsername, USERNAME_HINT } from '../../utils/validation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';

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
        checking: { cls: 'text-muted-foreground', icon: <Loader2 className="w-3 h-3 animate-spin" />, text: 'Checking...' },
        available: { cls: 'text-emerald-600', icon: <Check className="w-3 h-3" />, text: 'Available' },
        taken: { cls: 'text-red-500', icon: <X className="w-3 h-3" />, text: 'Already taken' },
        invalid: { cls: 'text-red-500', icon: null, text: 'Minimum 2 characters' },
    };

    return (
        <>
            {error && (
                <div role="alert" className="alert alert-error bg-red-50 border border-red-100 text-red-600 text-[13.5px] py-2.5 px-3 mb-4 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="font-sans">{error}</span>
                </div>
            )}

            <form onSubmit={handleGuestSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="guest-username">Username</Label>
                    <div className="relative">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground" />
                        <Input
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
                            className="pl-10"
                        />
                    </div>
                    {guestUsername.length === 0 && (
                        <p className="text-[12px] text-muted-foreground mt-1.5 ml-0.5 font-sans">{USERNAME_HINT}</p>
                    )}
                    {usernameStatus && statusCfg[usernameStatus] && (
                        <p className={`text-[12px] mt-1.5 ml-0.5 flex items-center gap-1 font-sans ${statusCfg[usernameStatus].cls}`}>
                            {statusCfg[usernameStatus].icon}{statusCfg[usernameStatus].text}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="guest-gender">Gender</Label>
                    <select
                        id="guest-gender"
                        name="gender"
                        value={guestGender}
                        onChange={(e) => setGuestGender(parseInt(e.target.value))}
                        disabled={isLoading}
                        className="select select-bordered w-full h-11 min-h-11 rounded-xl bg-secondary/60 border-input text-[14px] font-sans focus:outline-primary"
                    >
                        <option value={0}>Male</option>
                        <option value={1}>Female</option>
                        <option value={2}>Other</option>
                    </select>
                </div>

                <label
                    htmlFor="guest-terms"
                    className="flex items-start gap-2.5 mt-0.5 text-[13px] text-muted-foreground select-none cursor-pointer font-sans"
                >
                    <Checkbox
                        id="guest-terms"
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
                        <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                    ) : (
                        'Continue as guest'
                    )}
                </Button>
            </form>

            <p className="text-center text-muted-foreground mt-6 text-[13.5px] font-sans">
                Want a full account?{' '}
                <button
                    onClick={() => setCurrForm(2)}
                    className="font-semibold text-primary hover:underline"
                >
                    Register
                </button>
            </p>
        </>
    );
}

export default GuestForm;
