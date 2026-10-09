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
  Send,
  CheckCircle,
  Truck,
  Flame,
  HeartPulse,
  LifeBuoy,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function IncidentDetailPanel({
  incident,
  onClose,
  onUpdateStatus,
  onAssignTeam,
  isLoadingAction
}) {
  const [comment, setComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  if (!incident) return null;

  const breakdown = incident.score_breakdown || {};
  const statusOptions = ['Reported', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];

  const handleStatusChangeSubmit = (e) => {
    e.preventDefault();
    if (!selectedStatus) return;
    onUpdateStatus(incident.id, selectedStatus, comment);
    setComment('');
    setSelectedStatus('');
  };

  const getTeamIcon = (type) => {
    if (type === 'ambulance') return <HeartPulse className="w-4 h-4 text-emerald-600" />;
    if (type === 'fire unit') return <Flame className="w-4 h-4 text-orange-600" />;
    return <LifeBuoy className="w-4 h-4 text-sky-600" />;
  };

  return (
    <div className="bg-[#242321] border border-[#594538] rounded-xl flex flex-col h-full overflow-hidden shadow-card">
      {/* Header */}
      <div className="p-4 border-b border-[#594538] bg-[#191817] flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-[#C47A35] font-mono">
              {incident.tracking_id}
            </span>
            <PriorityBadge level={incident.priority_level} score={incident.priority_score} />
          </div>
          <h3 className="font-semibold text-[#F0E6D8] text-sm mt-1">
            {incident.type}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#B5A493] hover:text-[#F0E6D8] hover:bg-[#594538]/40 transition-colors"
          title="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="p-4 flex-1 overflow-y-auto space-y-5 text-sm">
        {/* Active Road Blockage Warning (if within 500m) */}
        {incident.nearby_blockages && incident.nearby_blockages.length > 0 && (
          <div className="p-3 rounded-lg bg-[#3D2517]/90 border border-[#C47A35]/80 text-[#F0E6D8]">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C47A35] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wide text-[#C47A35]">
                  Road Blockage Warning
                </span>
                <p className="text-xs mt-0.5 text-[#F0E6D8]">
                  This incident is within <strong>500m</strong> of an active blockage (
                  {incident.nearby_blockages.map((b) => `${b.tracking_id} at ~${b.distance_meters}m`).join(', ')}
                  ). Expect transit delays for responders.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Incident Details Summary */}
        <div className="space-y-2">
          <p className="text-[#F0E6D8] bg-[#191817] p-3 rounded-lg border border-[#594538]/70 text-xs leading-relaxed">
            {incident.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border border-[#594538]/70 bg-[#191817]/60 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#B5A493]" />
              <div>
                <span className="text-[#B5A493] block text-[10px]">People Affected</span>
                <span className="font-semibold text-[#F0E6D8]">{incident.people_affected}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-[#594538]/70 bg-[#191817]/60 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#B5A493]" />
              <div>
                <span className="text-[#B5A493] block text-[10px]">Vulnerable Group</span>
                <span className="font-semibold text-[#F0E6D8]">
                  {incident.vulnerable_involved ? 'Yes (+15 pts)' : 'No'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-[#594538]/70 bg-[#191817]/60 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#B5A493]" />
              <div>
                <span className="text-[#B5A493] block text-[10px]">Coordinates</span>
                <span className="font-mono text-[#F0E6D8] text-[11px]">
                  {incident.latitude?.toFixed(4)}, {incident.longitude?.toFixed(4)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-[#594538]/70 bg-[#191817]/60 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#B5A493]" />
              <div>
                <span className="text-[#B5A493] block text-[10px]">Current Status</span>
                <span className="font-semibold text-[#C47A35]">{incident.status}</span>
              </div>
            </div>
          </div>

          {/* Photo attachment if available */}
          {incident.photo_url && (
            <div className="mt-2">
              <span className="text-xs font-semibold text-[#B5A493] block mb-1">
                Citizen Photo Attachment:
              </span>
              <a
                href={`${API_BASE_URL}${incident.photo_url}`}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg border border-[#594538] max-h-48 group bg-[#191817]"
              >
                <img
                  src={`${API_BASE_URL}${incident.photo_url}`}
                  alt="Incident site"
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                />
              </a>
            </div>
          )}
        </div>

        {/* Priority Score Mathematical Breakdown */}
        <div className="p-3 rounded-lg border border-[#594538] bg-[#191817]/70">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-xs text-[#F0E6D8] uppercase tracking-wider">
              Priority Score Calculation
            </span>
            <span className="font-bold text-xs bg-[#C47A35]/20 text-[#C47A35] border border-[#C47A35]/40 px-2 py-0.5 rounded">
              Total = {incident.priority_score} pts
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-[#B5A493] font-mono">
            <div className="flex justify-between items-center py-0.5 border-b border-[#594538]/40">
              <span>Severity ({breakdown.severity_input || incident.severity} &times; 10)</span>
              <span className="font-semibold text-[#F0E6D8]">
                +{breakdown.severity_score ?? (incident.severity * 10)}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-[#594538]/40">
              <span>People Affected (min({breakdown.people_affected_input ?? incident.people_affected}, 20))</span>
              <span className="font-semibold text-[#F0E6D8]">
                +{breakdown.people_score ?? Math.min(incident.people_affected, 20)}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-[#594538]/40">
              <span>Vulnerable People ({incident.vulnerable_involved ? 'Yes' : 'No'})</span>
              <span className="font-semibold text-[#F0E6D8]">
                +{breakdown.vulnerable_score ?? (incident.vulnerable_involved ? 15 : 0)}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-[#594538]/40">
              <span>Type Weight ({incident.type})</span>
              <span className="font-semibold text-[#F0E6D8]">
                +{breakdown.type_score ?? 2}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 font-bold text-[#C47A35]">
              <span>Formula Result</span>
              <span>
                {incident.priority_score} &rarr; {incident.priority_level}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Teams Section */}
        {incident.assigned_resources && incident.assigned_resources.length > 0 && (
          <div className="p-3 rounded-lg border border-[#594538] bg-[#191817]">
            <span className="font-semibold text-xs text-[#F0E6D8] block mb-2">
              Currently Assigned Emergency Units:
            </span>
            <div className="space-y-2">
              {incident.assigned_resources.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-2 rounded bg-[#242321] border border-[#594538]/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    {getTeamIcon(res.type)}
                    <div>
                      <span className="font-semibold text-[#F0E6D8] block">{res.name}</span>
                      <span className="text-[11px] text-[#B5A493] capitalize">{res.type} &bull; {res.contact_number}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#C47A35]/20 text-[#C47A35] border border-[#C47A35]/40">
                    Deployed
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nearest Suitable Emergency Teams for Dispatch */}
        {incident.status !== 'Resolved' && incident.status !== 'Rejected' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-[#F0E6D8] uppercase tracking-wider">
                Nearest Available Units ({incident.suitable_type})
              </span>
              <span className="text-[10px] text-[#B5A493] font-mono">Haversine formula</span>
            </div>

            {incident.nearest_available_teams && incident.nearest_available_teams.length > 0 ? (
              <div className="space-y-2">
                {incident.nearest_available_teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-2.5 rounded-lg border border-[#594538]/70 hover:border-[#C47A35] bg-[#191817] transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-[#242321] border border-[#594538]">
                        {getTeamIcon(team.type)}
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-[#F0E6D8] block leading-tight">
                          {team.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#B5A493]">
                          <span className="font-medium text-[#C47A35]">
                            {team.distance_km} km away
                          </span>
                          <span>&bull;</span>
                          <span>{team.contact_number}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onAssignTeam(incident.id, team.id)}
                      disabled={isLoadingAction}
                      className="px-2.5 py-1 rounded text-xs font-semibold bg-[#C47A35] hover:bg-[#D48944] text-[#191817] transition-colors shrink-0 disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#B5A493] italic p-2 bg-[#191817] rounded border border-[#594538]/60">
                No currently available {incident.suitable_type} units in range.
              </p>
            )}
          </div>
        )}

        {/* Change Lifecycle Status Form */}
        <div className="p-3 rounded-lg border border-[#594538] bg-[#191817]/70">
          <span className="font-semibold text-xs text-[#F0E6D8] block mb-2 uppercase tracking-wider">
            Update Lifecycle Status
          </span>
          <form onSubmit={handleStatusChangeSubmit} className="space-y-2.5">
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 text-xs rounded-lg border border-[#594538] p-2 bg-[#242321] text-[#F0E6D8] focus:outline-none focus:border-[#C47A35] focus:ring-1 focus:ring-[#C47A35]"
              >
                <option value="" className="bg-[#242321] text-[#F0E6D8]">Select Next Status...</option>
                {statusOptions.map((st) => (
                  <option key={st} value={st} disabled={st === incident.status} className="bg-[#242321] text-[#F0E6D8]">
                    {st} {st === incident.status ? '(Current)' : ''}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!selectedStatus || isLoadingAction}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-[#C47A35] hover:bg-[#D48944] text-[#191817] transition-colors disabled:opacity-50"
              >
                Update
              </button>
            </div>

            <input
              type="text"
              placeholder="Optional comment/action notes..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#594538] p-2 bg-[#242321] text-[#F0E6D8] placeholder-[#B5A493]/50 focus:outline-none focus:border-[#C47A35] focus:ring-1 focus:ring-[#C47A35]"
            />
          </form>
        </div>

        {/* Status Lifecycle Timeline */}
        <div>
          <span className="font-semibold text-xs text-[#F0E6D8] block mb-2 uppercase tracking-wider">
            Status Timeline (Updates)
          </span>

          <div className="relative pl-5 border-l-2 border-[#594538] space-y-3.5 my-2">
            {incident.updates && incident.updates.length > 0 ? (
              incident.updates.map((update) => (
                <div key={update.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-[#C47A35] border-2 border-[#191817] shadow-sm" />

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#F0E6D8]">
                        {update.new_status}
                      </span>
                      <span className="text-[10px] text-[#B5A493]">
                        {new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-[#B5A493] mt-0.5">
                      {update.comment || 'Status updated'}
                    </p>

                    <span className="text-[10px] text-[#B5A493]/70 font-mono">
                      By: {update.changed_by}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#B5A493] italic">No timeline history recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
