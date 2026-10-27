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
  Send,
  Navigation,
  CheckCircle2,
  PhoneCall,
  BellRing,
  ShieldCheck
} from 'lucide-react';

export default function IncidentDetailPanel({
  incident,
  teams = [],
  onClose,
  onUpdateStatus,
  onAssignTeam,
  onUnassignTeam,
  onApproveIncident,
  isLoadingAction
}) {
  const [comment, setComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [showDispatchSelector, setShowDispatchSelector] = useState(false);

  // Emergency Alert Push/Broadcast States
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [approxLocation, setApproxLocation] = useState('');

  const handleApprovalSubmit = async (e) => {
    e.preventDefault();
    if (!incident || !onApproveIncident) return;
    await onApproveIncident(incident.id, {
      custom_title: customTitle.trim() || undefined,
      approx_location: approxLocation.trim() || undefined,
      safety_instructions: customInstructions.trim() || undefined,
    });
    setShowApprovalForm(false);
  };

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
        <div className="p-3 border-b border-[#DFD8C8] bg-[#EFE9DC]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#16A34A]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#343B30]">
              District Fleet Readiness
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#343B30] text-[#F5F0E5] font-bold">
            {availableCount} / {teams.length} Ready
          </span>
        </div>

        {/* Guidance Notice */}
        <div className="p-3 bg-[#FCFAF6] border-b border-[#DFD8C8] text-xs text-[#5A6354] leading-relaxed">
          <p>
            Select any incident from the <strong className="text-[#343B30]">Queue</strong> or <strong className="text-[#343B30]">Tactical Map</strong> to execute nearest-unit Haversine dispatch and status transitions.
          </p>
        </div>

        {/* Fleet listing - Clean table rows instead of cards */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#DFD8C8]">
          {teams.map((team) => (
            <div
              key={team.id}
              className="p-3 bg-[#FCFAF6] hover:bg-[#F5F0E5] transition-colors flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-sm bg-[#EFE9DC] border border-[#DFD8C8] text-[#343B30]">
                  {getTeamIcon(team.type)}
                </div>
                <div>
                  <span className="font-semibold text-xs text-[#343B30] block leading-tight">{team.name}</span>
                  <span className="text-[10px] font-mono text-[#5A6354] capitalize">
                    {team.type} &bull; Hotline: {team.contact_number}
                  </span>
                </div>
              </div>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded-sm border uppercase font-bold ${
                  team.status === 'Available'
                    ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                    : team.status === 'Assigned'
                    ? 'bg-[#FFEDD5] text-[#9A3412] border-[#FDBA74]'
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
    <div className="flex flex-col h-full bg-[#FCFAF6] border-l border-[#DFD8C8] overflow-hidden" aria-label="Incident Mission Deck">
      {/* Flight Deck Header */}
      <div className="p-3 border-b border-[#DFD8C8] bg-[#EFE9DC] flex items-start justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-[#697C58]">
              {incident.tracking_id}
            </span>
            <PriorityBadge level={incident.priority_level} score={incident.priority_score} />
            {incident.is_verified && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] rounded-sm">
                <ShieldCheck className="w-3 h-3 text-[#166534]" /> VERIFIED
              </span>
            )}
          </div>
          <h2 className="font-bold text-[#343B30] text-sm mt-0.5">
            {incident.type}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-[#5A6354] hover:text-[#343B30] hover:bg-[#DFD8C8] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#697C58]"
          title="Close incident panel"
          aria-label="Close incident details"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Scrollable Mission Deck Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#DFD8C8] text-xs">
        {/* Transit Blockage Alert Banner if within 500m */}
        {incident.nearby_blockages && incident.nearby_blockages.length > 0 && (
          <div className="p-3 bg-[#FEF2F2] border-b border-[#FECACA] text-[#991B1B]" role="alert">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-mono font-bold text-[10px] uppercase text-[#991B1B] block">
                  Transit Hazard Warning
                </span>
                <p className="text-[11px] text-[#991B1B] mt-0.5 leading-tight">
                  Road blockage identified within 500m ({incident.nearby_blockages.map((b) => b.tracking_id).join(', ')}). Reroute incoming responders.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Ground Description */}
        <div className="p-3.5 space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6354] block font-bold">
            Field Observation Log
          </span>
          <p className="text-[#343B30] bg-[#FFFFFF] p-2.5 rounded border border-[#DFD8C8] leading-relaxed text-xs">
            {incident.description}
          </p>
        </div>

        {/* Section 2: Technical Telemetry Key-Value Grid */}
        <div className="p-3.5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6354] block font-bold">
            Operational Telemetry
          </span>
          <div className="border border-[#DFD8C8] rounded divide-y divide-[#DFD8C8] bg-[#FFFFFF] text-xs font-mono">
            <div className="p-2 flex items-center justify-between">
              <span className="text-[#5A6354] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#7C8775]" /> People Impacted
              </span>
              <span className="font-bold text-[#343B30]">{incident.people_affected} civilian(s)</span>
            </div>
            <div className="p-2 flex items-center justify-between">
              <span className="text-[#5A6354] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#7C8775]" /> Vulnerable Factor
              </span>
              <span className={`font-bold ${incident.vulnerable_involved ? 'text-[#DC2626]' : 'text-[#343B30]'}`}>
                {incident.vulnerable_involved ? 'Present (+15 Triage Weight)' : 'None'}
              </span>
            </div>
            <div className="p-2 flex items-center justify-between">
              <span className="text-[#5A6354] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#7C8775]" /> Logged At
              </span>
              <span className="text-[#343B30]">
                {incident.created_at
                  ? new Date(incident.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </span>
            </div>
            <div className="p-2 flex items-center justify-between">
              <span className="text-[#5A6354] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#7C8775]" /> Coordinates
              </span>
              <span className="text-[#697C58] font-bold">
                {incident.latitude?.toFixed(4)}, {incident.longitude?.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Citizen Field Photo Evidence */}
        {incident.photo_url && (
          <div className="p-3.5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6354] block font-bold">
              Citizen Photo Evidence
            </span>
            <div className="rounded border border-[#DFD8C8] overflow-hidden bg-[#EFE9DC]">
              <img
                src={`${API_BASE_URL}${incident.photo_url}`}
                alt="Evidence"
                className="w-full h-36 object-cover"
              />
              <div className="p-1.5 bg-[#FFFFFF] text-[10px] font-mono text-[#7C8775]">
                Attached to Incident #{incident.tracking_id}
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Public Emergency Alert Broadcast & Push Notification */}
        <div className="p-3.5 space-y-3 bg-[#FCFAF6] border-b border-[#DFD8C8]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#343B30] font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#697C58]" />
              <span>Public Emergency Alert &amp; Push Notification</span>
            </span>
          </div>

          {incident.is_verified ? (
            <div className="p-3 rounded bg-[#DCFCE7]/60 border border-[#86EFAC] text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#166534] flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>VERIFIED &amp; BROADCAST ACTIVE</span>
                </span>
                <span className="text-[10px] text-[#166534]">
                  {incident.verified_at ? new Date(incident.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <p className="text-[11px] text-[#14532D]">
                Verified by authorized operator <strong>{incident.verified_by}</strong>. Emergency notifications pushed to nearby citizens.
              </p>
              {incident.alert && (
                <div className="pt-1.5 border-t border-[#86EFAC]/60 text-[10px] text-[#166534] flex items-center justify-between">
                  <span>Subscribers Alerted: <strong>{incident.alert.dispatched_subscribers_count}</strong></span>
                  <span className="truncate max-w-[150px]">{incident.alert.approx_location}</span>
                </div>
              )}
            </div>
          ) : incident.status === 'Rejected' ? (
            <div className="p-2.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[11px] font-mono text-[#991B1B]">
              Incident has been rejected. Public alerts cannot be broadcasted for rejected records.
            </div>
          ) : (
            <div className="p-3 rounded bg-[#FFFFFF] border border-[#DFD8C8] space-y-2.5">
              <p className="text-[11px] text-[#5A6354] leading-relaxed">
                Broadcast official emergency warnings and push notifications to citizens subscribed within geographic radius. Operational status remains <span className="font-bold text-[#343B30] font-mono">[{incident.status}]</span>.
              </p>

              {!showApprovalForm ? (
                <button
                  type="button"
                  onClick={() => setShowApprovalForm(true)}
                  disabled={isLoadingAction}
                  className="w-full py-2 px-3 rounded bg-[#697C58] hover:bg-[#576748] text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Verify Incident &amp; Send Push / In-App Alert</span>
                </button>
              ) : (
                <form onSubmit={handleApprovalSubmit} className="space-y-2 pt-2 border-t border-[#DFD8C8]">
                  <div>
                    <label className="text-[10px] font-mono text-[#5A6354] block font-bold mb-1">
                      Custom Alert Headline (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder={`Verified Emergency: ${incident.type} in Dehradun`}
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full text-xs font-mono rounded border border-[#DFD8C8] p-1.5 bg-[#FFFFFF] text-[#343B30] focus:outline-none focus:border-[#697C58]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#5A6354] block font-bold mb-1">
                      Approximate Sector / Locality (No private addresses)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near Rajpur Road / Jakhan Sector"
                      value={approxLocation}
                      onChange={(e) => setApproxLocation(e.target.value)}
                      className="w-full text-xs font-mono rounded border border-[#DFD8C8] p-1.5 bg-[#FFFFFF] text-[#343B30] focus:outline-none focus:border-[#697C58]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#5A6354] block font-bold mb-1">
                      Public Safety Advisory
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Leave blank for automatic municipal safety guidance..."
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      className="w-full text-xs font-mono rounded border border-[#DFD8C8] p-1.5 bg-[#FFFFFF] text-[#343B30] focus:outline-none focus:border-[#697C58]"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isLoadingAction}
                      className="flex-1 py-2 px-3 rounded bg-[#697C58] hover:bg-[#576748] text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>{isLoadingAction ? 'Broadcasting...' : 'Confirm & Send Alert'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApprovalForm(false)}
                      className="px-3 py-2 rounded bg-[#EFE9DC] hover:bg-[#DFD8C8] text-[#5A6354] text-xs font-mono"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Section 5: Response Team Dispatch Control (Ambulance / Fire / Rescue) */}
        {(() => {
          const assignedTeams = incident.assigned_resources || [];
          const assignedIds = new Set(assignedTeams.map((r) => r.id));
          const availableFleet = teams.filter(
            (t) => !assignedIds.has(t.id) && t.status === 'Available'
          );

          return (
            <div className="p-3.5 space-y-3 bg-[#FCFAF6] border-b border-[#DFD8C8]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#343B30] font-bold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#697C58]" />
                  <span>Team Dispatch Decision</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EEF2E6] text-[#455239] border border-[#BAC7AF]">
                  {assignedTeams.length > 0 ? `${assignedTeams.length} Dispatched` : 'Standby / None'}
                </span>
              </div>

              {/* Current Active Dispatches (with Recall option) */}
              {assignedTeams.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-[#5A6354] uppercase font-bold block">
                    Actively Assigned Response Units:
                  </span>
                  {assignedTeams.map((assigned) => (
                    <div
                      key={assigned.id}
                      className="p-2.5 rounded bg-[#DCFCE7]/70 border border-[#86EFAC] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-[#BBF7D0] text-[#166534]">
                          {getTeamIcon(assigned.type)}
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-[#14532D] block leading-tight">
                            {assigned.name}
                          </span>
                          <span className="text-[10px] font-mono text-[#166534] capitalize">
                            {assigned.type} &bull; Hotline: {assigned.contact || assigned.contact_number || '+91-135-EMERGENCY'}
                          </span>
                        </div>
                      </div>
                      {onUnassignTeam && (
                        <button
                          type="button"
                          onClick={() => onUnassignTeam(incident.id, assigned.id)}
                          disabled={isLoadingAction}
                          className="px-2 py-1 rounded bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B] text-[10px] font-mono font-bold uppercase transition-colors shrink-0"
                          title="Recall this unit and mark Available"
                        >
                          Recall Unit
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded bg-[#F5F0E5] border border-[#DFD8C8] text-xs font-mono text-[#5A6354]">
                  <span className="font-bold text-[#343B30] block">No Units Dispatched</span>
                  <span className="text-[10px] text-[#7C8775]">
                    Standby evaluation &bull; Field team dispatch is optional.
                  </span>
                </div>
              )}

              {/* Decision: Whether to dispatch or keep on standby */}
              {!showDispatchSelector ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowDispatchSelector(true)}
                    disabled={isLoadingAction || availableFleet.length === 0}
                    className="w-full py-2 px-3 rounded bg-[#697C58] hover:bg-[#576748] text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <span>
                      {availableFleet.length === 0
                        ? 'No Fleet Units Available'
                        : '+ Select & Dispatch a Response Team'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded bg-[#FFFFFF] border border-[#BAC7AF] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#343B30]">
                      Pick Which Team to Dispatch:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDispatchSelector(false);
                        setSelectedTeamId('');
                      }}
                      className="text-[10px] font-mono text-[#7C8775] hover:text-[#DC2626]"
                    >
                      Cancel (Standby)
                    </button>
                  </div>

                  <div>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full text-xs font-mono rounded border border-[#DFD8C8] p-2 bg-[#FCFAF6] text-[#343B30] focus:outline-none focus:border-[#697C58]"
                    >
                      <option value="">-- Choose team to dispatch --</option>
                      {availableFleet.map((t) => (
                        <option key={t.id} value={t.id}>
                          [{t.type.toUpperCase()}] {t.name} (Hotline: {t.contact_number})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!selectedTeamId || isLoadingAction}
                      onClick={() => {
                        if (selectedTeamId && onAssignTeam) {
                          onAssignTeam(incident.id, Number(selectedTeamId));
                          setSelectedTeamId('');
                          setShowDispatchSelector(false);
                        }
                      }}
                      className="flex-1 py-2 px-3 rounded bg-[#16A34A] hover:bg-[#15803D] text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40"
                    >
                      Confirm Dispatch
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDispatchSelector(false);
                        setSelectedTeamId('');
                      }}
                      className="px-3 py-2 rounded bg-[#EFE9DC] hover:bg-[#DFD8C8] text-[#5A6354] text-xs font-mono"
                    >
                      Do Not Dispatch
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Section 5: Status Transition Action Controls */}
        <div className="p-3.5 space-y-2.5 bg-[#EFE9DC]/30">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6354] block font-bold">
            Commit Status Transition
          </span>

          <form onSubmit={handleStatusChangeSubmit} className="space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              {statusOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedStatus(opt)}
                  className={`py-1.5 px-2 text-xs font-mono rounded border transition-colors ${
                    selectedStatus === opt || (!selectedStatus && incident.status === opt)
                      ? 'bg-[#343B30] text-[#F5F0E5] font-bold border-[#343B30]'
                      : 'bg-[#FFFFFF] text-[#5A6354] border-[#DFD8C8] hover:bg-[#F5F0E5]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              placeholder="Operator lifecycle notes (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full text-xs font-mono rounded bg-[#FFFFFF] border border-[#DFD8C8] p-2 text-[#343B30] placeholder-[#7C8775] focus:outline-none focus:border-[#697C58]"
            />

            <button
              type="submit"
              disabled={isLoadingAction || !selectedStatus || selectedStatus === incident.status}
              className="w-full py-2 px-3 rounded bg-[#697C58] hover:bg-[#576748] text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Update Lifecycle State</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
