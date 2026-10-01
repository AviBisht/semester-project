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
    <div className="bg-[#FFFFFF] border border-[#E8E2D9] rounded-xl flex flex-col h-full overflow-hidden shadow-soft">
      {/* Header */}
      <div className="p-4 border-b border-[#E8E2D9] bg-[#FAF7F2]/60 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-[#1F3A4D]">
              {incident.tracking_id}
            </span>
            <PriorityBadge level={incident.priority_level} score={incident.priority_score} />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm mt-1">
            {incident.type}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="p-4 flex-1 overflow-y-auto space-y-5 text-sm">
        {/* Active Road Blockage Warning (if within 500m) */}
        {incident.nearby_blockages && incident.nearby_blockages.length > 0 && (
          <div className="p-3 rounded-lg bg-[#FDF2F4] border border-[#F2C6CF] text-[#6B2B3A]">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#6B2B3A] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wide">
                  Road Blockage Warning
                </span>
                <p className="text-xs mt-0.5">
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
          <p className="text-gray-700 bg-[#FAF7F2] p-3 rounded-lg border border-[#E8E2D9] text-xs leading-relaxed">
            {incident.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border border-[#E8E2D9] flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-gray-500 block text-[10px]">People Affected</span>
                <span className="font-semibold text-gray-800">{incident.people_affected}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-[#E8E2D9] flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-gray-500 block text-[10px]">Vulnerable Group</span>
                <span className="font-semibold text-gray-800">
                  {incident.vulnerable_involved ? 'Yes (+15 pts)' : 'No'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-[#E8E2D9] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-gray-500 block text-[10px]">Coordinates</span>
                <span className="font-mono text-gray-800 text-[11px]">
                  {incident.latitude?.toFixed(4)}, {incident.longitude?.toFixed(4)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-[#E8E2D9] flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-gray-500 block text-[10px]">Current Status</span>
                <span className="font-semibold text-[#1F3A4D]">{incident.status}</span>
              </div>
            </div>
          </div>

          {/* Photo attachment if available */}
          {incident.photo_url && (
            <div className="mt-2">
              <span className="text-xs font-semibold text-gray-600 block mb-1">
                Citizen Photo Attachment:
              </span>
              <a
                href={`${API_BASE_URL}${incident.photo_url}`}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg border border-[#E8E2D9] max-h-48 group"
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
        <div className="p-3 rounded-lg border border-[#E8E2D9] bg-[#FAF7F2]/40">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-xs text-[#1F3A4D] uppercase tracking-wider">
              Priority Score Calculation
            </span>
            <span className="font-bold text-xs bg-[#A9CCE3]/40 px-2 py-0.5 rounded text-[#1F3A4D]">
              Total = {incident.priority_score} pts
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-gray-600 font-mono">
            <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
              <span>Severity ({breakdown.severity_input || incident.severity} &times; 10)</span>
              <span className="font-semibold text-gray-800">
                +{breakdown.severity_score ?? (incident.severity * 10)}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
              <span>People Affected (min({breakdown.people_affected_input ?? incident.people_affected}, 20))</span>
              <span className="font-semibold text-gray-800">
                +{breakdown.people_score ?? Math.min(incident.people_affected, 20)}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
              <span>Vulnerable People ({incident.vulnerable_involved ? 'Yes' : 'No'})</span>
              <span className="font-semibold text-gray-800">
                +{breakdown.vulnerable_score ?? (incident.vulnerable_involved ? 15 : 0)}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
              <span>Type Weight ({incident.type})</span>
              <span className="font-semibold text-gray-800">
                +{breakdown.type_score ?? 2}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 font-bold text-[#1F3A4D]">
              <span>Formula Result</span>
              <span>
                {incident.priority_score} &rarr; {incident.priority_level}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Teams Section */}
        {incident.assigned_resources && incident.assigned_resources.length > 0 && (
          <div className="p-3 rounded-lg border border-[#A9CCE3] bg-[#F0F6FA]">
            <span className="font-semibold text-xs text-[#1F3A4D] block mb-2">
              Currently Assigned Emergency Units:
            </span>
            <div className="space-y-2">
              {incident.assigned_resources.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-2 rounded bg-white border border-[#E8E2D9] text-xs"
                >
                  <div className="flex items-center gap-2">
                    {getTeamIcon(res.type)}
                    <div>
                      <span className="font-semibold text-gray-800 block">{res.name}</span>
                      <span className="text-[11px] text-gray-500 capitalize">{res.type} &bull; {res.contact_number}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">
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
              <span className="font-semibold text-xs text-[#1F3A4D] uppercase tracking-wider">
                Nearest Available Units ({incident.suitable_type})
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Haversine formula</span>
            </div>

            {incident.nearest_available_teams && incident.nearest_available_teams.length > 0 ? (
              <div className="space-y-2">
                {incident.nearest_available_teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-2.5 rounded-lg border border-[#E8E2D9] hover:border-[#A9CCE3] bg-white transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-gray-50 border border-gray-100">
                        {getTeamIcon(team.type)}
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-gray-800 block leading-tight">
                          {team.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                          <span className="font-medium text-emerald-700">
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
                      className="px-2.5 py-1 rounded text-xs font-semibold bg-[#A9CCE3] hover:bg-[#8FBBD9] text-[#1F3A4D] transition-colors shrink-0 disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic p-2 bg-gray-50 rounded border border-gray-100">
                No currently available {incident.suitable_type} units in range.
              </p>
            )}
          </div>
        )}

        {/* Change Lifecycle Status Form */}
        <div className="p-3 rounded-lg border border-[#E8E2D9] bg-[#FAF7F2]/70">
          <span className="font-semibold text-xs text-[#1F3A4D] block mb-2 uppercase tracking-wider">
            Update Lifecycle Status
          </span>
          <form onSubmit={handleStatusChangeSubmit} className="space-y-2.5">
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 text-xs rounded-lg border border-[#E8E2D9] p-2 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#A9CCE3]"
              >
                <option value="">Select Next Status...</option>
                {statusOptions.map((st) => (
                  <option key={st} value={st} disabled={st === incident.status}>
                    {st} {st === incident.status ? '(Current)' : ''}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!selectedStatus || isLoadingAction}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#B8D8C4] hover:bg-[#A4CBB2] text-[#234A35] transition-colors disabled:opacity-50"
              >
                Update
              </button>
            </div>

            <input
              type="text"
              placeholder="Optional comment/action notes..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#E8E2D9] p-2 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#A9CCE3]"
            />
          </form>
        </div>

        {/* Status Lifecycle Timeline */}
        <div>
          <span className="font-semibold text-xs text-[#1F3A4D] block mb-2 uppercase tracking-wider">
            Status Timeline (Updates)
          </span>

          <div className="relative pl-5 border-l-2 border-[#E8E2D9] space-y-3.5 my-2">
            {incident.updates && incident.updates.length > 0 ? (
              incident.updates.map((update) => (
                <div key={update.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-[#A9CCE3] border-2 border-white shadow-sm" />

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#1F3A4D]">
                        {update.new_status}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-0.5">
                      {update.comment || 'Status updated'}
                    </p>

                    <span className="text-[10px] text-gray-400 font-mono">
                      By: {update.changed_by}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic">No timeline history recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
