import React, { useState } from 'react';
import PriorityBadge from './PriorityBadge';
import { API_BASE_URL } from '../api';
import {
  X,
  MapPin,
  Clock,
  Users,
  Shield,
  AlertTriangle,
  Flame,
  HeartPulse,
  LifeBuoy,
  Radio,
} from 'lucide-react';

export default function IncidentDetailPanel({
  incident,
  teams = [],
  onClose,
  onUpdateStatus,
  onAssignTeam,
  isLoadingAction
}) {
  const [comment, setComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const statusOptions = ['Reported', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];

  const getTeamIcon = (type) => {
    if (type === 'ambulance') return <HeartPulse className="w-3.5 h-3.5 text-[#16A34A]" />;
    if (type === 'fire unit') return <Flame className="w-3.5 h-3.5 text-[#EA580C]" />;
    return <LifeBuoy className="w-3.5 h-3.5 text-[#697C58]" />;
  };

  // If NO incident selected: Show District Fleet Readiness Monitor!
  if (!incident) {
    const availableCount = teams.filter((t) => t.status === 'Available').length;
    return (
      <div className="flex flex-col h-full bg-[#FCFAF6] border-l border-[#DFD8C8] overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-[#DFD8C8] bg-[#EFE9DC] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#16A34A]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#343B30]">
              District Fleet Readiness
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#EEF2E6] text-[#343B30] border border-[#B2BCA0] font-semibold">
            {availableCount} / {teams.length} Ready
          </span>
        </div>

        {/* Guidance Notice */}
        <div className="p-3 bg-[#FCFAF6] border-b border-[#DFD8C8] text-xs text-[#5A6354] leading-relaxed">
          <p>
            Select any incident from the <strong className="text-[#343B30]">Triage Feed</strong> or the <strong className="text-[#343B30]">Map</strong> to view Haversine unit recommendations and dispatch controls.
          </p>
        </div>

        {/* Fleet listing */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <span className="text-[10px] font-mono text-[#5A6354] uppercase tracking-wider block mb-1">
            Registered Dehradun Response Units ({teams.length})
          </span>
          {teams.map((team) => (
            <div
              key={team.id}
              className="p-2.5 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8] flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-[#FFFFFF] border border-[#DFD8C8]">
                  {getTeamIcon(team.type)}
                </div>
                <div>
                  <span className="font-semibold text-xs text-[#343B30] block leading-tight">{team.name}</span>
                  <span className="text-[10px] text-[#5A6354] capitalize">{team.type} &bull; {team.contact_number}</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium ${
                  team.status === 'Available'
                    ? 'bg-[#F0FDF4] text-[#166534] border-[#DCFCE7]'
                    : team.status === 'Assigned'
                    ? 'bg-[#FFF7ED] text-[#9A3412] border-[#FFEDD5]'
                    : 'bg-[#EFE9DC] text-[#5A6354] border-[#DFD8C8]'
                }`}
              >
                {team.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const breakdown = incident.score_breakdown || {};

  const handleStatusChangeSubmit = (e) => {
    e.preventDefault();
    if (!selectedStatus) return;
    onUpdateStatus(incident.id, selectedStatus, comment);
    setComment('');
    setSelectedStatus('');
  };

  return (
    <div className="flex flex-col h-full bg-[#FCFAF6] border-l border-[#DFD8C8] overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-[#DFD8C8] bg-[#EFE9DC] flex items-start justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-[#697C58]">
              {incident.tracking_id}
            </span>
            <PriorityBadge level={incident.priority_level} score={incident.priority_score} />
          </div>
          <h3 className="font-bold text-[#343B30] text-xs mt-1">
            {incident.type}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#5A6354] hover:text-[#343B30] hover:bg-[#DFD8C8] transition-colors"
          title="Close incident panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs">
        {/* Road Blockage Warning (if within 500m) */}
        {incident.nearby_blockages && incident.nearby_blockages.length > 0 && (
          <div className="p-2.5 rounded-lg bg-[#FFF7ED] border border-[#FFEDD5] text-[#9A3412]">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
              <div>
                <span className="font-mono font-bold text-[10px] uppercase text-[#9A3412] block">
                  Transit Hazard Warning
                </span>
                <p className="text-[11px] text-[#7C2D12] mt-0.5 leading-tight">
                  Within 500m of blockage ({incident.nearby_blockages.map((b) => `${b.tracking_id}`).join(', ')}). Reroute incoming responders.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Citizen Description */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6354] block mb-1 font-semibold">
            Citizen Situation Log
          </span>
          <p className="text-[#343B30] bg-[#FCFAF6] p-2.5 rounded-lg border border-[#DFD8C8] leading-relaxed text-xs">
            {incident.description}
          </p>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8] flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[#697C58]" />
            <div>
              <span className="text-[#5A6354] text-[10px] block font-mono">People Affected</span>
              <span className="font-mono font-bold text-[#343B30]">{incident.people_affected}</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8] flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#CF806B]" />
            <div>
              <span className="text-[#5A6354] text-[10px] block font-mono">Vulnerable Group</span>
              <span className="font-bold text-[#343B30]">{incident.vulnerable_involved ? 'Yes (+15)' : 'No'}</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8] flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#697C58]" />
            <div>
              <span className="text-[#5A6354] text-[10px] block font-mono">Coordinates</span>
              <span className="font-mono text-[10px] text-[#343B30]">{incident.latitude?.toFixed(4)}, {incident.longitude?.toFixed(4)}</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#7C8775]" />
            <div>
              <span className="text-[#5A6354] text-[10px] block font-mono">Status</span>
              <span className="font-bold text-[#343B30]">{incident.status}</span>
            </div>
          </div>
        </div>

        {/* Photo attachment if available */}
        {incident.photo_url && (
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6354] block mb-1 font-semibold">
              Attached Citizen Evidence
            </span>
            <a
              href={`${API_BASE_URL}${incident.photo_url}`}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-lg border border-[#DFD8C8] max-h-36 bg-[#EFE9DC]"
            >
              <img
                src={`${API_BASE_URL}${incident.photo_url}`}
                alt="Site photo"
                className="w-full h-32 object-cover hover:scale-105 transition-transform"
              />
            </a>
          </div>
        )}

        {/* Priority Formula Calculation Breakdown */}
        <div className="p-2.5 rounded-lg bg-[#EFE9DC] border border-[#DFD8C8]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6354] font-semibold">
              Priority Formula Breakdown
            </span>
            <span className="font-mono text-[10px] font-bold text-[#697C58]">
              {incident.priority_score} pts
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px] text-[#5A6354]">
            <div className="flex justify-between py-0.5 border-b border-[#DFD8C8]">
              <span>Severity ({breakdown.severity_input || incident.severity} &times; 10)</span>
              <span className="text-[#343B30]">+{breakdown.severity_score ?? (incident.severity * 10)}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#DFD8C8]">
              <span>People Affected</span>
              <span className="text-[#343B30]">+{breakdown.people_score ?? Math.min(incident.people_affected, 20)}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#DFD8C8]">
              <span>Vulnerable Factor</span>
              <span className="text-[#343B30]">+{breakdown.vulnerable_score ?? (incident.vulnerable_involved ? 15 : 0)}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#DFD8C8]">
              <span>Type Weight ({incident.type})</span>
              <span className="text-[#343B30]">+{breakdown.type_score ?? 2}</span>
            </div>
          </div>
        </div>

        {/* Nearest Suitable Response Units (Haversine Distance) */}
        {incident.status !== 'Resolved' && incident.status !== 'Rejected' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6354] font-semibold">
                Nearest Available ({incident.suitable_type})
              </span>
              <span className="text-[10px] font-mono text-[#697C58] font-bold">Haversine GIS</span>
            </div>

            {incident.nearest_available_teams && incident.nearest_available_teams.length > 0 ? (
              <div className="space-y-1.5">
                {incident.nearest_available_teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-2 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8] hover:border-[#697C58] transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-[#FFFFFF] border border-[#DFD8C8]">
                        {getTeamIcon(team.type)}
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-[#343B30] block leading-tight">{team.name}</span>
                        <span className="text-[10px] text-[#697C58] font-mono font-medium">{team.distance_km} km away</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onAssignTeam(incident.id, team.id)}
                      disabled={isLoadingAction}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#697C58] hover:bg-[#576748] text-white transition-colors shrink-0 disabled:opacity-50 shadow-xs"
                    >
                      Dispatch
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#5A6354] italic p-2 bg-[#FCFAF6] rounded-lg border border-[#DFD8C8]">
                No available {incident.suitable_type} units in range.
              </p>
            )}
          </div>
        )}

        {/* Assigned Units */}
        {incident.assigned_resources && incident.assigned_resources.length > 0 && (
          <div className="p-2.5 rounded-lg bg-[#EFE9DC] border border-[#DFD8C8]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6354] block mb-1.5 font-semibold">
              Assigned Emergency Units ({incident.assigned_resources.length})
            </span>
            <div className="space-y-1">
              {incident.assigned_resources.map((res) => (
                <div key={res.id} className="flex items-center justify-between p-1.5 rounded-md bg-[#FCFAF6] border border-[#DFD8C8] text-xs">
                  <div className="flex items-center gap-1.5">
                    {getTeamIcon(res.type)}
                    <span className="font-semibold text-[#343B30] text-xs">{res.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#EEF2E6] text-[#343B30] border border-[#B2BCA0] font-medium">
                    Deployed
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transition Status Form */}
        <div className="p-2.5 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6354] block mb-1.5 font-semibold">
            Commit Status Transition
          </span>
          <form onSubmit={handleStatusChangeSubmit} className="space-y-2">
            <div className="flex gap-1.5">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 text-xs rounded-lg border border-[#DFD8C8] p-1.5 bg-[#FFFFFF] text-[#343B30] focus:outline-none focus:border-[#697C58]"
              >
                <option value="">Next Status...</option>
                {statusOptions.map((st) => (
                  <option key={st} value={st} disabled={st === incident.status}>
                    {st} {st === incident.status ? '(Current)' : ''}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!selectedStatus || isLoadingAction}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#697C58] hover:bg-[#576748] text-white transition-colors disabled:opacity-50 shadow-xs"
              >
                Commit
              </button>
            </div>
            <input
              type="text"
              placeholder="Operational action notes..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#DFD8C8] p-1.5 bg-[#FFFFFF] text-[#343B30] placeholder-[#7C8775] focus:outline-none focus:border-[#697C58]"
            />
          </form>
        </div>

        {/* Audit Log */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6354] block mb-2 font-semibold">
            Dispatch Audit Log
          </span>
          <div className="relative pl-3.5 border-l border-[#DFD8C8] space-y-2">
            {incident.updates && incident.updates.length > 0 ? (
              incident.updates.map((update) => (
                <div key={update.id} className="relative">
                  <div className="absolute -left-[18px] top-1 w-2 h-2 rounded-full bg-[#697C58]" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-[#343B30]">{update.new_status}</span>
                      <span className="text-[10px] font-mono text-[#5A6354]">
                        {new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {update.comment && (
                      <p className="text-[11px] text-[#5A6354]">{update.comment}</p>
                    )}
                    <span className="text-[10px] text-[#7C8775] font-mono">By: {update.changed_by}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#7C8775] italic">No audit records.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
