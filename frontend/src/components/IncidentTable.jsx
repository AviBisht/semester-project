import React, { useState } from 'react';
import PriorityBadge from './PriorityBadge';
import { ArrowUpDown, Filter, ChevronRight, Eye } from 'lucide-react';

export default function IncidentTable({
  incidents,
  selectedIncident,
  onSelectIncident,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
}) {
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  // Sorting
  const sortedIncidents = [...incidents].sort((a, b) => {
    if (sortField === 'priority_score') {
      return sortAsc
        ? a.priority_score - b.priority_score
        : b.priority_score - a.priority_score;
    }
    if (sortField === 'created_at') {
      return sortAsc
        ? new Date(a.created_at) - new Date(b.created_at)
        : new Date(b.created_at) - new Date(a.created_at);
    }
    return 0;
  });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-[#242321] border border-[#594538]/80 rounded-xl overflow-hidden shadow-card">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-[#594538]/70 bg-[#191817] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[#F0E6D8]">
            Incidents Queue
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#594538] text-[#F0E6D8] font-semibold">
            {incidents.length}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#C47A35]" />
            <span className="text-[#B5A493] font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#594538] bg-[#242321] px-2 py-1 text-xs text-[#F0E6D8] focus:outline-none focus:border-[#C47A35]"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[#B5A493] font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-[#594538] bg-[#242321] px-2 py-1 text-xs text-[#F0E6D8] focus:outline-none focus:border-[#C47A35]"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical (&gt;=60)</option>
              <option value="High">High (&gt;=40)</option>
              <option value="Medium">Medium (&gt;=25)</option>
              <option value="Low">Low (&lt;25)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Listing */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#B5A493]">
          <thead className="bg-[#1C1B1A] text-[#B5A493] font-semibold border-b border-[#594538]/70">
            <tr>
              <th className="py-2.5 px-3">Tracking ID</th>
              <th className="py-2.5 px-3">Type</th>
              <th
                onClick={() => toggleSort('priority_score')}
                className="py-2.5 px-3 cursor-pointer hover:bg-white/5 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3 text-[#B5A493]" />
                </div>
              </th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Assigned Responders</th>
              <th
                onClick={() => toggleSort('created_at')}
                className="py-2.5 px-3 cursor-pointer hover:bg-white/5 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Reported At</span>
                  <ArrowUpDown className="w-3 h-3 text-[#B5A493]" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#594538]/30">
            {sortedIncidents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#B5A493]/60 italic">
                  No incidents matching the active filter criteria.
                </td>
              </tr>
            ) : (
              sortedIncidents.map((incident) => {
                const isSelected = selectedIncident && selectedIncident.id === incident.id;
                return (
                  <tr
                    key={incident.id}
                    onClick={() => onSelectIncident(incident)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#3D2517]/50 border-l-4 border-l-[#C47A35] font-medium'
                        : 'hover:bg-[#2A2826]'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold font-mono text-[#C47A35]">
                      {incident.tracking_id}
                    </td>
                    <td className="py-3 px-3 font-medium text-[#F0E6D8]">
                      {incident.type}
                    </td>
                    <td className="py-3 px-3">
                      <PriorityBadge
                        level={incident.priority_level}
                        score={incident.priority_score}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                          incident.status === 'Resolved'
                            ? 'bg-[#233327] text-[#9CD4A8] border-[#3B5942]'
                            : incident.status === 'In Progress'
                            ? 'bg-[#3D2517] text-[#F5A962] border-[#7A4526]'
                            : incident.status === 'Assigned'
                            ? 'bg-[#2E241E] text-[#E6A265] border-[#594538]'
                            : incident.status === 'Rejected'
                            ? 'bg-[#42201D] text-[#FFA494] border-[#73352E]'
                            : 'bg-[#382D1D] text-[#EBC57A] border-[#6E542C]'
                        }`}
                      >
                        {incident.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {incident.assigned_resources && incident.assigned_resources.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {incident.assigned_resources.map((r, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-[#191817] text-[#F0E6D8] border border-[#594538]"
                            >
                              {r.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#B5A493]/60 italic text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#B5A493] whitespace-nowrap font-mono text-[11px]">
                      {new Date(incident.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectIncident(incident);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F0E6D8] hover:text-[#C47A35] bg-[#191817] hover:bg-[#594538]/50 border border-[#594538] px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Eye className="w-3 h-3 text-[#C47A35]" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
