import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import IncidentMap from '../components/IncidentMap';
import IncidentTable from '../components/IncidentTable';
import IncidentDetailPanel from '../components/IncidentDetailPanel';
import { RefreshCw, Radio, CloudRain, AlertTriangle } from 'lucide-react';

export default function OperatorDashboard() {
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [blockages, setBlockages] = useState([]);
  const [weather, setWeather] = useState(null);

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  const [mobileTab, setMobileTab] = useState('map');

  const selectedIncidentIdRef = useRef(null);
  selectedIncidentIdRef.current = selectedIncident?.id;

  useEffect(() => {
    const token = localStorage.getItem('operator_token');
    if (!token) {
      navigate('/operator/login');
    }
  }, [navigate]);

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setIsRefreshing(true);

    try {
      const [incRes, teamsRes, blockRes, weatherRes] = await Promise.all([
        api.get('/api/incidents', {
          params: {
            status: statusFilter,
            priority: priorityFilter,
          },
        }),
        api.get('/api/resources'),
        api.get('/api/road-blockages'),
        api.get('/api/weather'),
      ]);

      setIncidents(incRes.data);
      setTeams(teamsRes.data);
      setBlockages(blockRes.data);
      setWeather(weatherRes.data);
      setLastRefreshedAt(new Date());

      if (selectedIncidentIdRef.current) {
        try {
          const detailRes = await api.get(`/api/incidents/${selectedIncidentIdRef.current}`);
          setSelectedIncident(detailRes.data);
        } catch {
        }
      }
    } catch (err) {
      console.error('Error polling dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [statusFilter, priorityFilter]);

  const handleSelectIncident = async (incidentSummary) => {
    if (!incidentSummary) {
      setSelectedIncident(null);
      return;
    }
    try {
      setIsLoadingAction(true);
      const res = await api.get(`/api/incidents/${incidentSummary.id}`);
      setSelectedIncident(res.data);
      if (window.innerWidth < 1024) {
        setMobileTab('deck');
      }
    } catch (err) {
      console.error('Failed to load incident detail:', err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleUpdateStatus = async (incidentId, newStatus, comment) => {
    setIsLoadingAction(true);
    try {
      await api.patch(`/api/incidents/${incidentId}/status`, {
        new_status: newStatus,
        comment: comment || null,
      });
      await fetchData(true);
      const detailRes = await api.get(`/api/incidents/${incidentId}`);
      setSelectedIncident(detailRes.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleAssignTeam = async (incidentId, resourceId) => {
    setIsLoadingAction(true);
    try {
      await api.post(`/api/incidents/${incidentId}/assign`, {
        resource_id: resourceId,
        comment: 'Dispatched via Operator Command Console',
      });
      await fetchData(true);
      const detailRes = await api.get(`/api/incidents/${incidentId}`);
      setSelectedIncident(detailRes.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign team');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleUnassignTeam = async (incidentId, resourceId) => {
    setIsLoadingAction(true);
    try {
      await api.delete(`/api/incidents/${incidentId}/assign/${resourceId}`);
      await fetchData(true);
      const detailRes = await api.get(`/api/incidents/${incidentId}`);
      setSelectedIncident(detailRes.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to recall team');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleApproveIncident = async (incidentId, approvalPayload) => {
    setIsLoadingAction(true);
    try {
      const res = await api.post(`/api/incidents/${incidentId}/approve`, approvalPayload || {});
      await fetchData(true);
      const detailRes = await api.get(`/api/incidents/${incidentId}`);
      setSelectedIncident(detailRes.data);
      alert(res.data.message || 'Incident verified and emergency alert broadcasted.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to verify incident and broadcast alert');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const activeCount = incidents.filter((i) => ['Reported', 'Assigned', 'In Progress'].includes(i.status)).length;
  const criticalCount = incidents.filter((i) => i.priority_level === 'Critical').length;
  const assignedCount = incidents.filter((i) => ['Assigned', 'In Progress'].includes(i.status)).length;
  const resolvedCount = incidents.filter((i) => i.status === 'Resolved').length;
  const availableTeamsCount = teams.filter((t) => t.status === 'Available').length;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-[#F5F0E5]">
      <div className="bg-[#FCFAF6] border-b border-[#DFD8C8] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xs sm:text-sm font-bold tracking-tight text-[#343B30] flex items-center gap-2 font-mono uppercase">
            <Radio className="w-3.5 h-3.5 text-[#16A34A] animate-pulse shrink-0" aria-hidden="true" />
            <span>Dehradun Emergency Command Console</span>
          </h1>
          <span className="text-[#5A6354] text-[10px] font-mono hidden md:inline border-l border-[#DFD8C8] pl-2.5">
            District Grid [30.3165°N, 78.0322°E]
          </span>

          {weather && (
            <div className="hidden lg:flex items-center gap-2 border-l border-[#DFD8C8] pl-2.5 text-[11px] font-mono text-[#5A6354]">
              <div className="flex items-center gap-1">
                {weather.is_warning ? (
                  <AlertTriangle className="w-3 h-3 text-[#CF806B]" aria-hidden="true" />
                ) : (
                  <CloudRain className="w-3 h-3 text-[#697C58]" aria-hidden="true" />
                )}
                <span className="text-[#343B30] font-bold">{weather.temperature}°C</span>
              </div>
              <span>&bull;</span>
              <span>Precip: {weather.precipitation ?? weather.rain ?? 0} mm/h</span>
              <span>&bull;</span>
              <span>Wind: {weather.wind_speed} km/h</span>
              {weather.is_warning && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FAF1EE] text-[#9A3412] border border-[#E5BFB5] font-bold">
                  FLOOD ADVISORY
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center divide-x divide-[#DFD8C8] bg-[#EFE9DC]/60 border border-[#DFD8C8] rounded text-[11px] overflow-hidden">
            <span className="px-2.5 py-1 text-[#343B30]">
              Active: <strong className="text-[#697C58]">{activeCount}</strong>
            </span>
            <span className="px-2.5 py-1 text-[#991B1B] bg-[#FEF2F2]/60 font-semibold">
              Crit: <strong>{criticalCount}</strong>
            </span>
            <span className="hidden sm:inline px-2.5 py-1 text-[#9A3412]">
              Dispatched: <strong>{assignedCount}</strong>
            </span>
            <span className="hidden sm:inline px-2.5 py-1 text-[#343B30]">
              Fleet: <strong>{availableTeamsCount}/{teams.length}</strong>
            </span>
          </div>

          <button
            onClick={() => fetchData(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#FCFAF6] hover:bg-[#EEF2E6] text-[#5A6354] hover:text-[#343B30] border border-[#DFD8C8] transition-colors disabled:opacity-50 text-xs font-mono"
            title="Manual telemetry sync"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#697C58]' : ''}`} aria-hidden="true" />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      <nav aria-label="Dashboard Panels" className="flex lg:hidden bg-[#FCFAF6] border-b border-[#DFD8C8] p-1 justify-around text-xs font-mono">
        <button
          onClick={() => setMobileTab('feed')}
          className={`flex-1 py-1 rounded text-center transition-colors ${
            mobileTab === 'feed' ? 'bg-[#EEF2E6] text-[#455239] font-bold border border-[#BAC7AF]' : 'text-[#5A6354]'
          }`}
        >
          Queue ({incidents.length})
        </button>
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-1 rounded text-center transition-colors ${
            mobileTab === 'map' ? 'bg-[#EEF2E6] text-[#455239] font-bold border border-[#BAC7AF]' : 'text-[#5A6354]'
          }`}
        >
          Tactical Map
        </button>
        <button
          onClick={() => setMobileTab('deck')}
          className={`flex-1 py-1 rounded text-center transition-colors ${
            mobileTab === 'deck' ? 'bg-[#EEF2E6] text-[#455239] font-bold border border-[#BAC7AF]' : 'text-[#5A6354]'
          }`}
        >
          {selectedIncident ? 'Dispatch Deck' : 'Fleet Deck'}
        </button>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`w-full lg:w-[320px] shrink-0 h-full ${
            mobileTab === 'feed' ? 'block' : 'hidden lg:block'
          }`}
        >
          <IncidentTable
            incidents={incidents}
            selectedIncident={selectedIncident}
            onSelectIncident={handleSelectIncident}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
          />
        </div>

        <div
          className={`flex-1 h-full relative ${
            mobileTab === 'map' ? 'block' : 'hidden lg:block'
          }`}
        >
          <IncidentMap
            incidents={incidents}
            teams={teams}
            blockages={blockages}
            selectedIncident={selectedIncident}
            onSelectIncident={handleSelectIncident}
            showLegend={true}
          />
        </div>

        <div
          className={`w-full lg:w-[380px] shrink-0 h-full ${
            mobileTab === 'deck' ? 'block' : 'hidden lg:block'
          }`}
        >
          <IncidentDetailPanel
            incident={selectedIncident}
            teams={teams}
            onClose={() => setSelectedIncident(null)}
            onUpdateStatus={handleUpdateStatus}
            onAssignTeam={handleAssignTeam}
            onUnassignTeam={handleUnassignTeam}
            onApproveIncident={handleApproveIncident}
            isLoadingAction={isLoadingAction}
          />
        </div>
      </div>
    </div>
  );
}
