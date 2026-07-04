import { useState } from 'react';
import LoginForm from './LoginForm';
import GuestForm from './GuestForm';
import RegisterForm from './RegisterForm';
import { MessageCircle, ArrowLeft } from 'lucide-react';

const COPY = {
  0: {
    heading: 'Welcome back',
    sub: 'Sign in to pick up where you left off.',
  },
  1: {
    heading: 'Join as a guest',
    sub: 'Jump into a conversation, no account needed.',
  },
  2: {
    heading: 'Create your account',
    sub: 'Set up your space in less than a minute.',
  },
};

function Login() {
  const [currForm, setCurrForm] = useState(0);
  const { heading, sub } = COPY[currForm];

  return (
    <div className="min-h-dvh w-full flex bg-white">
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] relative flex-col justify-between bg-[#060a04] text-white p-12 xl:p-14 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(0,128,128,0.5),transparent_55%)]" />

        <div className="relative">
          <h1
            className="text-[2.35rem] leading-[1.12] text-white/80  font-semibold  mt-56 tracking-tight mb-4 max-w-sm"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Quick and reliable, messaging app.
          </h1>

          <div className="flex flex-col gap-2.5 max-w-[300px]">
            <div className="flex justify-start">
              <div
                className="bg-white/[0.08] border border-white/10 px-4 py-2.5 rounded-2xl rounded-bl-md text-[13.5px] text-white/85 opacity-50"
              >
                did you see the new design room?
              </div>
            </div>
            <div className="flex justify-end">
              <div
                className="bg-[#008080] px-4 py-2.5 rounded-2xl rounded-br-md text-[13.5px] text-white opacity-30"
              >
                just joined
              </div>
            </div>
            <div className="flex justify-start">
              <div
                className="bg-white/[0.08] border border-white/10 px-4 py-2.5 rounded-2xl rounded-bl-md text-[13.5px] text-white/85 opacity-20"
              >
                perfect timing, we're gathering up now
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-white/35 text-xs">
          © {new Date().getFullYear()} GatherUp. All rights reserved.
        </p>
      </div>

      <div className="flex-1 min-h-dvh overflow-y-auto flex items-start sm:items-center justify-center px-4 py-6 sm:p-10">
        <div
          className="w-full max-w-[380px] pb-4 sm:pb-0"
          style={{ animation: 'panelIn 0.4s ease both' }}
        >
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-[#008080]/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#008080]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">GatherUp</p>
              <p className="text-xs text-gray-500">Chat anywhere, comfortably.</p>
            </div>
          </div>

          {currForm === 1 ? (
            <button
              onClick={() => setCurrForm(0)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </button>
          ) : (
            <div className="flex gap-1 p-1 mb-8 bg-gray-100 rounded-lg">
              <button
                onClick={() => setCurrForm(0)}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${currForm === 0
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Sign in
              </button>
              <button
                onClick={() => setCurrForm(2)}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${currForm === 2
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Create account
              </button>
            </div>
          )}

          <h2
            className="text-2xl font-semibold text-gray-900 tracking-tight mb-1.5"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {heading}
          </h2>
          <p className="text-gray-500 text-[14.5px] mb-7">{sub}</p>

          {currForm === 0 && <LoginForm setCurrForm={setCurrForm} />}
          {currForm === 1 && <GuestForm setCurrForm={setCurrForm} />}
          {currForm === 2 && <RegisterForm setCurrForm={setCurrForm} />}
        </div>
      </div>
    </div>
  );
}
export default Login;
