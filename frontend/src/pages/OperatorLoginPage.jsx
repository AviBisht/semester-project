import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Lock, User, AlertCircle, Eye, EyeOff, ShieldCheck, Terminal, Radio } from 'lucide-react';

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
    <div className="flex-1 min-h-[calc(100vh-3.5rem)] grid grid-cols-1 lg:grid-cols-12 bg-[#F5F0E5]">
      <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full overflow-hidden bg-[#343B30] flex flex-col justify-between p-6 sm:p-10 text-[#F5F0E5]">
        <img
          src="/dehradun_aerial.jpg"
          alt="Aerial view of Dehradun valley and lush green Himalayan foothills"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#343B30]/75 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#343B30] via-[#343B30]/40 to-transparent" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#343B30]/90 backdrop-blur-md border border-white/20 text-xs font-mono tracking-wider">
            <Radio className="w-3.5 h-3.5 text-[#86EFAC] animate-pulse" />
            <span>DEOC DISPATCH TERMINAL &bull; 30.3165° N</span>
          </div>
        </div>

        <div className="relative z-10 max-w-sm mt-12 lg:mt-0">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#BAC7AF] font-bold block mb-1">
            District Operational Security
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
            Dehradun Emergency Coordination Grid
          </h2>
          <p className="text-xs text-[#EFE9DC]/90 mt-2 leading-relaxed">
            Restricted access gate for authorized municipal coordinators, disaster response liaisons, and emergency dispatch commanders.
          </p>
        </div>
      </div>

      <div className="lg:col-span-7 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 bg-[#FCFAF6] border-l border-[#DFD8C8]">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-[#EEF2E6] border border-[#B2BCA0] text-[#697C58]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-[#5A6354] uppercase tracking-wider font-bold">
                Operator Clearance Required
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#343B30] tracking-tight">
              Sign In to Command Console
            </h1>
            <p className="text-xs text-[#5A6354] mt-1.5 leading-relaxed">
              Authenticate with your district operational credentials to manage the live incident queue and dispatch nearest rescue units.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-mono flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="operator-username"
                className="block text-xs font-mono text-[#5A6354] uppercase tracking-wider mb-1.5 font-bold"
              >
                Operator Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#7C8775] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="operator-username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Enter operator username (e.g. operator)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs font-mono rounded border border-[#DFD8C8] pl-10 pr-3 py-2.5 bg-[#FFFFFF] text-[#343B30] placeholder-[#7C8775] focus:outline-none focus:border-[#697C58] focus:ring-1 focus:ring-[#697C58] transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="operator-password"
                className="block text-xs font-mono text-[#5A6354] uppercase tracking-wider mb-1.5 font-bold"
              >
                Terminal Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7C8775] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="operator-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-mono rounded border border-[#DFD8C8] pl-10 pr-10 py-2.5 bg-[#FFFFFF] text-[#343B30] placeholder-[#7C8775] focus:outline-none focus:border-[#697C58] focus:ring-1 focus:ring-[#697C58] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#7C8775] hover:text-[#343B30] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded font-bold text-xs font-mono uppercase tracking-wider bg-[#697C58] hover:bg-[#576748] text-white transition-colors disabled:opacity-50 mt-2 shadow-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  <span>Authenticate &amp; Enter Console</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-[#DFD8C8] flex items-center justify-between text-[11px] font-mono text-[#7C8775]">
            <span>Audit Logged Session</span>
            <span>Dehradun DEOC v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
