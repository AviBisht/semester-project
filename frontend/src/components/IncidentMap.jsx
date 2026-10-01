import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Truck, Flame, HeartPulse, LifeBuoy, AlertTriangle } from 'lucide-react';

// Default Dehradun, Uttarakhand center
const DEHRADUN_CENTER = [30.3165, 78.0322];

// Component to handle map clicks for citizen report page
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect({
          latitude: Number(e.latlng.lat.toFixed(5)),
          longitude: Number(e.latlng.lng.toFixed(5)),
        });
      }
    },
  });
  return null;
}

// Component to recenter map smoothly when selected item changes
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

// Generator for custom HTML incident markers colored by priority
function createIncidentMarkerIcon(priorityLevel, isSelected = false) {
  let color = '#5E9C76'; // Low (sage green)
  let border = '#3D6F50';

  if (priorityLevel === 'Critical') {
    color = '#D9534F'; // Soft red
    border = '#9C2A27';
  } else if (priorityLevel === 'High') {
    color = '#E67E22'; // Soft orange
    border = '#A85208';
  } else if (priorityLevel === 'Medium') {
    color = '#E5B83B'; // Soft amber
    border = '#9E7915';
  }

  const ringStyle = isSelected
    ? `box-shadow: 0 0 0 4px #1F3A4D, 0 3px 10px rgba(0,0,0,0.35);`
    : `box-shadow: 0 2px 6px rgba(0,0,0,0.25);`;

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        border: 2px solid #FFFFFF;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: bold;
        ${ringStyle}
        transition: transform 0.2s;
      ">
        !
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

// Generator for response team markers (square shape with distinct icon/initial)
function createTeamMarkerIcon(type, status) {
  let bg = '#B8D8C4'; // Available (soft green)
  let text = '#234A35';
  let label = 'R';

  if (type === 'ambulance') {
    label = '🚑';
  } else if (type === 'fire unit') {
    label = '🚒';
  } else {
    label = '🛟';
  }

  if (status === 'Assigned') {
    bg = '#A9CCE3'; // Soft blue
    text = '#1F3A4D';
  } else if (status === 'Busy') {
    bg = '#E8E2D9'; // Neutral gray
    text = '#5A534B';
  }

  return L.divIcon({
    className: 'custom-team-icon',
    html: `
      <div style="
        background-color: ${bg};
        border: 2px solid #FFFFFF;
        color: ${text};
        width: 28px;
        height: 28px;
        border-radius: 7px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        cursor: pointer;
      ">
        ${label}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -15],
  });
}

// Marker for newly dropped pin on report page
const droppedPinIcon = L.divIcon({
  className: 'custom-dropped-pin',
  html: `
    <div style="
      background-color: #1F3A4D;
      border: 3px solid #FAF7F2;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: #F2C6CF;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function IncidentMap({
  incidents = [],
  teams = [],
  blockages = [],
  selectedIncident = null,
  onSelectIncident = null,
  onLocationSelect = null,
  droppedLocation = null,
  center = DEHRADUN_CENTER,
  zoom = 13,
  height = '500px',
  showLegend = true,
}) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[#E8E2D9] shadow-soft" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Recenter helper */}
        <MapRecenter center={center} zoom={zoom} />

        {/* Click handler if selectable */}
        {onLocationSelect && <MapClickHandler onLocationSelect={onLocationSelect} />}

        {/* Dropped location pin (for Citizen report page) */}
        {droppedLocation && droppedLocation.latitude && droppedLocation.longitude && (
          <Marker
            position={[droppedLocation.latitude, droppedLocation.longitude]}
            icon={droppedPinIcon}
          >
            <Popup>
              <div className="text-xs font-semibold">
                Selected Incident Location<br />
                {droppedLocation.latitude}, {droppedLocation.longitude}
              </div>
            </Popup>
          </Marker>
        )}

        {/* 1. Road Blockage Zones: Translucent red circles (300m radius) */}
        {blockages.map((blockage) => (
          <Circle
            key={`blockage-${blockage.id}`}
            center={[blockage.latitude, blockage.longitude]}
            radius={300}
            pathOptions={{
              color: '#DC3545',
              fillColor: '#DC3545',
              fillOpacity: 0.22,
              weight: 2,
              dashArray: '4, 4',
            }}
          >
            <Popup>
              <div className="text-xs p-1">
                <span className="font-bold text-red-700 block mb-0.5">
                  ⛔ Road Blocked Zone ({blockage.tracking_id})
                </span>
                <p className="text-gray-700">{blockage.description}</p>
                <span className="text-[10px] text-gray-500 block mt-1">Radius: ~300 meters</span>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* 2. Response Teams Markers (Square shape with vehicle icon) */}
        {teams.map((team) => (
          <Marker
            key={`team-${team.id}`}
            position={[team.latitude, team.longitude]}
            icon={createTeamMarkerIcon(team.type, team.status)}
          >
            <Popup>
              <div className="text-xs p-1">
                <div className="font-bold text-[#1F3A4D]">{team.name}</div>
                <div className="capitalize text-gray-600 mt-0.5">
                  Type: <span className="font-semibold">{team.type}</span>
                </div>
                <div className="mt-0.5">
                  Status:{' '}
                  <span
                    className={`font-semibold ${
                      team.status === 'Available'
                        ? 'text-emerald-700'
                        : team.status === 'Assigned'
                        ? 'text-sky-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {team.status}
                  </span>
                </div>
                {team.contact_number && (
                  <div className="text-gray-500 text-[11px] mt-1">
                    📞 {team.contact_number}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 3. Incidents Markers (Round pin colored by priority) */}
        {incidents.map((incident) => {
          const isSelected = selectedIncident && selectedIncident.id === incident.id;
          return (
            <Marker
              key={`incident-${incident.id}`}
              position={[incident.latitude, incident.longitude]}
              icon={createIncidentMarkerIcon(incident.priority_level, isSelected)}
              eventHandlers={{
                click: () => {
                  if (onSelectIncident) {
                    onSelectIncident(incident);
                  }
                },
              }}
            >
              <Popup>
                <div className="text-xs p-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#1F3A4D]">{incident.tracking_id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 font-semibold">
                      {incident.priority_level} ({incident.priority_score})
                    </span>
                  </div>
                  <div className="font-semibold text-gray-800 mt-1">{incident.type}</div>
                  <p className="text-gray-600 text-[11px] mt-0.5 line-clamp-2">
                    {incident.description}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Status: {incident.status}</span>
                    {onSelectIncident && (
                      <button
                        onClick={() => onSelectIncident(incident)}
                        className="text-sky-700 font-bold hover:underline"
                      >
                        View Details &rarr;
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-[#E8E2D9] text-[11px] shadow-soft max-w-[280px]">
          <span className="font-bold text-gray-800 block mb-1.5 uppercase tracking-wider text-[10px]">
            Map Legend
          </span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9534F] border border-white"></span>
              <span>Critical (60+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E67E22] border border-white"></span>
              <span>High (40-59)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5B83B] border border-white"></span>
              <span>Medium (25-39)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5E9C76] border border-white"></span>
              <span>Low (&lt;25)</span>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-2 pt-2 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#B8D8C4] flex items-center justify-center text-[9px] border">
                🚑
              </span>
              <span>Emergency Teams</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400/40 border border-red-600"></span>
              <span>Road Blockage (300m)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
