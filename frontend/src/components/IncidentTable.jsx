import React, { useState } from 'react';
import PriorityBadge from './PriorityBadge';
import { ArrowUpDown, Clock, Users, ShieldAlert, AlertCircle } from 'lucide-react';

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

  const formatIncidentAge = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diffMs = new Date() - new Date(timestamp);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return '< 1m ago';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return 'text-[#166534] bg-[#DCFCE7] border-[#86EFAC]';
      case 'In Progress':
        return 'text-[#9A3412] bg-[#FFEDD5] border-[#FDBA74]';
      case 'Assigned':
        return 'text-[#343B30] bg-[#EFE9DC] border-[#B2BCA0]';
      case 'Rejected':
        return 'text-[#991B1B] bg-[#FEE2E2] border-[#FCA5A5]';
      default:
        return 'text-[#854D0E] bg-[#FEF3C7] border-[#FCD34D]';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FCFAF6] border-r border-[#DFD8C8]">
      <div className="p-3 border-b border-[#DFD8C8] bg-[#EFE9DC]/70 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#343B30]">
              Operational Queue
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#343B30] text-[#F5F0E5] font-bold">
              {filteredIncidents.length}
            </span>
          </div>

          <button
            onClick={() => {
              setSortField(sortField === 'priority_score' ? 'created_at' : 'priority_score');
            }}
            className="text-[10px] font-mono text-[#5A6354] hover:text-[#343B30] flex items-center gap-1 transition-colors px-2 py-1 rounded border border-[#DFD8C8] bg-[#FCFAF6]"
            title="Toggle sort order between priority score and timestamp"
          >
            <ArrowUpDown className="w-3 h-3 text-[#697C58]" aria-hidden="true" />
            <span>Sort: {sortField === 'priority_score' ? 'Score ↓' : 'Recent ↓'}</span>
          </button>
        </div>

        <div>
          <label htmlFor="triage-search" className="sr-only">
            Search incidents by tracking ID, type, or description
          </label>
          <input
            id="triage-search"
            type="text"
            placeholder="Search tracking ID, type, locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-mono rounded bg-[#FFFFFF] border border-[#DFD8C8] px-2.5 py-1.5 text-[#343B30] placeholder-[#7C8775] focus:outline-none focus:border-[#697C58] focus:ring-1 focus:ring-[#697C58]"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono pb-0.5" role="toolbar" aria-label="Incident Filters">
          {['All', 'Reported', 'Assigned', 'Resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#343B30] text-[#F5F0E5] font-bold'
                  : 'text-[#5A6354] hover:text-[#343B30] hover:bg-[#DFD8C8]/50'
              }`}
            >
              {st}
            </button>
          ))}
          <div className="h-3 w-px bg-[#DFD8C8] mx-0.5" aria-hidden="true" />
          {['All', 'Critical'].map((pr) => (
            <button
              key={pr}
              onClick={() => setPriorityFilter(pr)}
              className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                priorityFilter === pr
                  ? 'bg-[#DC2626] text-white font-bold'
                  : 'text-[#5A6354] hover:text-[#343B30] hover:bg-[#DFD8C8]/50'
              }`}
            >
              {pr === 'Critical' ? 'Critical Only' : 'All Tiers'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[#DFD8C8]">
        {sortedIncidents.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[#7C8775] italic">
            No incidents found matching active triage filter.
          </div>
        ) : (
          sortedIncidents.map((incident) => {
            const isSelected = selectedIncident && selectedIncident.id === incident.id;
            const isCritical = incident.priority_level === 'Critical';

            return (
              <div
                key={incident.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectIncident(incident)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectIncident(incident)}
                className={`p-3 cursor-pointer transition-all border-l-[5px] focus:outline-none ${
                  isSelected
                    ? 'bg-[#EEF2E6] border-l-[#697C58]'
                    : isCritical
                    ? 'bg-[#FEF2F2] border-l-[#DC2626] hover:bg-[#FEE2E2]'
                    : 'bg-[#FCFAF6] border-l-transparent hover:bg-[#F5F0E5]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-[#343B30]">
                      {incident.tracking_id}
                    </span>
                    <PriorityBadge level={incident.priority_level} score={incident.priority_score} />
                    {isCritical && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded-xs bg-[#DC2626] text-white text-[9px] font-mono font-bold uppercase tracking-wider animate-pulse">
                        <AlertCircle className="w-2.5 h-2.5" /> URGENT
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border font-bold uppercase ${getStatusBadge(
                      incident.status
                    )}`}
                  >
                    {incident.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-[#343B30] truncate">
                    {incident.type}
                  </span>
                  <span className="text-[10px] font-mono text-[#697C58] shrink-0 font-medium ml-2">
                    {incident.latitude ? `${incident.latitude.toFixed(2)}°N, ${incident.longitude.toFixed(2)}°E` : ''}
                  </span>
                </div>

                <p className="text-[11px] text-[#5A6354] line-clamp-1 leading-snug">
                  {incident.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-[#7C8775] font-mono mt-2 pt-1 border-t border-[#DFD8C8]/60">
                  <span className="flex items-center gap-1 text-[#5A6354]">
                    <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                    {formatIncidentAge(incident.created_at)}
                  </span>

                  <div className="flex items-center gap-2">
                    {incident.people_affected > 0 && (
                      <span className="flex items-center gap-0.5 text-[#343B30]" title="Impacted civilians">
                        <Users className="w-2.5 h-2.5 text-[#7C8775]" />
                        {incident.people_affected}
                      </span>
                    )}
                    {incident.vulnerable_involved && (
                      <span className="text-[#DC2626] font-bold" title="Children/Elderly involved">
                        VULN
                      </span>
                    )}
                    <span>
                      {incident.assigned_resources?.length > 0 ? (
                        <span className="text-[#697C58] font-bold">{incident.assigned_resources.length} deployed</span>
                      ) : (
                        <span className="text-[#9A3412] font-semibold">Pending Unit</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
