import React from 'react';
import { AlertCircle, AlertOctagon, UserCheck, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SummaryCards({ stats, onFilterByStatus, onFilterByPriority }) {
  const cards = [
    {
      title: 'Active Incidents',
      count: stats.active ?? 0,
      icon: AlertCircle,
      iconColor: 'text-[#697C58]',
      accentBorder: 'border-l-4 border-l-[#697C58]',
      sub: 'Pending / In Progress',
      onClick: () => onFilterByStatus && onFilterByStatus('Reported'),
    },
    {
      title: 'Critical Priority',
      count: stats.critical ?? 0,
      icon: AlertOctagon,
      iconColor: 'text-[#DC2626]',
      accentBorder: 'border-l-4 border-l-[#DC2626]',
      sub: 'Score ≥ 60 triage',
      onClick: () => onFilterByPriority && onFilterByPriority('Critical'),
    },
    {
      title: 'Units Dispatched',
      count: stats.assigned ?? 0,
      icon: UserCheck,
      iconColor: 'text-[#CF806B]',
      accentBorder: 'border-l-4 border-l-[#CF806B]',
      sub: 'Assigned / In Transit',
      onClick: () => onFilterByStatus && onFilterByStatus('Assigned'),
    },
    {
      title: 'Resolved Cases',
      count: stats.resolved ?? 0,
      icon: CheckCircle2,
      iconColor: 'text-[#16A34A]',
      accentBorder: 'border-l-4 border-l-[#16A34A]',
      sub: 'Closed incidents',
      onClick: () => onFilterByStatus && onFilterByStatus('Resolved'),
    },
    {
      title: 'Available Response Teams',
      count: `${stats.availableTeams ?? 0} / ${stats.totalTeams ?? 10}`,
      icon: ShieldCheck,
      iconColor: 'text-[#697C58]',
      accentBorder: 'border-l-4 border-l-[#BAC7AF]',
      sub: 'Ready for dispatch',
      onClick: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isClickable = Boolean(card.onClick);

        return (
          <div
            key={idx}
            onClick={card.onClick || undefined}
            role={isClickable ? 'button' : 'region'}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={isClickable ? (e) => (e.key === 'Enter' || e.key === ' ') && card.onClick() : undefined}
            className={`p-3.5 rounded-xl bg-[#FCFAF6] border border-[#DFD8C8] ${card.accentBorder} transition-all shadow-card ${
              isClickable
                ? 'cursor-pointer hover:bg-[#EEF2E6] hover:border-[#BAC7AF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#697C58]'
                : ''
            } ${idx === 4 ? 'col-span-2 lg:col-span-1' : ''}`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono font-semibold text-[#5A6354] uppercase tracking-wider truncate">
                {card.title}
              </span>
              <Icon className={`w-4 h-4 shrink-0 ${card.iconColor}`} />
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[#343B30] tracking-tight">
                {card.count}
              </span>
            </div>

            <span className="text-[11px] text-[#7C8775] mt-0.5 block truncate">
              {card.sub}
            </span>
          </div>
        );
      })}
    </div>
  );
}
