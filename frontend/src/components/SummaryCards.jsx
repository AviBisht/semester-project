import React from 'react';
import { AlertCircle, AlertOctagon, UserCheck, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SummaryCards({ stats, onFilterByStatus, onFilterByPriority }) {
  const metrics = [
    {
      label: 'Active Triage',
      value: stats.active ?? 0,
      icon: AlertCircle,
      iconColor: 'text-[#697C58]',
      sub: 'Reported / In Progress',
      onClick: () => onFilterByStatus && onFilterByStatus('Reported'),
    },
    {
      label: 'Critical Priority',
      value: stats.critical ?? 0,
      icon: AlertOctagon,
      iconColor: 'text-[#DC2626]',
      valueColor: stats.critical > 0 ? 'text-[#991B1B]' : 'text-[#343B30]',
      sub: 'Score ≥ 60 Urgency',
      onClick: () => onFilterByPriority && onFilterByPriority('Critical'),
    },
    {
      label: 'Units Dispatched',
      value: stats.assigned ?? 0,
      icon: UserCheck,
      iconColor: 'text-[#CF806B]',
      sub: 'Active Field Transit',
      onClick: () => onFilterByStatus && onFilterByStatus('Assigned'),
    },
    {
      label: 'Resolved Operations',
      value: stats.resolved ?? 0,
      icon: CheckCircle2,
      iconColor: 'text-[#16A34A]',
      sub: 'Concluded Tickets',
      onClick: () => onFilterByStatus && onFilterByStatus('Resolved'),
    },
    {
      label: 'Fleet Readiness',
      value: `${stats.availableTeams ?? 0}/${stats.totalTeams ?? 10}`,
      icon: ShieldCheck,
      iconColor: 'text-[#586348]',
      sub: 'Available / Registered',
      onClick: null,
    },
  ];

  return (
    <div
      aria-label="Dehradun Emergency Telemetry Strip"
      className="bg-[#FCFAF6] border border-[#DFD8C8] rounded-lg overflow-hidden mb-4"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#DFD8C8]">
        {metrics.map((item, idx) => {
          const Icon = item.icon;
          const isClickable = Boolean(item.onClick);

          return (
            <div
              key={idx}
              onClick={item.onClick || undefined}
              role={isClickable ? 'button' : 'region'}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={isClickable ? (e) => (e.key === 'Enter' || e.key === ' ') && item.onClick() : undefined}
              className={`px-4 py-3 flex flex-col justify-between transition-colors ${
                isClickable
                  ? 'cursor-pointer hover:bg-[#EEF2E6]/60 focus:outline-none focus-visible:bg-[#EEF2E6] focus-visible:ring-1 focus-visible:ring-[#697C58]'
                  : ''
              } ${idx === 4 ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6354] font-semibold truncate">
                  {item.label}
                </span>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${item.iconColor}`} aria-hidden="true" />
              </div>

              <div className="my-1">
                <span className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight block ${item.valueColor || 'text-[#343B30]'}`}>
                  {item.value}
                </span>
              </div>

              <span className="text-[11px] font-mono text-[#7C8775] truncate block mt-0.5">
                {item.sub}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

