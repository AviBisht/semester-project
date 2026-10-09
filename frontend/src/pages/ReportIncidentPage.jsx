import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import IncidentMap from '../components/IncidentMap';
import api from '../api';
import {
  ShieldAlert,
  MapPin,
  Users,
  AlertCircle,
  Camera,
  CheckCircle2,
  Navigation,
  ArrowRight,
  Info,
  Check
} from 'lucide-react';

const INCIDENT_TYPES = [
  'Flooding/Waterlogging',
  'Fire',
  'Road Accident',
  'Medical Emergency',
  'Road Blockage',
  'Other'
];

export default function ReportIncidentPage() {
  const navigate = useNavigate();

  // Form states
  const [incidentType, setIncidentType] = useState('Flooding/Waterlogging');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(30.3165); // Default Dehradun center
  const [longitude, setLongitude] = useState(78.0322);
  const [locationName, setLocationName] = useState('Dehradun City Center (Pinned)');
  const [peopleAffected, setPeopleAffected] = useState(1);
  const [vulnerableInvolved, setVulnerableInvolved] = useState(false);
  const [severity, setSeverity] = useState(3);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Submission & Confirmation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle location picking via map click
  const handleMapLocationSelect = (coords) => {
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
    setLocationName(`Custom Pin (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
  };

  // "Use my location" button
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
        setLocationName(`Current Device Location (${lat}, ${lng})`);
      },
      (err) => {
        alert('Could not retrieve current location. Using Dehradun fallback.');
      },
      { timeout: 10000 }
    );
  };

  // Handle photo file selection with client validation
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      let photoUrl = null;

      // 1. Upload photo if selected
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        const uploadRes = await api.post('/api/incidents/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        photoUrl = uploadRes.data.photo_url;
      }

      // 2. Submit incident data
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title & Guidance Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-xs uppercase tracking-widest font-bold text-gray-500 bg-[#E8E2D9]/60 px-3 py-1 rounded-full inline-block mb-2">
          Public Emergency Reporting
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F3A4D]">
          Report a Flood or Emergency Incident
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Submit flood levels, hazard zones, or urgent rescue requirements. No citizen login required. Our dispatch operators triage reports immediately by priority score.
        </p>
      </div>

      {/* Confirmation Modal / Screen */}
      {submittedReport ? (
        <div className="bg-[#FFFFFF] border border-[#B8D8C4] rounded-2xl p-6 sm:p-8 shadow-soft text-center animate-fade-in">
          <div className="w-14 h-14 bg-[#B8D8C4] text-[#234A35] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#1F3A4D]">
            Emergency Report Successfully Registered!
          </h2>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            Your incident has been dispatched to Dehradun municipal emergency responders. Please save your Tracking ID below to track real-time updates.
          </p>

          <div className="my-6 p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] inline-block max-w-xs w-full">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Your Tracking ID
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-bold text-[#1F3A4D] block mt-1">
              {submittedReport.tracking_id}
            </span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-2 inline-block">
              Priority Tier: {submittedReport.priority_level} ({submittedReport.priority_score} pts)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/track?id=${submittedReport.tracking_id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold bg-[#A9CCE3] hover:bg-[#8FBBD9] text-[#1F3A4D] transition-colors shadow-soft"
            >
              Track My Report Now
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => {
                setSubmittedReport(null);
                setDescription('');
                setPhotoFile(null);
                setPhotoPreview(null);
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100 border border-[#E8E2D9] transition-colors"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      ) : (
        /* Report Form Card */
        <div className="bg-[#FFFFFF] border border-[#E8E2D9] rounded-2xl p-6 sm:p-8 shadow-soft">
          {errorMessage && (
            <div className="p-3 mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Incident Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F3A4D] mb-2">
                1. Incident Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {INCIDENT_TYPES.map((type) => {
                  const isSelected = incidentType === type;
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setIncidentType(type)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${isSelected
                          ? 'border-[#1F3A4D] bg-[#A9CCE3]/30 text-[#1F3A4D]'
                          : 'border-[#E8E2D9] bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{type}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#1F3A4D]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F3A4D] mb-1.5">
                2. Situation Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe current water levels, trapped residents, hazards, or landmark references..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-[#E8E2D9] p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A9CCE3] transition-all"
              />
            </div>

            {/* 3. Location Picker (Map Click + "Use my location" button) */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F3A4D]">
                  3. Incident Location <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 font-mono">
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </span>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FAF7F2] hover:bg-[#E8E2D9] text-[#1F3A4D] border border-[#E8E2D9] transition-colors"
                  >
                    <Navigation className="w-3 h-3 text-sky-700" />
                    Use My Location
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 mb-2 flex items-center gap-1.5">
                <Info className="w-3 h-3 text-[#1F3A4D]" />
                <span>Click anywhere on the map to accurately drop a pinpoint at the incident site.</span>
              </div>

              {/* Leaflet map with dropped pin */}
              <IncidentMap
                center={[latitude, longitude]}
                zoom={14}
                height="280px"
                droppedLocation={{ latitude, longitude }}
                onLocationSelect={handleMapLocationSelect}
                showLegend={false}
              />
            </div>

            {/* 4. Impact metrics: People Affected & Vulnerable Groups */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F3A4D] mb-1.5">
                  4. Estimated People Affected
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={peopleAffected}
                    onChange={(e) => setPeopleAffected(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-sm rounded-xl border border-[#E8E2D9] pl-9 pr-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A9CCE3]"
                  />
                </div>
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Scoring adds 1 point per person (capped at +20).
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1F3A4D] mb-1.5">
                  5. Vulnerable Groups Involved?
                </label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setVulnerableInvolved(true)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${vulnerableInvolved
                        ? 'bg-[#F2C6CF]/50 border-[#6B2B3A] text-[#6B2B3A]'
                        : 'border-[#E8E2D9] bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Yes (Elderly / Children / Disabled)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVulnerableInvolved(false)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${!vulnerableInvolved
                        ? 'bg-[#FAF7F2] border-[#1F3A4D] text-[#1F3A4D]'
                        : 'border-[#E8E2D9] bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    No
                  </button>
                </div>
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Assigns +15 priority points if vulnerable individuals are at risk.
                </span>
              </div>
            </div>

            {/* 6. Severity rating 1-5 */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F3A4D] mb-1.5">
                6. Situation Severity Scale (1 - 5)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((level) => {
                  const isSelected = severity === level;
                  return (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setSeverity(level)}
                      className={`py-3 rounded-xl border text-center transition-all ${isSelected
                          ? 'border-[#1F3A4D] bg-[#A9CCE3] text-[#1F3A4D] font-bold shadow-sm'
                          : 'border-[#E8E2D9] bg-white text-gray-700 hover:bg-gray-50 font-medium'
                        }`}
                    >
                      <span className="text-base block">{level}</span>
                      <span className="text-[10px] text-gray-600 block mt-0.5">
                        {level === 1 ? 'Minor' : level === 3 ? 'Moderate' : level === 5 ? 'Severe' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. Optional Photo Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F3A4D] mb-1.5">
                7. Photo Attachment (Optional)
              </label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#FAF7F2] hover:bg-[#E8E2D9] border border-[#E8E2D9] text-[#1F3A4D] transition-colors">
                  <Camera className="w-4 h-4 text-gray-600" />
                  <span>Choose Photo File</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                {photoFile && (
                  <span className="text-xs text-gray-600 font-medium truncate max-w-xs">
                    {photoFile.name}
                  </span>
                )}
              </div>

              {photoPreview && (
                <div className="mt-3 relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Selected preview"
                    className="w-32 h-24 object-cover rounded-lg border border-[#E8E2D9]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2 border-t border-[#E8E2D9]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-[#A9CCE3] hover:bg-[#8FBBD9] text-[#1F3A4D] transition-all shadow-soft flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Registering Incident...</span>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Submit Emergency Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
