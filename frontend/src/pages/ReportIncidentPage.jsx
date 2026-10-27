import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import IncidentMap from '../components/IncidentMap';
import api, { subscribeToAlerts } from '../api';
import {
  setStoredSubscriberToken,
  setStoredSubscriberCoords,
  requestBrowserNotificationPermission,
  registerServiceWorker
} from '../utils/notifications';
import {
  AlertCircle,
  Users,
  Camera,
  CheckCircle2,
  Navigation,
  ArrowRight,
  ShieldAlert,
  Flame,
  HeartPulse,
  Car,
  HelpCircle,
  Waves,
  PhoneCall,
  BellRing
} from 'lucide-react';

const INCIDENT_TYPES = [
  { name: 'Flooding/Waterlogging', icon: Waves },
  { name: 'Fire', icon: Flame },
  { name: 'Road Accident', icon: Car },
  { name: 'Medical Emergency', icon: HeartPulse },
  { name: 'Road Blockage', icon: ShieldAlert },
  { name: 'Other', icon: HelpCircle }
];

export default function ReportIncidentPage() {
  const [incidentType, setIncidentType] = useState('Flooding/Waterlogging');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [locationError, setLocationError] = useState('');
  const [peopleAffected, setPeopleAffected] = useState(1);
  const [vulnerableInvolved, setVulnerableInvolved] = useState(false);
  const [severity, setSeverity] = useState(3);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Emergency Alert Subscription States
  const [alertRadius, setAlertRadius] = useState(5);
  const [hasConsent, setHasConsent] = useState(false);
  const [isSubscribingAlerts, setIsSubscribingAlerts] = useState(false);
  const [alertSubscribed, setAlertSubscribed] = useState(false);
  const [alertSubDismissed, setAlertSubDismissed] = useState(false);

  const handleSubscribeAlerts = async () => {
    if (!hasConsent || !submittedReport) return;
    setIsSubscribingAlerts(true);
    try {
      // Register service worker and optionally request notification permission
      await registerServiceWorker();
      await requestBrowserNotificationPermission();

      const subPayload = {
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius_km: Number(alertRadius),
        location_name: locationName || `Sector Near Incident ${submittedReport.tracking_id}`,
        consent: true
      };

      const res = await subscribeToAlerts(subPayload);
      if (res.data && res.data.subscriber_token) {
        setStoredSubscriberToken(res.data.subscriber_token);
        setStoredSubscriberCoords({ latitude: Number(latitude), longitude: Number(longitude), radius: alertRadius });
        setAlertSubscribed(true);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to activate emergency alert subscription.');
    } finally {
      setIsSubscribingAlerts(false);
    }
  };

  const handleMapLocationSelect = (coords) => {
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
    setLocationName(`Custom Site (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
    setLocationError('');
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setLatitude(lat);
        setLongitude(lng);
        setLocationName(`Current GPS Pin (${lat}, ${lng})`);
        setLocationError('');
      },
      () => {
        alert('Could not retrieve device location. Please click directly on the map.');
      },
      { timeout: 10000 }
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        setErrorMessage('Only JPG, PNG or WEBP images are allowed.');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Photo must be under 5 MB.');
        e.target.value = '';
        return;
      }
      setErrorMessage('');
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!latitude || !longitude) {
      setLocationError('Please select the incident location on the map.');
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl = null;

      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        const uploadRes = await api.post('/api/incidents/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        photoUrl = uploadRes.data.photo_url;
      }

      const payload = {
        type: incidentType,
        description,
        latitude: Number(latitude),
        longitude: Number(longitude),
        people_affected: Number(peopleAffected),
        vulnerable_involved: vulnerableInvolved,
        severity: Number(severity),
        photo_url: photoUrl
      };

      const res = await api.post('/api/incidents', payload);
      setSubmittedReport(res.data);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.detail || 'Failed to submit incident report. Please verify all fields.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#F5F0E5] text-[#343B30]">
      {/* Emergency Hotline Ticker */}
      <div className="bg-[#FCFAF6] border-b border-[#DFD8C8] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#5A6354]">
          <span className="w-2 h-2 rounded-full bg-[#CF806B]" aria-hidden="true" />
          <span className="text-[#343B30] font-bold">DEHRADUN EMERGENCY INTAKE</span>
          <span className="hidden sm:inline text-[#5A6354]">&bull; Municipal Public Portal</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#5A6354]">
          <span className="flex items-center gap-1 text-[#DC2626] font-bold">
            <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" /> Emergency Hotline: 112
          </span>
          <span className="hidden sm:inline text-[#DFD8C8]">&bull;</span>
          <span className="hidden sm:inline">Disaster Control Room: 1077</span>
        </div>
      </div>

      {submittedReport ? (
        /* Clearance Docket / Confirmation Receipt */
        <div className="max-w-xl mx-auto px-4 py-12">
          <div className="bg-[#FCFAF6] border border-[#DFD8C8] rounded-xl overflow-hidden shadow-subtle">
            <div className="p-6 bg-[#EFE9DC] border-b border-[#DFD8C8] text-center">
              <div className="w-12 h-12 bg-[#EEF2E6] border border-[#BAC7AF] text-[#697C58] rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <span className="text-[10px] font-mono text-[#697C58] uppercase tracking-widest block font-bold">
                INCIDENT REGISTERED IN QUEUE
              </span>
              <h1 className="text-xl font-bold text-[#343B30] mt-1">
                Emergency Dispatch Record Established
              </h1>
              <p className="text-xs text-[#5A6354] mt-1 max-w-sm mx-auto">
                Municipal response operators have received your triage ticket and are analyzing nearby response units.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#DFD8C8] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#5A6354] uppercase block font-semibold">Your Tracking ID</span>
                  <span className="text-2xl font-mono font-bold text-[#697C58]">{submittedReport.tracking_id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#5A6354] uppercase block font-semibold">Triage Priority</span>
                  <span className="text-sm font-mono font-bold text-[#343B30]">
                    {submittedReport.priority_level} ({submittedReport.priority_score} pts)
                  </span>
                </div>
              </div>

              {/* Voluntary Dismissible Emergency Alert Subscription */}
              {!alertSubDismissed && (
                <div className="p-4 rounded-lg bg-[#EEF2E6] border border-[#BAC7AF] space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-[#FCFAF6] border border-[#BAC7AF] text-[#697C58]">
                        <BellRing className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#343B30] font-mono block">
                          Stay Notified: Nearby Emergency Alerts
                        </span>
                        <span className="text-[10px] text-[#5A6354]">
                          Voluntary notifications for operator-verified emergencies
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAlertSubDismissed(true)}
                      className="text-xs text-[#7C8775] hover:text-[#343B30] p-1"
                      title="Dismiss alert prompt"
                    >
                      &times;
                    </button>
                  </div>

                  {alertSubscribed ? (
                    <div className="p-2.5 rounded bg-[#DCFCE7] border border-[#86EFAC] text-xs font-mono text-[#166534] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                      <span>Subscribed to verified emergency alerts within {alertRadius} km of this sector!</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-xs font-mono">
                      <p className="text-[11px] text-[#455239] leading-relaxed">
                        Receive instant notifications when municipal operators verify and approve incidents near your location. Unverified, pending, or rejected reports never trigger public alerts.
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#5A6354]">Alert Radius:</span>
                        <div className="flex gap-1">
                          {[2, 5, 10, 15].map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setAlertRadius(r)}
                              className={`px-2 py-1 rounded text-[10px] font-mono border ${
                                alertRadius === r
                                  ? 'bg-[#697C58] text-white font-bold border-[#697C58]'
                                  : 'bg-[#FCFAF6] text-[#343B30] border-[#DFD8C8]'
                              }`}
                            >
                              {r} km
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="flex items-start gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={hasConsent}
                          onChange={(e) => setHasConsent(e.target.checked)}
                          className="mt-0.5 rounded text-[#697C58] focus:ring-[#697C58]"
                        />
                        <span className="text-[11px] text-[#343B30] leading-snug">
                          I voluntarily consent to receive emergency alerts for this geographic radius.
                        </span>
                      </label>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          disabled={!hasConsent || isSubscribingAlerts}
                          onClick={handleSubscribeAlerts}
                          className="flex-1 py-2 px-3 rounded bg-[#697C58] hover:bg-[#576748] text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40"
                        >
                          {isSubscribingAlerts ? 'Activating...' : 'Enable Verified Alerts'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAlertSubDismissed(true)}
                          className="px-3 py-2 rounded bg-[#FCFAF6] text-[#5A6354] hover:text-[#343B30] text-xs border border-[#DFD8C8]"
                        >
                          Not Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  to={`/track?id=${submittedReport.tracking_id}`}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#697C58] hover:bg-[#576748] text-white font-mono font-bold text-xs text-center flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <span>Track Status Live</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedReport(null);
                    setDescription('');
                    setLatitude(null);
                    setLongitude(null);
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    setAlertSubscribed(false);
                    setAlertSubDismissed(false);
                  }}
                  className="px-4 py-2.5 rounded-lg bg-[#EFE9DC] hover:bg-[#DFD8C8] text-[#343B30] font-mono font-semibold text-xs transition-colors border border-[#DFD8C8]"
                >
                  File Another Incident
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Asymmetric Operational Intake Studio */
        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-6.5rem)]">
            {/* Left Column (5 cols): Incident Specification Form */}
            <div className="lg:col-span-5 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-[#DFD8C8] bg-[#FCFAF6] space-y-6 overflow-y-auto">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#343B30]">
                  Report an Emergency Incident
                </h1>
                <p className="text-xs text-[#5A6354] mt-1 leading-relaxed">
                  Provide ground observation data for the Dehradun district response coordination desk. No account required.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-mono flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Section 01: Category */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#DFD8C8] pb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#697C58] font-bold">
                    01. Hazard Category <span className="text-[#DC2626]">*</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1" role="radiogroup" aria-label="Hazard Classification">
                  {INCIDENT_TYPES.map((item) => {
                    const isSelected = incidentType === item.name;
                    const Icon = item.icon;
                    return (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        key={item.name}
                        onClick={() => setIncidentType(item.name)}
                        className={`p-2.5 rounded text-left text-xs font-mono transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#697C58] ${
                          isSelected
                            ? 'bg-[#EEF2E6] border border-[#697C58] text-[#455239] font-bold'
                            : 'bg-[#FFFFFF] border border-[#DFD8C8] text-[#343B30] hover:border-[#BAC7AF]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#697C58]' : 'text-[#7C8775]'}`} aria-hidden="true" />
                        <span className="truncate">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 02: Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#DFD8C8] pb-1">
                  <label htmlFor="incident-description" className="text-[10px] font-mono uppercase tracking-wider text-[#697C58] font-bold">
                    02. Ground Situation &amp; Landmark Description <span className="text-[#DC2626]">*</span>
                  </label>
                </div>
                <textarea
                  id="incident-description"
                  required
                  rows={4}
                  placeholder="State water levels, trapped residents, road conditions, cross-streets, or landmark references..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs font-mono rounded border border-[#DFD8C8] p-3 bg-[#FFFFFF] text-[#343B30] placeholder-[#7C8775] focus:outline-none focus:border-[#697C58] focus:ring-1 focus:ring-[#697C58]"
                />
              </div>

              {/* Section 03: Risk Assessment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#DFD8C8] pb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#697C58] font-bold">
                    03. Impact &amp; Severity Assessment
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="people-affected" className="block text-[11px] font-mono text-[#5A6354] mb-1 font-semibold">
                      People Affected
                    </label>
                    <input
                      id="people-affected"
                      type="number"
                      min={0}
                      max={500}
                      value={peopleAffected}
                      onChange={(e) => setPeopleAffected(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs font-mono rounded border border-[#DFD8C8] bg-[#FFFFFF] p-2 text-[#343B30] focus:outline-none focus:border-[#697C58] focus:ring-1 focus:ring-[#697C58]"
                    />
                    <span className="text-[10px] font-mono text-[#7C8775] mt-0.5 block">+1 pt/person (max 20)</span>
                  </div>

                  <div>
                    <span className="block text-[11px] font-mono text-[#5A6354] mb-1 font-semibold">
                      Vulnerable Population?
                    </span>
                    <div className="flex gap-1" role="group" aria-label="Vulnerable groups involved">
                      <button
                        type="button"
                        aria-pressed={vulnerableInvolved}
                        onClick={() => setVulnerableInvolved(true)}
                        className={`flex-1 py-2 rounded text-xs font-mono transition-colors ${
                          vulnerableInvolved
                            ? 'bg-[#EEF2E6] border border-[#697C58] text-[#455239] font-bold'
                            : 'bg-[#FFFFFF] border border-[#DFD8C8] text-[#5A6354] hover:bg-[#EFE9DC]'
                        }`}
                      >
                        Yes (+15)
                      </button>
                      <button
                        type="button"
                        aria-pressed={!vulnerableInvolved}
                        onClick={() => setVulnerableInvolved(false)}
                        className={`flex-1 py-2 rounded text-xs font-mono transition-colors ${
                          !vulnerableInvolved
                            ? 'bg-[#EEF2E6] border border-[#697C58] text-[#455239] font-bold'
                            : 'bg-[#FFFFFF] border border-[#DFD8C8] text-[#5A6354] hover:bg-[#EFE9DC]'
                        }`}
                      >
                        No
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-[#7C8775] mt-0.5 block">Elderly, children, medical</span>
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-mono text-[#5A6354] mb-1 font-semibold">
                    Situation Severity Rating (Scale 1 to 5)
                  </span>
                  <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Severity rating from 1 to 5">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={severity === lvl}
                        key={lvl}
                        onClick={() => setSeverity(lvl)}
                        className={`py-2 rounded border text-center font-mono text-xs transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#697C58] ${
                          severity === lvl
                            ? 'bg-[#697C58] border-[#697C58] text-white font-bold'
                            : 'bg-[#FFFFFF] border border-[#DFD8C8] text-[#343B30] hover:bg-[#EEF2E6]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#7C8775] mt-1 px-1">
                    <span>1: Minor</span>
                    <span>3: Moderate</span>
                    <span>5: Critical Threat</span>
                  </div>
                </div>
              </div>

              {/* Section 04: Photo Evidence */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#DFD8C8] pb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#697C58] font-bold">
                    04. Field Photo Evidence (Optional)
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded text-xs font-mono bg-[#FFFFFF] border border-[#DFD8C8] hover:border-[#697C58] text-[#343B30] transition-colors focus-within:ring-2 focus-within:ring-[#697C58]">
                    <Camera className="w-4 h-4 text-[#697C58]" aria-hidden="true" />
                    <span>Select Photo File</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="sr-only"
                    />
                  </label>
                  {photoFile && (
                    <span className="text-xs font-mono text-[#5A6354] truncate max-w-xs">{photoFile.name}</span>
                  )}
                </div>

                {photoPreview && (
                  <div className="mt-2 relative inline-block">
                    <img src={photoPreview} alt="Attached incident observation preview" className="w-28 h-20 object-cover rounded border border-[#DFD8C8]" />
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 bg-[#DC2626] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      aria-label="Remove attached photo"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (7 cols): Geographic Spatial Pin Locator */}
            <div className="lg:col-span-7 flex flex-col bg-[#FCFAF6]">
              {/* Map Locator Masthead */}
              <div className="p-3 bg-[#EFE9DC] border-b border-[#DFD8C8] flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#343B30] block">
                    05. Geographic Hazard Coordinates
                  </span>
                  <span className="text-[10px] text-[#5A6354]">
                    Click directly on the Dehradun map surface to drop a pinpoint.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFFFFF] hover:bg-[#EEF2E6] text-[#697C58] border border-[#BAC7AF] text-xs font-mono font-semibold transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#697C58]" aria-hidden="true" />
                    <span>Device GPS</span>
                  </button>

                  {latitude && longitude ? (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#EEF2E6] text-[#343B30] border border-[#BAC7AF] font-bold">
                      {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] font-bold">
                      MAP PIN REQUIRED
                    </span>
                  )}
                </div>
              </div>

              {/* Inline error notice if submitted without pin */}
              {locationError && (
                <div className="p-2.5 bg-[#FEF2F2] border-b border-[#FECACA] text-[#991B1B] text-xs font-mono flex items-center gap-2 px-4" role="alert">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" aria-hidden="true" />
                  <span>{locationError}</span>
                </div>
              )}

              {/* Full-Height Leaflet Canvas */}
              <div className="flex-1 min-h-[380px] relative bg-[#E8E2D4]">
                <IncidentMap
                  center={[30.3165, 78.0322]}
                  zoom={13}
                  droppedLocation={latitude && longitude ? { latitude, longitude } : null}
                  onLocationSelect={handleMapLocationSelect}
                  showLegend={false}
                />
              </div>

              {/* Bottom Transmission Bar */}
              <div className="p-3.5 bg-[#FCFAF6] border-t border-[#DFD8C8] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="text-[11px] font-mono text-[#5A6354]">
                  {latitude && longitude ? (
                    <span className="text-[#166534] font-bold">✓ Coordinates locked. Ready for dispatch intake.</span>
                  ) : (
                    <span className="text-[#9A3412]">Select location on the map to unlock transmission.</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded bg-[#697C58] hover:bg-[#576748] text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#697C58]"
                >
                  <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                  <span>{isSubmitting ? 'Registering In Queue...' : 'Transmit Incident Report'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
