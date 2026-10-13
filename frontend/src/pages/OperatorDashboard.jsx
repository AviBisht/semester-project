import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import IncidentMap from '../components/IncidentMap';
import IncidentTable from '../components/IncidentTable';
import IncidentDetailPanel from '../components/IncidentDetailPanel';
import { RefreshCw, Radio, CloudRain, AlertTriangle } from 'lucide-react';

export default function OperatorDashboard() {
  const navigate = useNavigate();

  // Primary Data States
  const [incidents, setIncidents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [blockages, setBlockages] = useState([]);
  const [weather, setWeather] = useState(null);

  // Selection & UI States
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  // Mobile view switcher: 'feed' | 'map' | 'deck'
  const [mobileTab, setMobileTab] = useState('map');

  const selectedIncidentIdRef = useRef(null);
  selectedIncidentIdRef.current = selectedIncident?.id;

  // Protect route
  useEffect(() => {
    const token = localStorage.getItem('operator_token');
    if (!token) {
      navigate('/operator/login');
    }
  }, [navigate]);

  // Fetch all dashboard data
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

      // If an incident was selected, refresh its details
      if (selectedIncidentIdRef.current) {
        try {
          const detailRes = await api.get(`/api/incidents/${selectedIncidentIdRef.current}`);
          setSelectedIncident(detailRes.data);
        } catch {
          // If deleted or not found
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
      // On mobile, auto-switch to deck tab when an item is selected
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

  // Metrics
  const activeCount = incidents.filter((i) => ['Reported', 'Assigned', 'In Progress'].includes(i.status)).length;
  const criticalCount = incidents.filter((i) => i.priority_level === 'Critical').length;
  const assignedCount = incidents.filter((i) => ['Assigned', 'In Progress'].includes(i.status)).length;
  const resolvedCount = incidents.filter((i) => i.status === 'Resolved').length;
  const availableTeamsCount = teams.filter((t) => t.status === 'Available').length;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-[#F5F0E5]">
      {/* 1. Ultra-Compact Operational Telemetry Bar (Earthy Olive & Ivory) */}
      <div className="bg-[#FCFAF6] border-b border-[#DFD8C8] px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs font-mono">
        {/* Left: District Grid & Live Heartbeat */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#343B30]">
            <Radio className="w-3.5 h-3.5 text-[#16A34A] animate-pulse" />
            <span className="font-bold text-[#697C58]">DEHRADUN GRID</span>
            <span className="text-[#5A6354] text-[10px] hidden sm:inline">[30.3165°N, 78.0322°E]</span>
          </div>

          {/* Weather Ticker */}
          {weather && (
            <div className="hidden md:flex items-center gap-2 border-l border-[#DFD8C8] pl-3 text-[#5A6354]">
              <div className="flex items-center gap-1">
                {weather.is_warning ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-[#CF806B]" />
                ) : (
                  <CloudRain className="w-3.5 h-3.5 text-[#697C58]" />
                )}
                <span className="text-[#343B30] font-semibold">{weather.temperature}°C</span>
              </div>
              <span>&bull;</span>
              <span>Precip: {weather.precipitation ?? weather.rain ?? 0} mm/h</span>
              <span>&bull;</span>
              <span>Wind: {weather.wind_speed} km/h</span>
              {weather.is_warning && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-[#FAF1EE] text-[#9A3412] border border-[#E5BFB5] font-bold">
                  WEATHER ADVISORY
                </span>
              )}
            </div>
          )}
        </div>

        {/* Center/Right: Live Triage Metrics Ribbon */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-[#EFE9DC] border border-[#DFD8C8] text-[#343B30]">
              Active: <strong>{activeCount}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]">
              Crit: <strong>{criticalCount}</strong>
            </span>
            <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-[#FAF1EE] border border-[#E5BFB5] text-[#9A3412]">
              Deployed: <strong>{assignedCount}</strong>
            </span>
            <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-[#EEF2E6] border border-[#B2BCA0] text-[#343B30]">
              Fleet: <strong>{availableTeamsCount}/{teams.length}</strong>
            </span>
          </div>

          <button
            onClick={() => fetchData(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FCFAF6] hover:bg-[#EEF2E6] text-[#5A6354] hover:text-[#343B30] border border-[#DFD8C8] transition-colors disabled:opacity-50"
            title="Manual telemetry sync"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#697C58]' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher (<lg screens) */}
      <div className="flex lg:hidden bg-[#FCFAF6] border-b border-[#DFD8C8] p-1 justify-around text-xs font-mono">
        <button
          onClick={() => setMobileTab('feed')}
          className={`flex-1 py-1 rounded-md text-center transition-all ${
            mobileTab === 'feed' ? 'bg-[#EEF2E6] text-[#697C58] font-bold' : 'text-[#5A6354]'
          }`}
        >
          Queue ({incidents.length})
        </button>
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-1 rounded-md text-center transition-all ${
            mobileTab === 'map' ? 'bg-[#EEF2E6] text-[#697C58] font-bold' : 'text-[#5A6354]'
          }`}
        >
          Tactical Map
        </button>
        <button
          onClick={() => setMobileTab('deck')}
          className={`flex-1 py-1 rounded-md text-center transition-all ${
            mobileTab === 'deck' ? 'bg-[#EEF2E6] text-[#697C58] font-bold' : 'text-[#5A6354]'
          }`}
        >
          {selectedIncident ? 'Dispatch Deck' : 'Fleet Deck'}
        </button>
      </div>

      {/* 2. Tri-Pane Integrated Cockpit Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Triage Feed (320px) */}
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

        {/* Center Pane: Full-Height GIS Tactical Map Canvas */}
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

        {/* Right Pane: Persistent Mission Deck (380px) */}
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
            isLoadingAction={isLoadingAction}
          />
        </div>
      </div>
    </div>
  );
}
