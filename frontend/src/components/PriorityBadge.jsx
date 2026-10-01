import React from 'react';

export default function PriorityBadge({ level, score }) {
  const styles = {
    Critical: 'bg-[#F8D7DA] text-[#842029] border-[#F5C2C7]',
    High: 'bg-[#FCE4D6] text-[#A65319] border-[#F8CCA8]',
    Medium: 'bg-[#FFF2CD] text-[#7A6400] border-[#FFE69C]',
    Low: 'bg-[#D1E7DD] text-[#0F5132] border-[#BADBCC]',
  };

  const currentStyle = styles[level] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {level}
      {score !== undefined && (
        <span className="opacity-75 font-normal">({score})</span>
      )}
    </span>
  );
}
