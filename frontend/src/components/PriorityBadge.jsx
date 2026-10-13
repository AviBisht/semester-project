import React from 'react';

export default function PriorityBadge({ level, score }) {
  const styles = {
    Critical: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
    High: 'bg-[#FFF7ED] text-[#9A3412] border-[#FFEDD5]',
    Medium: 'bg-[#FFFBEB] text-[#92400E] border-[#FEF3C7]',
    Low: 'bg-[#F0FDF4] text-[#166534] border-[#DCFCE7]',
  };

  const dotColors = {
    Critical: 'bg-[#DC2626]',
    High: 'bg-[#EA580C]',
    Medium: 'bg-[#D97706]',
    Low: 'bg-[#16A34A]',
  };

  const currentStyle = styles[level] || 'bg-[#EFE9DC] text-[#5A6354] border-[#DFD8C8]';
  const currentDot = dotColors[level] || 'bg-[#7C8775]';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${currentStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${currentDot}`} />
      <span>{level}</span>
      {score !== undefined && (
        <span className="opacity-80 border-l border-current/25 pl-1.5 ml-0.5">
          {score}
        </span>
      )}
    </span>
  );
}
