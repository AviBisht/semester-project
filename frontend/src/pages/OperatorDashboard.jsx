import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import WeatherBanner from '../components/WeatherBanner';
import SummaryCards from '../components/SummaryCards';
import IncidentMap from '../components/IncidentMap';
import IncidentTable from '../components/IncidentTable';
import IncidentDetailPanel from '../components/IncidentDetailPanel';
import { RefreshCw, Radio, Layers, AlertCircle } from 'lucide-react';

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

  // Keep ref for current selectedIncident to persist or refresh detail panel smoothly
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

      // If an incident was selected, refresh its details (nearest teams, updates timeline, etc.)
      if (selectedIncidentIdRef.current) {
        try {
          const detailRes = await api.get(`/api/incidents/${selectedIncidentIdRef.current}`);
          setSelectedIncident(detailRes.data);
        } catch {
          // If deleted or not found, leave as is
        }
      }
    } catch (err) {
      console.error('Error polling dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load and filter change trigger
  useEffect(() => {
    fetchData(false);
  }, [statusFilter, priorityFilter]);

  // Polling every 10 seconds (as requested: "poll the API every 10 seconds instead of WebSockets")
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 10000); // 10,000 ms = 10s

    return () => clearInterval(interval);
  }, [statusFilter, priorityFilter]);

  // Load detailed incident when user selects one
  const handleSelectIncident = async (incidentSummary) => {
    if (!incidentSummary) {
      setSelectedIncident(null);
      return;
    }
    try {
      setIsLoadingAction(true);
      const res = await api.get(`/api/incidents/${incidentSummary.id}`);
      setSelectedIncident(res.data);
    } catch (err) {
      console.error('Failed to load incident detail:', err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Change lifecycle status (Reported -> Assigned -> In Progress -> Resolved / Rejected)
  const handleUpdateStatus = async (incidentId, newStatus, comment) => {
    setIsLoadingAction(true);
    try {
      await api.patch(`/api/incidents/${incidentId}/status`, {
        new_status: newStatus,
        comment: comment || null,
      });
      // Refresh data immediately
      await fetchData(true);
      // Reload updated detail
      const detailRes = await api.get(`/api/incidents/${incidentId}`);
      setSelectedIncident(detailRes.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Assign nearest response team to incident
  const handleAssignTeam = async (incidentId, resourceId) => {
    setIsLoadingAction(true);
    try {
      await api.post(`/api/incidents/${incidentId}/assign`, {
        resource_id: resourceId,
        comment: 'Dispatched via Operator Quick Assign',
      });
      // Refresh data immediately
      await fetchData(true);
      // Reload updated detail
      const detailRes = await api.get(`/api/incidents/${incidentId}`);
      setSelectedIncident(detailRes.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign team');
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Calculate summary metrics
  const activeCount = incidents.filter((i) => ['Reported', 'Assigned', 'In Progress'].includes(i.status)).length;
  const criticalCount = incidents.filter((i) => i.priority_level === 'Critical').length;
  const assignedCount = incidents.filter((i) => ['Assigned', 'In Progress'].includes(i.status)).length;
  const resolvedCount = incidents.filter((i) => i.status === 'Resolved').length;
  const availableTeamsCount = teams.filter((t) => t.status === 'Available').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Bar: Title & Live Polling Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F3A4D] tracking-tight">
            Dehradun Emergency Command Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time incident dispatch, GIS hazard tracking, and response allocation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Polling Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8E2D9] text-xs shadow-card">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="text-gray-600 font-medium">Live (10s poll)</span>
            <span className="text-[10px] text-gray-400 border-l pl-2 ml-1">
              {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <button
            onClick={() => fetchData(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-[#1F3A4D] border border-[#E8E2D9] shadow-card transition-colors disabled:opacity-50"
            title="Manual refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 1. Open-Meteo Weather Alert Banner */}
      <WeatherBanner weather={weather} />

      {/* 2. Summary Metric Cards */}
      <SummaryCards
        stats={{
          active: activeCount,
          critical: criticalCount,
          assigned: assignedCount,
          resolved: resolvedCount,
          availableTeams: availableTeamsCount,
          totalTeams: teams.length,
        }}
        onFilterByStatus={(st) => setStatusFilter(st)}
        onFilterByPriority={(pr) => setPriorityFilter(pr)}
      />

      {/* 3. Main Operational Workspace (Map + Table vs Detail Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Map & Incident Queue Table */}
        <div className={`space-y-6 transition-all ${selectedIncident ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          {/* Map View */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1F3A4D] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-700" />
                Live Incident Map & Deployed Response Units
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                Dehradun, Uttarakhand
              </span>
            </div>

            <IncidentMap
              incidents={incidents}
              teams={teams}
              blockages={blockages}
              selectedIncident={selectedIncident}
              onSelectIncident={handleSelectIncident}
              height="440px"
              showLegend={true}
            />
          </div>

          {/* Incidents Queue Table */}
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

        {/* Right Column: Incident Detail & Dispatch Panel */}
        {selectedIncident && (
          <div className="lg:col-span-5 sticky top-20 max-h-[calc(100vh-6rem)]">
            <IncidentDetailPanel
              incident={selectedIncident}
              onClose={() => setSelectedIncident(null)}
              onUpdateStatus={handleUpdateStatus}
              onAssignTeam={handleAssignTeam}
              isLoadingAction={isLoadingAction}
            />
          </div>
        )}
      </div>
    </div>
  );
}
