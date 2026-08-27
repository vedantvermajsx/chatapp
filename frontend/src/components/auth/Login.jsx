import { useState } from 'react';
import LoginForm from './LoginForm';
import GuestForm from './GuestForm';
import RegisterForm from './RegisterForm';
import { ArrowLeft } from 'lucide-react';

const COPY = {
  0: { heading: 'Welcome back' },
  1: { heading: 'Join as a guest' },
  2: { heading: 'Create an account' },
};

const BG =
  'radial-gradient(ellipse 90% 70% at 60% 0%, rgba(0,180,140,0.13) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 0% 100%, rgba(99,50,220,0.10) 0%, transparent 50%), #f7f8fa';

function Login() {
  const [currForm, setCurrForm] = useState(0);
  const { heading } = COPY[currForm];

  return (
    <div
      className="min-h-dvh w-full flex flex-col items-center justify-center px-4 py-10 overflow-y-auto"
      style={{ background: BG }}
    >
      <div
        className="w-full max-w-[420px]"
        style={{ animation: 'panelIn 0.35s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
          >
            <img src="/icon.png" alt="GatherUp" className="w-10 h-10 object-contain" />
          </div>
          <span
            className="text-gray-900 font-bold text-[16px]"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            GatherUp
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-8">
          {currForm === 1 ? (
            <button
              onClick={() => setCurrForm(0)}
              className="flex items-center gap-1.5 text-[13.5px] text-gray-400 hover:text-gray-700 transition-colors mb-7"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </button>
          ) : (
            <div className="flex gap-1 p-1 mb-8 rounded-xl" style={{ background: '#f1f3f5' }}>
              {[{ label: 'Sign in', idx: 0 }, { label: 'Create account', idx: 2 }].map(({ label, idx }) => (
                <button
                  key={idx}
                  onClick={() => setCurrForm(idx)}
                  className="flex-1 py-2 rounded-lg text-[13.5px] font-semibold transition-all"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    background: currForm === idx ? 'white' : 'transparent',
                    color: currForm === idx ? '#111827' : '#9ca3af',
                    boxShadow: currForm === idx ? '0 1px 3px rgba(0,0,0,0.09)' : 'none',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <h1
            className="text-[1.4rem] font-bold text-gray-700 tracking-tight mb-2"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            {heading}
          </h1>


          {currForm === 0 && <LoginForm setCurrForm={setCurrForm} />}
          {currForm === 1 && <GuestForm setCurrForm={setCurrForm} />}
          {currForm === 2 && <RegisterForm setCurrForm={setCurrForm} />}
        </div>

        <p
          className="text-center text-[12px] text-gray-400 mt-6"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          © {new Date().getFullYear()} GatherUp. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;
