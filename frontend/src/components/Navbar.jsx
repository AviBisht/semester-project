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
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#A9CCE3] flex items-center justify-center text-[#1F3A4D] font-bold shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[#1F3A4D] block leading-tight">
                CrisisResponse Dehradun
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                Emergency & Flood Management
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#A9CCE3]/35 text-[#1F3A4D] font-semibold'
                      : 'text-gray-600 hover:text-[#1F3A4D] hover:bg-gray-100/70'
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
                <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-[#B8D8C4]/40 text-[#234A35] border border-[#B8D8C4]">
                  <User className="w-3.5 h-3.5" />
                  {user?.username || 'Operator'}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:text-red-700 hover:bg-red-50 border border-[#E8E2D9] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/operator/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#A9CCE3] hover:bg-[#8FBBD9] text-[#1F3A4D] transition-colors shadow-soft"
              >
                <LogIn className="w-3.5 h-3.5" />
                Operator Portal
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden border-t border-[#E8E2D9] bg-[#FAF7F2] px-2 py-1 justify-around text-xs">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center py-1 px-2 rounded ${
                isActive ? 'text-[#1F3A4D] font-bold' : 'text-gray-500'
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
