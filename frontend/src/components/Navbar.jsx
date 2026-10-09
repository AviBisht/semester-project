import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, MapPin, Search, BarChart3, LogIn, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem('operator_token');
  const userStr = localStorage.getItem('operator_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('operator_token');
    localStorage.removeItem('operator_user');
    navigate('/operator/login');
  };

  const navLinks = [
    { name: 'Report Incident', path: '/', icon: ShieldAlert },
    { name: 'Track Report', path: '/track', icon: Search },
    { name: 'Operator Dashboard', path: '/operator/dashboard', icon: MapPin },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#242321]/95 backdrop-blur-md border-b border-[#594538]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-[#C47A35] flex items-center justify-center text-[#191817] font-bold shadow-md transition-transform group-hover:scale-105">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[#F0E6D8] block leading-tight">
                CrisisResponse Dehradun
              </span>
              <span className="text-[11px] text-[#B5A493] font-medium">
                Emergency & Flood Management
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#C47A35]/20 text-[#C47A35] border border-[#C47A35]/40 font-semibold shadow-sm'
                      : 'text-[#B5A493] hover:text-[#F0E6D8] hover:bg-[#594538]/35 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Auth button */}
          <div className="flex items-center gap-2">
            {token ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-[#594538]/50 text-[#F0E6D8] border border-[#594538]">
                  <User className="w-3.5 h-3.5 text-[#C47A35]" />
                  {user?.username || 'Operator'}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#B5A493] hover:text-[#FFA494] hover:bg-[#42201D]/40 border border-[#594538]/60 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/operator/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#C47A35] hover:bg-[#D48944] text-[#191817] transition-all shadow-md hover:shadow-amber"
              >
                <LogIn className="w-3.5 h-3.5" />
                Operator Portal
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden border-t border-[#594538]/60 bg-[#242321] px-2 py-1 justify-around text-xs">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center py-1.5 px-2 rounded-md transition-colors ${
                isActive ? 'text-[#C47A35] font-bold bg-[#C47A35]/15' : 'text-[#B5A493]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
