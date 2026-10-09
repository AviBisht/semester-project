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
    color = '#D9534F'; // Red
    border = '#9C2A27';
  } else if (priorityLevel === 'High') {
    color = '#C47A35'; // Burnt Amber
    border = '#8E4C15';
  } else if (priorityLevel === 'Medium') {
    color = '#D49D42'; // Warm Gold
    border = '#9E7220';
  }

  const ringStyle = isSelected
    ? `box-shadow: 0 0 0 4px #C47A35, 0 4px 14px rgba(0,0,0,0.6);`
    : `box-shadow: 0 2px 8px rgba(0,0,0,0.4);`;

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        border: 2px solid #242321;
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
  let bg = '#594538'; // Available (Earth Brown)
  let text = '#F0E6D8';
  let label = 'R';

  if (type === 'ambulance') {
    label = '🚑';
  } else if (type === 'fire unit') {
    label = '🚒';
  } else {
    label = '🛟';
  }

  if (status === 'Assigned') {
    bg = '#C47A35'; // Burnt Amber
    text = '#191817';
  } else if (status === 'Busy') {
    bg = '#3E342D'; // Dark Muted Earth
    text = '#B5A493';
  }

  return L.divIcon({
    className: 'custom-team-icon',
    html: `
      <div style="
        background-color: ${bg};
        border: 2px solid #242321;
        color: ${text};
        width: 28px;
        height: 28px;
        border-radius: 7px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
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
      background-color: #C47A35;
      border: 3px solid #242321;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: #F0E6D8;
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
    <div className="relative w-full rounded-xl overflow-hidden border border-[#594538]/70 shadow-card" style={{ height }}>
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
              <div className="text-xs font-semibold text-[#F0E6D8]">
                Selected Incident Location<br />
                <span className="text-[#B5A493] font-mono">{droppedLocation.latitude}, {droppedLocation.longitude}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 1. Road Blockage Zones: Translucent amber/red circles (300m radius) */}
        {blockages.map((blockage) => (
          <Circle
            key={`blockage-${blockage.id}`}
            center={[blockage.latitude, blockage.longitude]}
            radius={300}
            pathOptions={{
              color: '#C47A35',
              fillColor: '#C47A35',
              fillOpacity: 0.22,
              weight: 2,
              dashArray: '4, 4',
            }}
          >
            <Popup>
              <div className="text-xs p-1">
                <span className="font-bold text-[#C47A35] block mb-0.5">
                  ⛔ Road Blocked Zone ({blockage.tracking_id})
                </span>
                <p className="text-[#F0E6D8]">{blockage.description}</p>
                <span className="text-[10px] text-[#B5A493] block mt-1 font-mono">Radius: ~300 meters</span>
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
              <div className="text-xs p-1 text-[#F0E6D8]">
                <div className="font-bold text-[#F0E6D8]">{team.name}</div>
                <div className="capitalize text-[#B5A493] mt-0.5">
                  Type: <span className="font-semibold text-[#F0E6D8]">{team.type}</span>
                </div>
                <div className="mt-0.5">
                  Status:{' '}
                  <span
                    className={`font-semibold ${
                      team.status === 'Available'
                        ? 'text-[#9CD4A8]'
                        : team.status === 'Assigned'
                        ? 'text-[#C47A35]'
                        : 'text-[#B5A493]'
                    }`}
                  >
                    {team.status}
                  </span>
                </div>
                {team.contact_number && (
                  <div className="text-[#B5A493] text-[11px] mt-1 font-mono">
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
                <div className="text-xs p-1 text-[#F0E6D8]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#C47A35] font-mono">{incident.tracking_id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#191817] border border-[#594538] font-semibold text-[#F0E6D8]">
                      {incident.priority_level} ({incident.priority_score})
                    </span>
                  </div>
                  <div className="font-semibold text-[#F0E6D8] mt-1">{incident.type}</div>
                  <p className="text-[#B5A493] text-[11px] mt-0.5 line-clamp-2">
                    {incident.description}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-[#B5A493]">Status: {incident.status}</span>
                    {onSelectIncident && (
                      <button
                        onClick={() => onSelectIncident(incident)}
                        className="text-[#C47A35] font-bold hover:underline"
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
        <div className="absolute bottom-3 left-3 z-[1000] bg-[#242321]/95 backdrop-blur-sm p-3 rounded-xl border border-[#594538] text-[11px] shadow-card max-w-[280px] text-[#F0E6D8]">
          <span className="font-bold text-[#F0E6D8] block mb-1.5 uppercase tracking-wider text-[10px]">
            Map Legend
          </span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#B5A493]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9534F] border border-[#242321]"></span>
              <span className="text-[#F0E6D8]">Critical (60+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C47A35] border border-[#242321]"></span>
              <span className="text-[#F0E6D8]">High (40-59)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D49D42] border border-[#242321]"></span>
              <span className="text-[#F0E6D8]">Medium (25-39)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5E9C76] border border-[#242321]"></span>
              <span className="text-[#F0E6D8]">Low (&lt;25)</span>
            </div>
          </div>
          <div className="border-t border-[#594538]/60 mt-2 pt-2 space-y-1 text-[#B5A493]">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-[#594538] flex items-center justify-center text-[10px] border border-[#242321]">
                🚑
              </span>
              <span>Emergency Teams</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#C47A35]/30 border border-[#C47A35]"></span>
              <span>Road Blockage (300m)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
