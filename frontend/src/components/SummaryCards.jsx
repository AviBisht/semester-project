import React from 'react';
import { AlertCircle, AlertOctagon, UserCheck, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SummaryCards({ stats, onFilterByStatus, onFilterByPriority }) {
  const cards = [
    {
      title: 'Active Incidents',
      count: stats.active ?? 0,
      icon: AlertCircle,
      bg: 'bg-[#FFF9F0]',
      border: 'border-[#F0E6D8]',
      badgeColor: 'text-[#8C5E24]',
      sub: 'Require attention',
      onClick: () => onFilterByStatus && onFilterByStatus('Reported'),
    },
    {
      title: 'Critical Priority',
      count: stats.critical ?? 0,
      icon: AlertOctagon,
      bg: 'bg-[#FDF2F4]',
      border: 'border-[#F2C6CF]',
      badgeColor: 'text-[#6B2B3A]',
      sub: 'Score >= 60',
      onClick: () => onFilterByPriority && onFilterByPriority('Critical'),
    },
    {
      title: 'Assigned / In Progress',
      count: stats.assigned ?? 0,
      icon: UserCheck,
      bg: 'bg-[#F0F6FA]',
      border: 'border-[#A9CCE3]',
      badgeColor: 'text-[#1F3A4D]',
      sub: 'Teams deployed',
      onClick: () => onFilterByStatus && onFilterByStatus('Assigned'),
    },
    {
      title: 'Resolved Cases',
      count: stats.resolved ?? 0,
      icon: CheckCircle2,
      bg: 'bg-[#F2F7F4]',
      border: 'border-[#B8D8C4]',
      badgeColor: 'text-[#234A35]',
      sub: 'Successfully closed',
      onClick: () => onFilterByStatus && onFilterByStatus('Resolved'),
    },
    {
      title: 'Available Teams',
      count: `${stats.availableTeams ?? 0} / ${stats.totalTeams ?? 10}`,
      icon: ShieldCheck,
      bg: 'bg-[#FFFFFF]',
      border: 'border-[#E8E2D9]',
      badgeColor: 'text-[#1F3A4D]',
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
            className={`p-4 rounded-xl border ${card.bg} ${card.border} transition-all duration-200 ${
              card.onClick ? 'cursor-pointer hover:shadow-card hover:-translate-y-0.5' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 truncate">
                {card.title}
              </span>
              <Icon className={`w-4 h-4 ${card.badgeColor}`} />
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-[#1F3A4D]">
                {card.count}
              </span>
            </div>
            <span className="text-[11px] text-gray-500 font-medium mt-1 block">
              {card.sub}
            </span>
          </div>
        );
      })}
    </div>
  );
}
