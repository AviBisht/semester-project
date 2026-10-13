import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { API_BASE_URL } from '../api';
import {
  Search,
  Truck,
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function TrackReportPage() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [trackingIdInput, setTrackingIdInput] = useState(initialId);
  const [incidentData, setIncidentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialId) {
      handleSearch(initialId);
    }
  }, [initialId]);

  const handleSearch = async (idToSearch) => {
    const query = idToSearch || trackingIdInput;
    if (!query.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setIncidentData(null);

    try {
      const res = await api.get(`/api/incidents/track/${query.trim()}`);
      setIncidentData(res.data);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.detail || 'Incident record not found. Verify your Tracking ID (e.g. INC-2AD0).'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const stages = ['Reported', 'Assigned', 'In Progress', 'Resolved'];
  const getCurrentStageIndex = (status) => {
    if (status === 'Resolved') return 3;
    if (status === 'In Progress') return 2;
    if (status === 'Assigned') return 1;
    return 0;
  };

  return (
    <div className="flex-1 w-full bg-[#F5F0E5] text-[#343B30] p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Search Header Bar */}
      <div className="bg-[#FCFAF6] border border-[#DFD8C8] p-4 sm:p-6 rounded-xl mb-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-[#697C58] font-bold uppercase tracking-wider block">
              Public Triage Tracking Terminal
            </span>
            <h1 className="text-xl font-bold text-[#343B30]">
              Incident Dispatch Status Monitor
            </h1>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center gap-2 max-w-md w-full"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#7C8775] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Enter ID: e.g. INC-2AD0 or INC-7491"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                className="w-full text-xs font-mono rounded-lg bg-[#FFFFFF] border border-[#DFD8C8] pl-9 pr-3 py-2 text-[#343B30] placeholder-[#7C8775] focus:outline-none focus:border-[#697C58]"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !trackingIdInput.trim()}
              className="px-4 py-2 rounded-lg bg-[#697C58] hover:bg-[#576748] text-white text-xs font-bold font-mono transition-colors disabled:opacity-50 shadow-xs"
            >
              {isLoading ? 'Searching...' : 'Track'}
            </button>
          </form>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 mb-6 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {incidentData && (
        <div className="space-y-6">
          {/* Milestone Pipeline Progress Bar */}
          <div className="bg-[#FCFAF6] border border-[#DFD8C8] p-4 sm:p-5 rounded-xl shadow-card">
            <span className="text-[10px] font-mono text-[#5A6354] uppercase tracking-wider block mb-3 font-semibold">
              Lifecycle Progress Pipeline
            </span>
            <div className="grid grid-cols-4 gap-2">
              {stages.map((st, idx) => {
                const currentIdx = getCurrentStageIndex(incidentData.status);
                const isPassed = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={st} className="flex flex-col items-center text-center">
                    <div
                      className={`h-1.5 w-full rounded-full mb-2 ${
                        isPassed ? 'bg-[#697C58]' : 'bg-[#DFD8C8]'
                      }`}
                    />
                    <span
                      className={`text-xs font-mono ${
                        isCurrent
                          ? 'text-[#697C58] font-bold'
                          : isPassed
                          ? 'text-[#343B30] font-semibold'
                          : 'text-[#7C8775]'
                      }`}
                    >
                      {st}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2-Column Dossier Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Incident Classification Dossier (5 cols) */}
            <div className="lg:col-span-5 bg-[#FCFAF6] border border-[#DFD8C8] rounded-xl p-5 space-y-4 shadow-card">
              <div className="flex items-center justify-between border-b border-[#DFD8C8] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-[#5A6354] uppercase block font-semibold">Record Identifier</span>
                  <span className="text-xl font-mono font-bold text-[#697C58]">{incidentData.tracking_id}</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#EEF2E6] text-[#343B30] font-semibold border border-[#B2BCA0]">
                  {incidentData.priority_level} ({incidentData.priority_score} pts)
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#5A6354] uppercase block mb-1 font-semibold">Incident Category</span>
                <span className="text-sm font-semibold text-[#343B30] block">{incidentData.type}</span>
                <p className="text-xs text-[#5A6354] mt-1 bg-[#FCFAF6] p-3 rounded-lg border border-[#DFD8C8] leading-relaxed">
                  {incidentData.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8]">
                  <span className="text-[10px] text-[#5A6354] block font-mono">People Affected</span>
                  <span className="font-mono font-bold text-[#343B30]">{incidentData.people_affected}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8]">
                  <span className="text-[10px] text-[#5A6354] block font-mono">Vulnerable Factor</span>
                  <span className="font-bold text-[#343B30]">{incidentData.vulnerable_involved ? 'Yes (+15)' : 'No'}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8]">
                  <span className="text-[10px] text-[#5A6354] block font-mono">Severity Scale</span>
                  <span className="font-mono font-bold text-[#343B30]">{incidentData.severity} / 5</span>
                </div>
                <div className="p-2 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8]">
                  <span className="text-[10px] text-[#5A6354] block font-mono">Coordinates</span>
                  <span className="font-mono text-[11px] text-[#697C58] font-semibold">{incidentData.latitude?.toFixed(4)}, {incidentData.longitude?.toFixed(4)}</span>
                </div>
              </div>

              {incidentData.photo_url && (
                <div>
                  <span className="text-[10px] font-mono text-[#5A6354] uppercase block mb-1 font-semibold">Attached Evidence</span>
                  <img
                    src={`${API_BASE_URL}${incidentData.photo_url}`}
                    alt="Evidence"
                    className="w-full h-40 object-cover rounded-lg border border-[#DFD8C8]"
                  />
                </div>
              )}
            </div>

            {/* Right: Operational Response & Lifecycle History (7 cols) */}
            <div className="lg:col-span-7 bg-[#FCFAF6] border border-[#DFD8C8] rounded-xl p-5 space-y-5 shadow-card">
              {/* Assigned Team Dispatch Banner */}
              {incidentData.assigned_team ? (
                <div className="p-4 rounded-lg bg-[#EEF2E6] border border-[#B2BCA0] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#FCFAF6] text-[#697C58] border border-[#BAC7AF]">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#697C58] font-bold uppercase tracking-wider block">
                        Assigned Responding Unit
                      </span>
                      <span className="text-sm font-bold text-[#343B30] block mt-0.5">
                        {incidentData.assigned_team.name}
                      </span>
                      <span className="text-xs text-[#5A6354] capitalize">
                        {incidentData.assigned_team.type} &bull; Hotline: {incidentData.assigned_team.contact}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7] font-semibold">
                    Active Dispatch
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8] text-xs text-[#5A6354] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#7C8775]" />
                  <span>Currently under triage in municipal queue. Response unit assignment pending.</span>
                </div>
              )}

              {/* Status Timeline History */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5A6354] block mb-3 font-semibold">
                  Audit Lifecycle Log
                </span>
                <div className="relative pl-4 border-l border-[#DFD8C8] space-y-3.5">
                  {incidentData.updates && incidentData.updates.length > 0 ? (
                    incidentData.updates.map((update, idx) => (
                      <div key={update.id || idx} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#697C58]" />
                        <div className="bg-[#EFE9DC] p-3 rounded-lg border border-[#DFD8C8] text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-[#343B30] font-mono">
                              Status Transition: {update.new_status}
                            </span>
                            <span className="text-[10px] font-mono text-[#5A6354]">
                              {new Date(update.created_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {update.comment && (
                            <p className="text-xs text-[#5A6354] mt-1">{update.comment}</p>
                          )}
                          <span className="text-[10px] text-[#7C8775] font-mono mt-1 block">
                            Logged by: {update.changed_by}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#7C8775] italic">No timeline entries yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
