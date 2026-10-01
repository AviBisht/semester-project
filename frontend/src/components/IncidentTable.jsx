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
    <div className="bg-[#FFFFFF] border border-[#E8E2D9] rounded-xl overflow-hidden shadow-soft">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-[#E8E2D9] bg-[#FAF7F2]/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[#1F3A4D]">
            Incidents Queue
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200/70 text-gray-700 font-semibold">
            {incidents.length}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-gray-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#E8E2D9] bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#A9CCE3]"
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
            <span className="text-gray-500 font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-[#E8E2D9] bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#A9CCE3]"
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
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-[#FAF7F2] text-[#1F3A4D] font-semibold border-b border-[#E8E2D9]">
            <tr>
              <th className="py-2.5 px-3">Tracking ID</th>
              <th className="py-2.5 px-3">Type</th>
              <th
                onClick={() => toggleSort('priority_score')}
                className="py-2.5 px-3 cursor-pointer hover:bg-black/5 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Assigned Responders</th>
              <th
                onClick={() => toggleSort('created_at')}
                className="py-2.5 px-3 cursor-pointer hover:bg-black/5 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Reported At</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E2D9]">
            {sortedIncidents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400 italic">
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
                        ? 'bg-[#A9CCE3]/20 font-medium'
                        : 'hover:bg-[#FAF7F2]/80'
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-[#1F3A4D]">
                      {incident.tracking_id}
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-800">
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
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          incident.status === 'Resolved'
                            ? 'bg-[#B8D8C4]/50 text-[#234A35]'
                            : incident.status === 'In Progress'
                            ? 'bg-[#A9CCE3]/50 text-[#1F3A4D]'
                            : incident.status === 'Assigned'
                            ? 'bg-blue-50 text-blue-700'
                            : incident.status === 'Rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-800'
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
                              className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200"
                            >
                              {r.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
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
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F3A4D] hover:text-sky-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                      >
                        <Eye className="w-3 h-3" />
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
