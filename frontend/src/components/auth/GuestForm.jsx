import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Tag, Check, X, AlertCircle, ChevronDown } from 'lucide-react';
import LoaderMini from '../common/Loader';
import authService from '../../services/auth.service';
import { sanitizeUsernameInput, isValidUsername, USERNAME_HINT } from '../../utils/validation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { cn } from '../../lib/utils';

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
        if (!guestUsername.trim()) { setError('Please enter a username.'); return; }
        if (guestUsername.trim().length < 2 || guestUsername.trim().length > 30) { setError('Username must be 2–30 characters.'); return; }
        if (!isValidUsername(guestUsername.trim())) { setError(USERNAME_HINT); return; }
        if (!agreedToTerms) { setError('Please accept the Terms and Conditions to continue.'); return; }
        setIsLoading(true);
        try {
            const result = await guestLogin(guestUsername.trim(), guestGender);
            if (result.success) {
                navigate('/chat');
            } else {
                setError(result.message || 'Could not create guest session. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const statusCfg = {
        checking: { cls: 'text-muted-foreground', icon: <LoaderMini className="w-3 h-3 animate-spin" />, text: 'Checking…' },
        available: { cls: 'text-emerald-600', icon: <Check className="w-3 h-3" />, text: 'Available' },
        taken: { cls: 'text-red-500', icon: <X className="w-3 h-3" />, text: 'Already taken' },
        invalid: { cls: 'text-red-500', icon: null, text: 'Minimum 2 characters' },
    };

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

            <form onSubmit={handleGuestSubmit} className="flex flex-col gap-4">
                {/* Username */}
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="guest-username">Username</Label>
                    <div className="relative">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground pointer-events-none" />
                        <Input
                            id="guest-username"
                            name="username"
                            type="text"
                            placeholder="Choose a display name"
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
                        <p className="text-[12px] text-muted-foreground mt-0.5 ml-0.5 font-sans">{USERNAME_HINT}</p>
                    )}
                    {usernameStatus && statusCfg[usernameStatus] && (
                        <p className={`text-[12px] mt-0.5 ml-0.5 flex items-center gap-1.5 font-sans ${statusCfg[usernameStatus].cls}`}>
                            {statusCfg[usernameStatus].icon}{statusCfg[usernameStatus].text}
                        </p>
                    )}
                </div>

                {/* Gender */}
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="guest-gender">Gender</Label>
                    <div className="relative">
                        <select
                            id="guest-gender"
                            name="gender"
                            value={guestGender}
                            onChange={(e) => setGuestGender(parseInt(e.target.value))}
                            disabled={isLoading}
                            className={cn(
                                'appearance-none flex h-11 w-full rounded-xl border border-input bg-secondary/50 pl-3.5 pr-9 py-2.5 text-[14px] font-sans text-foreground',
                                'transition-all duration-150 outline-none ring-0',
                                'focus:bg-background focus:border-foreground/30 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.07)]',
                                'disabled:cursor-not-allowed disabled:opacity-50'
                            )}
                        >
                            <option value={0}>Male</option>
                            <option value={1}>Female</option>
                            <option value={2}>Other</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground pointer-events-none" />
                    </div>
                </div>

                {/* Terms */}
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
                            className="font-semibold text-foreground hover:underline underline-offset-2"
                        >
                            Terms and Conditions
                        </Link>
                    </span>
                </label>

                <Button type="submit" loading={isLoading} disabled={!agreedToTerms} className="w-full mt-1">
                    Continue as guest
                </Button>
            </form>

            <p className="text-center text-muted-foreground mt-6 text-[13px] font-sans">
                Want a full account?{' '}
                <button
                    onClick={() => setCurrForm(2)}
                    className="font-semibold text-foreground hover:underline underline-offset-2"
                >
                    Register
                </button>
            </p>
        </>
    );
}

export default GuestForm;
