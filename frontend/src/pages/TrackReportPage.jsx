import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../api';
import PriorityBadge from '../components/PriorityBadge';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Shield,
  Truck,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

export default function TrackReportPage() {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [trackingIdInput, setTrackingIdInput] = useState(initialId);
  const [incidentData, setIncidentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-search if id is in query params
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
        err.response?.data?.detail || 'Incident not found. Please verify your Tracking ID (e.g., INC-7491).'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Resolved') return 'bg-[#B8D8C4] text-[#234A35] border-[#A4CBB2]';
    if (status === 'In Progress') return 'bg-[#A9CCE3] text-[#1F3A4D] border-[#8FBBD9]';
    if (status === 'Assigned') return 'bg-sky-100 text-sky-800 border-sky-300';
    if (status === 'Rejected') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-amber-100 text-amber-800 border-amber-300';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F3A4D]">
          Track Incident Status
        </h1>
        <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
          Enter the unique Tracking ID provided when you submitted your report to view real-time triage and response status.
        </p>

        {/* Search Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="mt-6 flex items-center justify-center gap-2 max-w-md mx-auto"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="e.g. INC-7491 or INC-9204"
              value={trackingIdInput}
              onChange={(e) => setTrackingIdInput(e.target.value)}
              className="w-full text-sm rounded-xl border border-[#E8E2D9] pl-9 pr-4 py-2.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A9CCE3]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !trackingIdInput.trim()}
            className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#A9CCE3] hover:bg-[#8FBBD9] text-[#1F3A4D] transition-colors shadow-soft disabled:opacity-60"
          >
            {isLoading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Incident Result Card */}
      {incidentData && (
        <div className="bg-[#FFFFFF] border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-soft">
          {/* Header Banner */}
          <div className="p-5 sm:p-6 border-b border-[#E8E2D9] bg-[#FAF7F2]/70 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Official Incident Record
              </span>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-xl sm:text-2xl font-bold font-mono text-[#1F3A4D]">
                  {incidentData.tracking_id}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                    incidentData.status
                  )}`}
                >
                  {incidentData.status}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-gray-500 block">Reported Timestamp</span>
              <span className="text-xs font-semibold text-gray-800">
                {new Date(incidentData.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-6">
            {/* Description & Type */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                Incident Classification & Details
              </span>
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9]">
                <span className="font-bold text-sm text-[#1F3A4D] block mb-1">
                  {incidentData.type}
                </span>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {incidentData.description}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-[#E8E2D9] bg-white">
                <span className="text-gray-500 block text-[11px]">People Affected</span>
                <span className="font-bold text-base text-gray-800 mt-0.5 block">
                  {incidentData.people_affected}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-[#E8E2D9] bg-white">
                <span className="text-gray-500 block text-[11px]">Vulnerable People</span>
                <span className="font-bold text-base text-gray-800 mt-0.5 block">
                  {incidentData.vulnerable_involved ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-[#E8E2D9] bg-white">
                <span className="text-gray-500 block text-[11px]">Severity Level</span>
                <span className="font-bold text-base text-gray-800 mt-0.5 block">
                  {incidentData.severity} / 5
                </span>
              </div>

              <div className="p-3 rounded-xl border border-[#E8E2D9] bg-white">
                <span className="text-gray-500 block text-[11px]">Location Pin</span>
                <span className="font-mono text-xs font-semibold text-gray-800 mt-0.5 block truncate">
                  {incidentData.latitude.toFixed(4)}, {incidentData.longitude.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Attached Photo if available */}
            {incidentData.photo_url && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                  Uploaded Photo Evidence
                </span>
                <img
                  src={`${API_BASE_URL}${incidentData.photo_url}`}
                  alt="Incident submission"
                  className="rounded-xl border border-[#E8E2D9] max-h-64 object-cover"
                />
              </div>
            )}

            {/* Assigned Team Dispatch Banner */}
            {incidentData.assigned_team && (
              <div className="p-4 rounded-xl border border-[#B8D8C4] bg-[#F2F7F4] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-[#B8D8C4] text-[#234A35]">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#234A35] uppercase tracking-wider block">
                      Assigned Emergency Team
                    </span>
                    <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                      {incidentData.assigned_team.name}
                    </span>
                    <span className="text-xs text-gray-600 capitalize">
                      {incidentData.assigned_team.type} &bull; Hotline: {incidentData.assigned_team.contact}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-white text-emerald-800 border border-emerald-300">
                  En Route / Assigned
                </span>
              </div>
            )}

            {/* Status Timeline History */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1F3A4D] block mb-3">
                Official Incident Lifecycle Timeline
              </span>
              <div className="relative pl-6 border-l-2 border-[#E8E2D9] space-y-4">
                {incidentData.updates && incidentData.updates.length > 0 ? (
                  incidentData.updates.map((update, idx) => (
                    <div key={update.id || idx} className="relative">
                      {/* Dot */}
                      <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#A9CCE3] border-2 border-white shadow-sm" />

                      <div className="bg-[#FAF7F2]/60 p-3 rounded-xl border border-[#E8E2D9]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-[#1F3A4D]">
                            Status Transition: {update.new_status}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {new Date(update.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {update.comment && (
                          <p className="text-xs text-gray-700 mt-1">
                            {update.comment}
                          </p>
                        )}
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          Logged by: {update.changed_by}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic">No timeline entries yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
