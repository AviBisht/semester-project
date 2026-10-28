import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { API_BASE_URL } from '../api';
import {
  Search,
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  Users,
  ShieldAlert,
  Calendar,
  PhoneCall,
  Activity,
  Radio,
  FileCheck2,
  ChevronRight
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

  const stages = [
    { label: 'Report Registered', code: '01', desc: 'Logged in municipal emergency database' },
    { label: 'Unit Dispatched', code: '02', desc: 'Nearest response team assigned & en route' },
    { label: 'On-Scene Mitigation', code: '03', desc: 'Emergency personnel actively on site' },
    { label: 'Incident Resolved', code: '04', desc: 'Hazard cleared & citizen safety confirmed' },
  ];

  const getCurrentStageIndex = (status) => {
    if (status === 'Resolved') return 3;
    if (status === 'In Progress') return 2;
    if (status === 'Assigned') return 1;
    return 0;
  };

  const renderStatusHero = (status) => {
    switch (status) {
      case 'Resolved':
        return {
          bg: 'bg-[#166534] text-white',
          border: 'border-[#15803d]',
          icon: <CheckCircle2 className="w-7 h-7 text-[#86EFAC] shrink-0" />,
          title: 'INCIDENT RESOLVED — SITE MITIGATION COMPLETED',
          description: 'Emergency rescue teams and municipal operators have resolved the hazard. The incident docket is officially closed.',
        };
      case 'In Progress':
        return {
          bg: 'bg-[#9A3412] text-white',
          border: 'border-[#C2410C]',
          icon: <Activity className="w-7 h-7 text-[#FED7AA] shrink-0 animate-pulse" />,
          title: 'RESPONSE IN PROGRESS — ACTIVE MITIGATION UNDERWAY',
          description: 'Dispatched emergency units are on scene and executing incident mitigation operations.',
        };
      case 'Assigned':
        return {
          bg: 'bg-[#455239] text-white',
          border: 'border-[#586849]',
          icon: <Truck className="w-7 h-7 text-[#C6CDAA] shrink-0" />,
          title: 'RESCUE UNIT DISPATCHED — EN ROUTE TO EPICENTER',
          description: 'The nearest specialized emergency unit has been committed and is currently transiting to the reported coordinates.',
        };
      case 'Reported':
      default:
        return {
          bg: 'bg-[#343B30] text-white',
          border: 'border-[#4A5445]',
          icon: <Clock className="w-7 h-7 text-[#F5F0E5] shrink-0" />,
          title: 'REPORT REGISTERED — TRIAGE ASSESSMENT ACTIVE',
          description: 'Citizen report received by DEOC 24/7 operators. Priority calculated and response unit dispatch is being organized.',
        };
    }
  };

  return (
    <div className="flex-1 w-full bg-[#F5F0E5] text-[#343B30] pb-8">
      <div className="bg-[#FCFAF6] border-b border-[#DFD8C8] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#697C58]" />
            <span className="text-[11px] font-mono text-[#5A6354] uppercase tracking-wider font-bold">
              Dehradun District Emergency Operations Centre (DEOC) &bull; Official Citizen Verification
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#343B30] tracking-tight">
            Incident Dispatch Status Docket
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6354] mt-1.5 max-w-2xl leading-relaxed font-sans">
            Enter your official 8-character Incident Tracking ID to track real-time dispatch milestones, responding team contacts, and municipal audit history.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="mt-6 flex flex-col sm:flex-row items-stretch gap-2.5"
          >
            <label htmlFor="tracking-id-input" className="sr-only">
              Incident Tracking ID
            </label>
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-[#7C8775] absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="tracking-id-input"
                type="text"
                placeholder="Enter Incident Tracking ID (e.g. INC-2AD0 or INC-7491)"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                className="w-full text-sm font-mono rounded bg-[#FFFFFF] border-2 border-[#DFD8C8] pl-11 pr-4 py-3 text-[#343B30] placeholder-[#7C8775] focus:outline-none focus:border-[#697C58] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !trackingIdInput.trim()}
              className="px-8 py-3 rounded bg-[#697C58] hover:bg-[#576748] text-white text-xs font-bold font-mono uppercase tracking-wider transition-colors disabled:opacity-50 shrink-0 shadow-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Verify Status</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-[#7C8775]">
            <span>Quick Query Examples:</span>
            {['INC-2AD0', 'INC-7491'].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTrackingIdInput(id);
                  handleSearch(id);
                }}
                className="underline hover:text-[#343B30] font-semibold"
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div
            role="alert"
            className="p-4 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-mono flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {incidentData && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
          {(() => {
            const hero = renderStatusHero(incidentData.status);
            return (
              <div className={`p-6 sm:p-8 rounded-lg border ${hero.border} ${hero.bg} shadow-md`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-md bg-white/10 backdrop-blur-xs shrink-0">
                      {hero.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/80 block font-bold">
                        CURRENT OPERATIONAL STATUS
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight mt-1">
                        {hero.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-xl leading-relaxed">
                        {hero.description}
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/25 p-4 rounded-lg border border-white/20 font-mono shrink-0 text-left md:text-right">
                    <span className="text-[10px] text-white/70 block uppercase tracking-widest font-semibold">Incident Docket Number</span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-widest block font-mono">
                      {incidentData.tracking_id}
                    </span>
                    <span className="text-[11px] text-white/90 mt-1 block font-mono font-medium">
                      Triage Score: <strong className="text-white">{incidentData.priority_score} pts</strong> ({incidentData.priority_level})
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="bg-[#FCFAF6] border-y sm:border border-[#DFD8C8] sm:rounded-lg p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#DFD8C8]">
              <span className="text-xs font-mono uppercase tracking-wider text-[#343B30] font-bold">
                Operational Dispatch Milestones
              </span>
              <span className="text-[10px] font-mono text-[#5A6354]">
                Phase {getCurrentStageIndex(incidentData.status) + 1} of 4 Complete
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {stages.map((st, idx) => {
                const currentIdx = getCurrentStageIndex(incidentData.status);
                const isPassed = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                const isUpcoming = idx > currentIdx;

                return (
                  <div key={st.label} className="flex flex-col relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                          isCurrent
                            ? 'bg-[#697C58] text-white ring-4 ring-[#C6CDAA]/40'
                            : isPassed
                            ? 'bg-[#343B30] text-white'
                            : 'bg-[#DFD8C8] text-[#5A6354]'
                        }`}
                      >
                        {isPassed ? <CheckCircle2 className="w-4 h-4" /> : st.code}
                      </div>
                      <span
                        className={`text-xs font-mono font-bold ${
                          isCurrent
                            ? 'text-[#697C58]'
                            : isPassed
                            ? 'text-[#343B30]'
                            : 'text-[#7C8775]'
                        }`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5A6354] leading-relaxed pl-11 md:pl-0">
                      {st.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#343B30] font-bold block pb-2 border-b border-[#DFD8C8]">
                  Incident Registry Particulars
                </span>

                <div className="mt-4 bg-[#FCFAF6] border-l-4 border-[#697C58] p-4 text-xs text-[#343B30] leading-relaxed">
                  <span className="font-mono text-[10px] uppercase text-[#697C58] font-bold block mb-1">
                    Hazard Classification: {incidentData.type}
                  </span>
                  {incidentData.description}
                </div>
              </div>

              <div className="border border-[#DFD8C8] bg-[#FCFAF6] divide-y divide-[#DFD8C8] text-xs font-mono">
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[#5A6354] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#7C8775]" /> People Impacted
                  </span>
                  <span className="font-bold text-[#343B30]">{incidentData.people_affected} civilian(s)</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[#5A6354] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#7C8775]" /> Vulnerable Factor (Children/Elderly)
                  </span>
                  <span className={`font-bold ${incidentData.vulnerable_involved ? 'text-[#DC2626]' : 'text-[#343B30]'}`}>
                    {incidentData.vulnerable_involved ? 'Yes (+15 Triage Weight)' : 'No'}
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[#5A6354] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#7C8775]" /> Reported Severity Scale
                  </span>
                  <span className="font-bold text-[#343B30]">{incidentData.severity} / 5</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[#5A6354] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#7C8775]" /> Coordinates of Epicenter
                  </span>
                  <span className="text-[#697C58] font-bold">
                    {incidentData.latitude?.toFixed(4)}° N, {incidentData.longitude?.toFixed(4)}° E
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[#5A6354] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#7C8775]" /> Time Registered
                  </span>
                  <span className="text-[#343B30]">
                    {incidentData.created_at
                      ? new Date(incidentData.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Just now'}
                  </span>
                </div>
              </div>

              {incidentData.photo_url && (
                <div className="pt-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#343B30] font-bold block mb-2">
                    Citizen Photo Evidence Attachment
                  </span>
                  <div className="border border-[#DFD8C8] overflow-hidden bg-[#EFE9DC]">
                    <img
                      src={`${API_BASE_URL}${incidentData.photo_url}`}
                      alt="Citizen evidence"
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-2 bg-[#FCFAF6] text-[10px] font-mono text-[#5A6354] border-t border-[#DFD8C8]">
                      Timestamped visual attachment archived on DECTS storage bucket
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#343B30] font-bold block pb-2 border-b border-[#DFD8C8]">
                  Assigned Emergency Response Unit
                </span>

                {incidentData.assigned_team ? (
                  <div className="mt-4 p-5 bg-[#EEF2E6] border border-[#BAC7AF]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#697C58] font-bold block">
                          Dispatched Rescue Branch
                        </span>
                        <h3 className="text-base font-bold text-[#343B30] mt-0.5">
                          {incidentData.assigned_team.name}
                        </h3>
                        <span className="text-xs text-[#5A6354] capitalize block mt-0.5">
                          {incidentData.assigned_team.type} Unit
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-sm bg-[#DCFCE7] text-[#166534] border border-[#86EFAC] text-[10px] font-mono font-bold uppercase">
                        Active Dispatch
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#BAC7AF] flex items-center justify-between text-xs font-mono">
                      <span className="text-[#5A6354]">Emergency Direct:</span>
                      <a
                        href={`tel:${incidentData.assigned_team.contact}`}
                        className="font-bold text-[#697C58] hover:underline flex items-center gap-1.5"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        {incidentData.assigned_team.contact}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-5 bg-[#FCFAF6] border border-[#DFD8C8] text-xs text-[#5A6354] flex items-center gap-3">
                    <Clock className="w-6 h-6 text-[#7C8775] shrink-0" />
                    <div>
                      <span className="font-bold text-[#343B30] block">
                        Triage Assessment Active
                      </span>
                      <p className="text-[11px] text-[#5A6354] mt-0.5 leading-relaxed">
                        DEOC response coordinators are currently assigning the nearest available municipal crew.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#343B30] font-bold block pb-2 border-b border-[#DFD8C8]">
                  Official Incident Audit Trail
                </span>

                <div className="mt-4 relative pl-6 border-l-2 border-[#DFD8C8] space-y-4 font-mono text-xs">
                  {incidentData.updates && incidentData.updates.length > 0 ? (
                    incidentData.updates.map((update, idx) => (
                      <div key={update.id || idx} className="relative">
                        <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#697C58] border-2 border-[#F5F0E5]" />
                        <div className="bg-[#FCFAF6] p-3.5 border border-[#DFD8C8]">
                          <div className="flex items-center justify-between gap-2 border-b border-[#DFD8C8] pb-1.5 mb-1.5">
                            <span className="font-bold text-[#343B30]">
                              Status: {update.new_status}
                            </span>
                            <span className="text-[10px] text-[#5A6354]">
                              {new Date(update.created_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {update.comment && (
                            <p className="text-xs text-[#5A6354] leading-relaxed mb-2 font-sans">
                              {update.comment}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-[#7C8775]">
                            <span>Authorized: {update.changed_by}</span>
                            <span>DEOC Terminal</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-[#FCFAF6] border border-[#DFD8C8] text-xs text-[#7C8775] italic">
                      Initial intake docket created. No subsequent status transitions logged yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
