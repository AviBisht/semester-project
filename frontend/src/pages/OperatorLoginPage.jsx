import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Lock, User, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';

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
        err.response?.data?.detail || 'Invalid operator credentials. Please verify your username and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F5F0E5]">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-[#FCFAF6] border border-[#DFD8C8] rounded-xl overflow-hidden shadow-subtle">
        
        {/* Left Side: High-Quality Aerial Photograph of Dehradun Himalayan Foothills */}
        <div className="md:col-span-5 relative min-h-[180px] sm:min-h-[220px] md:min-h-[480px] overflow-hidden bg-[#697C58]">
          <img
            src="/dehradun_aerial.jpg"
            alt="Aerial view of Dehradun valley and lush green Himalayan foothills"
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
          />
          {/* Tasteful olive-toned treatment & subtle atmospheric gradient */}
          <div className="absolute inset-0 bg-[#697C58]/20 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#343B30]/70 via-transparent to-[#343B30]/20" />

          {/* Minimal geographical badge in lower corner */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[#F5F0E5]">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#343B30]/65 backdrop-blur-xs border border-white/20 text-[10px] font-mono tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6CDAA]" />
              <span>Dehradun Foothills • 30.3165° N</span>
            </div>
          </div>
        </div>

        {/* Right Side: Secure Authentication Terminal */}
        <div className="md:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-center bg-[#FCFAF6]">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-md bg-[#EEF2E6] border border-[#B2BCA0] flex items-center justify-center p-1 shrink-0">
                <Shield className="w-3.5 h-3.5 text-[#697C58]" />
              </div>
              <span className="text-[10px] font-mono text-[#5A6354] uppercase tracking-wider font-semibold">
                Operator Gate
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#343B30] tracking-tight">
              Sign In to Dispatch Console
            </h1>
            <p className="text-xs text-[#5A6354] mt-1 leading-relaxed">
              Authorized emergency operators and disaster coordination personnel.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 mb-5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#5A6354] uppercase tracking-wider mb-1 font-semibold">
                Operator Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#7C8775] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Enter operator username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs font-mono rounded-lg border border-[#DFD8C8] pl-9 pr-3 py-2.5 bg-[#FFFFFF] text-[#343B30] placeholder-[#7C8775] focus:outline-none focus:border-[#697C58] focus:ring-1 focus:ring-[#697C58] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#5A6354] uppercase tracking-wider mb-1 font-semibold">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7C8775] absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-mono rounded-lg border border-[#DFD8C8] pl-9 pr-10 py-2.5 bg-[#FFFFFF] text-[#343B30] placeholder-[#7C8775] focus:outline-none focus:border-[#697C58] focus:ring-1 focus:ring-[#697C58] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#7C8775] hover:text-[#343B30] transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg font-bold text-xs font-mono uppercase tracking-wider bg-[#697C58] hover:bg-[#576748] text-white transition-colors disabled:opacity-50 mt-3 shadow-xs"
            >
              {isLoading ? 'Authenticating...' : 'Sign In as Operator'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#DFD8C8] text-center">
            <span className="text-[11px] font-mono text-[#7C8775]">
              Restricted Console • Multi-Factor Session Managed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
