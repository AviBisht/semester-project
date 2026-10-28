import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Radio, Search, Terminal, BarChart2, LogIn, LogOut, PlusCircle, Bell } from 'lucide-react';
import AlertNotificationDrawer from './AlertNotificationDrawer';
import { getSubscriberAlerts, getActivePublicAlerts } from '../api';
import { getStoredSubscriberToken } from '../utils/notifications';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem('operator_token');
  const userStr = localStorage.getItem('operator_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = async () => {
    const subToken = getStoredSubscriberToken();
    if (subToken) {
      try {
        const res = await getSubscriberAlerts(subToken);
        const unread = res.data?.filter((a) => !a.is_read)?.length || 0;
        setUnreadCount(unread);
      } catch (err) {
      }
    } else {
      try {
        const res = await getActivePublicAlerts();
        setUnreadCount(res.data?.length || 0);
      } catch (err) {
      }
    }
  };

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('operator_token');
    localStorage.removeItem('operator_user');
    navigate('/operator/login');
  };

  const navLinks = [
    { name: 'Incident Intake', path: '/', icon: PlusCircle, label: 'Intake' },
    { name: 'Public Tracking', path: '/track', icon: Search, label: 'Tracking' },
    { name: 'Command Console', path: '/operator/dashboard', icon: Terminal, label: 'Console' },
    { name: 'Intelligence', path: '/analytics', icon: BarChart2, label: 'Analytics' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FCFAF6] border-b border-[#DFD8C8] shrink-0">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#697C58] rounded-md">
            <div className="w-8 h-8 rounded-md bg-[#EEF2E6] border border-[#BAC7AF] flex items-center justify-center p-1.5 transition-colors group-hover:border-[#697C58] shrink-0" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className="w-full h-full">
                <path d="M24 4L42 12V24C42 34 34.5 41.5 24 44C13.5 41.5 6 34 6 24V12L24 4Z" fill="#F5F0E5" stroke="#697C58" strokeWidth="2.5" strokeLinejoin="round"/>
                <circle cx="24" cy="24" r="13" stroke="#C6CDAA" strokeWidth="1.5" strokeDasharray="2 3"/>
                <circle cx="24" cy="24" r="7" stroke="#697C58" strokeWidth="1.2" opacity="0.6"/>
                <line x1="24" y1="11" x2="24" y2="17" stroke="#697C58" strokeWidth="2" strokeLinecap="round"/>
                <line x1="24" y1="31" x2="24" y2="37" stroke="#697C58" strokeWidth="2" strokeLinecap="round"/>
                <line x1="11" y1="24" x2="17" y2="24" stroke="#697C58" strokeWidth="2" strokeLinecap="round"/>
                <line x1="31" y1="24" x2="37" y2="24" stroke="#697C58" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="24" cy="24" r="3.2" fill="#CF806B"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm tracking-tight text-[#343B30]">
                  DECTS
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EEF2E6] text-[#586348] border border-[#BAC7AF] font-bold uppercase tracking-wider">
                  Dehradun
                </span>
              </div>
              <span className="text-[10px] text-[#5A6354] font-mono uppercase tracking-wider block leading-none mt-0.5">
                Emergency Coordination
              </span>
            </div>
          </Link>

          <nav aria-label="Platform Sections" className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#697C58] ${
                    isActive
                      ? 'bg-[#EEF2E6] text-[#455239] font-bold border border-[#BAC7AF]'
                      : 'text-[#5A6354] hover:text-[#343B30] hover:bg-[#EFE9DC]/70 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#697C58]' : 'text-[#7C8775]'}`} aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-[#5A6354] border-r border-[#DFD8C8] pr-3 mr-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" aria-hidden="true" />
              <span>Grid Online</span>
            </div>

            <button
              type="button"
              onClick={() => setIsAlertDrawerOpen(true)}
              className="relative p-1.5 rounded-md text-[#5A6354] hover:text-[#343B30] hover:bg-[#EEF2E6] border border-[#DFD8C8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#697C58]"
              title="Nearby Emergency Alerts & Safety Notifications"
              aria-label="Nearby Emergency Alerts"
            >
              <Bell className="w-4 h-4 text-[#5A6354]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#DC2626] text-[9px] font-mono font-bold text-white shadow-sm animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {token ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-[#EEF2E6] text-[#343B30] border border-[#BAC7AF]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
                  <span className="font-mono font-medium text-[#343B30]">{user?.username || 'operator'}</span>
                  <span className="text-[10px] font-mono text-[#5A6354]">({user?.role || 'operator'})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium text-[#5A6354] hover:text-[#DC2626] hover:bg-[#FEF2F2] border border-[#DFD8C8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
                  title="Sign out of operator console"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/operator/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold bg-[#697C58] hover:bg-[#576748] text-[#F5F0E5] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#697C58]"
              >
                <LogIn className="w-3.5 h-3.5 text-[#F5F0E5]" aria-hidden="true" />
                <span>Operator Portal</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <nav aria-label="Mobile Navigation" className="flex md:hidden border-t border-[#DFD8C8] bg-[#FCFAF6] px-2 py-1.5 justify-around text-xs">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center py-1 px-3 rounded-md transition-colors ${
                isActive ? 'text-[#455239] font-bold bg-[#EEF2E6]' : 'text-[#5A6354]'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" aria-hidden="true" />
              <span className="text-[10px] font-mono">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <AlertNotificationDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        onUnreadCountChange={(count) => setUnreadCount(count)}
      />
    </header>
  );
}
