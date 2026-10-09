import React from 'react';

export default function PriorityBadge({ level, score }) {
  const styles = {
    Critical: 'bg-[#42201D] text-[#FFA494] border-[#73352E]',
    High: 'bg-[#3D2517] text-[#F5A962] border-[#7A4526]',
    Medium: 'bg-[#382D1D] text-[#EBC57A] border-[#6E542C]',
    Low: 'bg-[#233327] text-[#9CD4A8] border-[#3B5942]',
  };

  const currentStyle = styles[level] || 'bg-[#242321] text-[#B5A493] border-[#594538]';

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
