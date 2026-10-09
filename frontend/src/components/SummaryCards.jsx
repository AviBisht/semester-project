import React from 'react';
import { AlertCircle, AlertOctagon, UserCheck, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SummaryCards({ stats, onFilterByStatus, onFilterByPriority }) {
  const cards = [
    {
      title: 'Active Incidents',
      count: stats.active ?? 0,
      icon: AlertCircle,
      bg: 'bg-[#242321]',
      border: 'border-[#594538]/80',
      badgeColor: 'text-[#C47A35]',
      sub: 'Require attention',
      onClick: () => onFilterByStatus && onFilterByStatus('Reported'),
    },
    {
      title: 'Critical Priority',
      count: stats.critical ?? 0,
      icon: AlertOctagon,
      bg: 'bg-[#242321]',
      border: 'border-[#73352E]/80',
      badgeColor: 'text-[#FFA494]',
      sub: 'Score >= 60',
      onClick: () => onFilterByPriority && onFilterByPriority('Critical'),
    },
    {
      title: 'Assigned / In Progress',
      count: stats.assigned ?? 0,
      icon: UserCheck,
      bg: 'bg-[#242321]',
      border: 'border-[#594538]/80',
      badgeColor: 'text-[#E6A265]',
      sub: 'Teams deployed',
      onClick: () => onFilterByStatus && onFilterByStatus('Assigned'),
    },
    {
      title: 'Resolved Cases',
      count: stats.resolved ?? 0,
      icon: CheckCircle2,
      bg: 'bg-[#242321]',
      border: 'border-[#594538]/80',
      badgeColor: 'text-[#9CD4A8]',
      sub: 'Successfully closed',
      onClick: () => onFilterByStatus && onFilterByStatus('Resolved'),
    },
    {
      title: 'Available Teams',
      count: `${stats.availableTeams ?? 0} / ${stats.totalTeams ?? 10}`,
      icon: ShieldCheck,
      bg: 'bg-[#242321]',
      border: 'border-[#594538]/80',
      badgeColor: 'text-[#B5A493]',
      sub: 'Ready for dispatch',
      onClick: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={card.onClick || undefined}
            className={`p-4 rounded-xl border ${card.bg} ${card.border} transition-all duration-200 shadow-card ${
              card.onClick ? 'cursor-pointer hover:border-[#C47A35] hover:bg-[#2A2826] hover:-translate-y-0.5' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#B5A493] truncate">
                {card.title}
              </span>
              <Icon className={`w-4 h-4 ${card.badgeColor}`} />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-[#F0E6D8]">
                {card.count}
              </span>
            </div>
            <span className="text-[11px] text-[#B5A493]/70 font-medium mt-1 block">
              {card.sub}
            </span>
          </div>
        );
      })}
    </div>
  );
}
