import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ShieldCheck, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function OperatorLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="max-w-md w-full bg-[#242321] border border-[#594538] rounded-2xl p-6 sm:p-8 shadow-card">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#C47A35] flex items-center justify-center text-[#191817] mx-auto mb-3 shadow-amber">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F0E6D8]">
            Emergency Operator Portal
          </h1>
          <p className="text-xs text-[#B5A493] mt-1">
            Restricted access for municipal dispatchers & disaster response teams.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 mb-5 rounded-lg bg-[#42201D] border border-[#FFA494]/40 text-[#FFA494] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#F0E6D8] mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#B5A493] absolute left-3 top-3.5" />
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="Enter operator username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-[#594538] pl-9 pr-3 py-2.5 bg-[#191817] text-[#F0E6D8] placeholder-[#B5A493]/50 focus:outline-none focus:border-[#C47A35] focus:ring-1 focus:ring-[#C47A35]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#F0E6D8] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#B5A493] absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-[#594538] pl-9 pr-10 py-2.5 bg-[#191817] text-[#F0E6D8] placeholder-[#B5A493]/50 focus:outline-none focus:border-[#C47A35] focus:ring-1 focus:ring-[#C47A35]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#B5A493] hover:text-[#F0E6D8] focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#C47A35] hover:bg-[#D48944] text-[#191817] transition-colors shadow-amber disabled:opacity-60 mt-2"
          >
            {isLoading ? 'Verifying...' : 'Sign In as Operator'}
          </button>
        </form>
      </div>
    </div>
  );
}
