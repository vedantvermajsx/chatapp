import { useState } from 'react';
import LoginForm from './LoginForm';
import GuestForm from './GuestForm';
import RegisterForm from './RegisterForm';
import { MessageCircle } from 'lucide-react';

function Login() {
  const [currForm, setCurrForm] = useState(0);

  return (
    <div className="min-h-screen bg-[#e6e6e6] flex items-center justify-center p-4">
      <div className="bg-[#e6e6e6] rounded-3xl shadow-[10px_10px_20px_#c9c9c9,-10px_-10px_20px_#ffffff] max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#e6e6e6] flex items-center justify-center mr-3 shadow-[1px_1px_3px_#c9c9c9,-1px_-1px_3px_#ffffff]">
            <MessageCircle className="w-6 h-6 text-gray-700" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">GatherUp</h1>
        </div>

        {currForm === 0 && <LoginForm setCurrForm={setCurrForm} />}
        {currForm === 1 && <GuestForm setCurrForm={setCurrForm} />}
        {currForm === 2 && <RegisterForm setCurrForm={setCurrForm} />}

      </div>
    </div>
  )
}
export default Login;
