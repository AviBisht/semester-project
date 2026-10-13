import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

const DEHRADUN_CENTER = [30.3165, 78.0322];

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

function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

function createIncidentMarkerIcon(priorityLevel, isSelected = false) {
  let color = '#16A34A'; // Low

  if (priorityLevel === 'Critical') {
    color = '#DC2626';
  } else if (priorityLevel === 'High') {
    color = '#EA580C';
  } else if (priorityLevel === 'Medium') {
    color = '#D97706';
  }

  const ringStyle = isSelected
    ? `box-shadow: 0 0 0 3px #697C58, 0 0 10px rgba(105, 124, 88, 0.55);`
    : `box-shadow: 0 2px 5px rgba(52, 59, 48, 0.25);`;

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        border: 2px solid #FFFFFF;
        width: ${isSelected ? '26px' : '22px'};
        height: ${isSelected ? '26px' : '22px'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-size: 10px;
        font-weight: 800;
        font-family: ui-monospace, monospace;
        ${ringStyle}
        transition: all 0.15s ease;
      ">
        !
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

function createTeamMarkerIcon(type, status) {
  let border = '#697C58';
  let label = 'R';

  if (type === 'ambulance') {
    label = '🚑';
  } else if (type === 'fire unit') {
    label = '🚒';
  } else {
    label = '🛟';
  }

  if (status === 'Assigned') {
    border = '#EA580C';
  } else if (status === 'Busy') {
    border = '#7C8775';
  }

  return L.divIcon({
    className: 'custom-team-icon',
    html: `
      <div style="
        background-color: #FCFAF6;
        border: 2px solid ${border};
        width: 26px;
        height: 26px;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        box-shadow: 0 2px 6px rgba(52, 59, 48, 0.15);
        cursor: pointer;
      ">
        ${label}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

const droppedPinIcon = L.divIcon({
  className: 'custom-dropped-pin',
  html: `
    <div style="
      background-color: #697C58;
      border: 2px solid #FFFFFF;
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(52, 59, 48, 0.28);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background: #FFFFFF;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
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
  height = '100%',
  showLegend = true,
}) {
  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden bg-[#E8E2D4]">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={center} zoom={zoom} />

        {onLocationSelect && <MapClickHandler onLocationSelect={onLocationSelect} />}

        {droppedLocation && droppedLocation.latitude && droppedLocation.longitude && (
          <Marker
            position={[droppedLocation.latitude, droppedLocation.longitude]}
            icon={droppedPinIcon}
          >
            <Popup>
              <div className="text-xs font-semibold text-[#343B30]">
                Selected Incident Coordinates<br />
                <span className="text-[#697C58] font-mono text-[11px] font-bold">{droppedLocation.latitude}, {droppedLocation.longitude}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Road Blockage Zones (300m radius) */}
        {blockages.map((blockage) => (
          <Circle
            key={`blockage-${blockage.id}`}
            center={[blockage.latitude, blockage.longitude]}
            radius={300}
            pathOptions={{
              color: '#DC2626',
              fillColor: '#EF4444',
              fillOpacity: 0.15,
              weight: 1.5,
              dashArray: '3, 4',
            }}
          >
            <Popup>
              <div className="text-xs p-1">
                <span className="font-bold text-[#991B1B] font-mono block mb-0.5">
                  ⛔ ROAD BLOCKAGE [{blockage.tracking_id}]
                </span>
                <p className="text-[#343B30]">{blockage.description}</p>
                <span className="text-[10px] text-[#5A6354] font-mono block mt-1">Radius: ~300m</span>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Teams Markers */}
        {teams.map((team) => (
          <Marker
            key={`team-${team.id}`}
            position={[team.latitude, team.longitude]}
            icon={createTeamMarkerIcon(team.type, team.status)}
          >
            <Popup>
              <div className="text-xs p-1 text-[#343B30]">
                <div className="font-bold text-[#343B30]">{team.name}</div>
                <div className="text-[11px] text-[#5A6354] capitalize mt-0.5">
                  Unit: <strong className="text-[#343B30]">{team.type}</strong> &bull; Status:{' '}
                  <span className={team.status === 'Available' ? 'text-[#16A34A] font-semibold' : 'text-[#EA580C] font-semibold'}>
                    {team.status}
                  </span>
                </div>
                {team.contact_number && (
                  <div className="text-[#5A6354] text-[10px] font-mono mt-1">
                    Hotline: {team.contact_number}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Incidents Markers */}
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
                <div className="text-xs p-1 text-[#343B30] max-w-[210px]">
                  <div className="flex items-center justify-between gap-1 border-b border-[#DFD8C8] pb-1 mb-1">
                    <span className="font-bold font-mono text-[#697C58]">{incident.tracking_id}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EEF2E6] text-[#343B30] font-semibold">
                      {incident.priority_score} pts
                    </span>
                  </div>
                  <div className="font-semibold text-[#343B30] text-xs">{incident.type}</div>
                  <p className="text-[#5A6354] text-[11px] mt-0.5 line-clamp-2">
                    {incident.description}
                  </p>
                  <div className="mt-1.5 pt-1 border-t border-[#DFD8C8] flex items-center justify-between">
                    <span className="text-[10px] font-medium text-[#5A6354]">{incident.status}</span>
                    {onSelectIncident && (
                      <button
                        onClick={() => onSelectIncident(incident)}
                        className="text-[11px] text-[#697C58] hover:underline font-bold"
                      >
                        Inspect &rarr;
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Tactical Legend (HUD style) */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-[#FCFAF6]/95 backdrop-blur-md px-2.5 py-1.5 rounded-md border border-[#DFD8C8] text-[10px] font-mono text-[#5A6354] shadow-xs pointer-events-auto">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[#343B30]">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" /> Crit
            </span>
            <span className="flex items-center gap-1 text-[#343B30]">
              <span className="w-2 h-2 rounded-full bg-[#EA580C]" /> High
            </span>
            <span className="flex items-center gap-1 text-[#343B30]">
              <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Med
            </span>
            <span className="flex items-center gap-1 text-[#343B30]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Low
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
