import React, { useState } from 'react';
import PriorityBadge from './PriorityBadge';
import { ArrowUpDown, Clock } from 'lucide-react';

export default function IncidentTable({
  incidents,
  selectedIncident,
  onSelectIncident,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('created_at');

  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.tracking_id.toLowerCase().includes(q) ||
      inc.type.toLowerCase().includes(q) ||
      inc.description.toLowerCase().includes(q)
    );
  });

  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    if (sortField === 'priority_score') {
      return b.priority_score - a.priority_score;
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return 'text-[#166534] bg-[#F0FDF4] border-[#DCFCE7]';
      case 'In Progress':
        return 'text-[#9A3412] bg-[#FFF7ED] border-[#FFEDD5]';
      case 'Assigned':
        return 'text-[#434D37] bg-[#EEF2E6] border-[#B2BCA0]';
      case 'Rejected':
        return 'text-[#991B1B] bg-[#FEF2F2] border-[#FECACA]';
      default:
        return 'text-[#92400E] bg-[#FFFBEB] border-[#FEF3C7]';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FCFAF6] border-r border-[#DFD8C8]">
      {/* Feed Control Masthead */}
      <div className="p-3 border-b border-[#DFD8C8] bg-[#EFE9DC] space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#343B30]">
              Triage Feed
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#DFD8C8] text-[#343B30] font-semibold">
              {incidents.length}
            </span>
          </div>

          <button
            onClick={() => {
              setSortField(sortField === 'priority_score' ? 'created_at' : 'priority_score');
            }}
            className="text-[10px] font-mono text-[#5A6354] hover:text-[#697C58] flex items-center gap-1 transition-colors"
            title="Toggle sort priority"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>Sort: {sortField === 'priority_score' ? 'Score' : 'Recent'}</span>
          </button>
        </div>

        {/* Search input */}
        <input
          type="text"
          placeholder="Filter tracking ID, category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs rounded-lg bg-[#FFFFFF] border border-[#DFD8C8] px-2.5 py-1.5 text-[#343B30] placeholder-[#7C8775] focus:outline-none focus:border-[#697C58]"
        />

        {/* Quick filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono pb-0.5">
          {['All', 'Reported', 'Assigned', 'Resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-0.5 rounded-md transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#EEF2E6] text-[#697C58] font-bold border border-[#BAC7AF]'
                  : 'text-[#5A6354] hover:text-[#343B30] hover:bg-[#E5DFD0]'
              }`}
            >
              {st}
            </button>
          ))}
          <div className="h-3 w-px bg-[#DFD8C8] mx-0.5" />
          {['All', 'Critical'].map((pr) => (
            <button
              key={pr}
              onClick={() => setPriorityFilter(pr)}
              className={`px-2 py-0.5 rounded-md transition-all whitespace-nowrap ${
                priorityFilter === pr
                  ? 'bg-[#FEF2F2] text-[#991B1B] font-bold border border-[#FECACA]'
                  : 'text-[#5A6354] hover:text-[#343B30]'
              }`}
            >
              {pr === 'Critical' ? 'Crit Only' : 'All Tiers'}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#DFD8C8]">
        {sortedIncidents.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#7C8775] italic">
            No incidents found matching active filters.
          </div>
        ) : (
          sortedIncidents.map((incident) => {
            const isSelected = selectedIncident && selectedIncident.id === incident.id;
            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className={`p-3 cursor-pointer transition-all border-l-4 ${
                  isSelected
                    ? 'bg-[#EEF2E6] border-l-[#697C58]'
                    : 'border-l-transparent hover:bg-[#F5F0E5]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-[#343B30]">
                      {incident.tracking_id}
                    </span>
                    <PriorityBadge level={incident.priority_level} score={incident.priority_score} />
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border ${getStatusBadge(
                      incident.status
                    )}`}
                  >
                    {incident.status}
                  </span>
                </div>

                <div className="font-semibold text-xs text-[#343B30] truncate">
                  {incident.type}
                </div>

                <p className="text-[11px] text-[#5A6354] line-clamp-1 mt-0.5 leading-snug">
                  {incident.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-[#5A6354] font-mono mt-1.5 pt-1 border-t border-[#DFD8C8]/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-[#7C8775]" />
                    {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>
                    {incident.assigned_resources?.length > 0 ? (
                      <span className="text-[#697C58] font-medium">{incident.assigned_resources.length} unit(s) deployed</span>
                    ) : (
                      'Unassigned'
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
