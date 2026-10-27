import React from 'react';
import { CloudRain, AlertTriangle, Wind, Droplets } from 'lucide-react';

export default function WeatherBanner({ weather }) {
  if (!weather) return null;

  const isWarning = weather.is_warning;
  const precipVal = weather.precipitation !== undefined ? weather.precipitation : weather.rain;

  return (
    <div
      role="region"
      aria-label="Meteorological Telemetry & Weather Advisory"
      className={`rounded-md border px-3 py-2 mb-4 text-xs font-mono transition-colors ${
        isWarning
          ? 'bg-[#FAF1EE] border-[#E5BFB5] text-[#9A3412]'
          : 'bg-[#FCFAF6] border-[#DFD8C8] text-[#343B30]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`p-1 rounded shrink-0 ${
              isWarning
                ? 'bg-[#CF806B] text-white'
                : 'bg-[#EEF2E6] text-[#697C58] border border-[#BAC7AF]'
            }`}
          >
            {isWarning ? (
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <CloudRain className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-[#343B30] uppercase text-[10px] tracking-wider">
              {weather.city || 'Dehradun'} Weather:
            </span>
            <span className={isWarning ? 'font-bold text-[#9A3412]' : 'text-[#5A6354]'}>
              {weather.warning_message || weather.weather_description || 'Routine conditions.'}
            </span>
            {weather.is_mock && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-[#EFE9DC] text-[#7C8775] border border-[#DFD8C8]">
                Offline Cache
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-[#5A6354] shrink-0 border-t sm:border-t-0 border-[#DFD8C8]/60 pt-1 sm:pt-0">
          <div className="flex items-center gap-1">
            <span>Temp:</span>
            <span className="font-bold text-[#343B30]">{weather.temperature}°C</span>
          </div>

          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-[#697C58]" aria-hidden="true" />
            <span>Precip:</span>
            <span className="font-bold text-[#343B30]">{precipVal ?? 0} mm/h</span>
          </div>

          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3 text-[#7C8775]" aria-hidden="true" />
            <span>Wind:</span>
            <span className="font-bold text-[#343B30]">{weather.wind_speed} km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
