import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ShieldCheck, Lock, User, AlertCircle, KeyRound } from 'lucide-react';

export default function OperatorLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('operator');
  const [password, setPassword] = useState('operator123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await api.post('/api/auth/login', {
        username: username.trim(),
        password: password.trim(),
      });

      localStorage.setItem('operator_token', res.data.access_token);
      localStorage.setItem(
        'operator_user',
        JSON.stringify({ username: res.data.username, role: res.data.role })
      );

      navigate('/operator/dashboard');
    } catch (err) {
      setErrorMessage(
        err.response?.data?.detail || 'Invalid operator credentials. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-[#FFFFFF] border border-[#E8E2D9] rounded-2xl p-6 sm:p-8 shadow-soft">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#A9CCE3] flex items-center justify-center text-[#1F3A4D] mx-auto mb-3 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A4D]">
            Emergency Operator Portal
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Restricted access for municipal dispatchers & disaster response teams.
          </p>
        </div>

        {/* Demo credentials notification */}
        <div className="mb-5 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs text-gray-600">
          <div className="flex items-center gap-1.5 font-semibold text-[#1F3A4D] mb-1">
            <KeyRound className="w-3.5 h-3.5 text-sky-700" />
            <span>College Mini-Project Pre-Seeded Operator:</span>
          </div>
          <p className="text-[11px] font-mono">
            Username: <strong className="text-gray-800">operator</strong> &bull; Password: <strong className="text-gray-800">operator123</strong>
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 mb-5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F3A4D] mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-[#E8E2D9] pl-9 pr-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A9CCE3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1F3A4D] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-[#E8E2D9] pl-9 pr-3 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A9CCE3]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#A9CCE3] hover:bg-[#8FBBD9] text-[#1F3A4D] transition-colors shadow-soft disabled:opacity-60 mt-2"
          >
            {isLoading ? 'Verifying...' : 'Sign In as Operator'}
          </button>
        </form>
      </div>
    </div>
  );
}
