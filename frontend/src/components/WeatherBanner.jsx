import React from 'react';
import { CloudRain, AlertTriangle, Wind, Droplets } from 'lucide-react';

export default function WeatherBanner({ weather }) {
  if (!weather) return null;

  const isWarning = weather.is_warning;
  const precipVal = weather.precipitation !== undefined ? weather.precipitation : weather.rain;

  return (
    <div
      className={`rounded-xl border p-3.5 mb-5 transition-colors shadow-xs ${
        isWarning
          ? 'bg-[#FAF1EE] border-[#E5BFB5] text-[#9A3412]'
          : 'bg-[#EEF2E6] border-[#B2BCA0] text-[#343B30]'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left side: Alert or condition indicator */}
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              isWarning
                ? 'bg-[#CF806B] text-white shadow-xs'
                : 'bg-[#FCFAF6] text-[#697C58] border border-[#B2BCA0]'
            }`}
          >
            {isWarning ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CloudRain className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-xs tracking-wider uppercase font-mono text-[#5A6354]">
                Weather Advisory &bull; {weather.city}
              </span>
              {weather.is_mock && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FCFAF6] text-[#5A6354] border border-[#DFD8C8] font-mono">
                  Offline Fallback
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#343B30] mt-0.5">
              {weather.warning_message || 'Current local meteorological conditions.'}
            </p>
          </div>
        </div>

        {/* Right side: Real-time API telemetry metrics */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs pt-2 lg:pt-0 border-t border-black/5 lg:border-t-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[#5A6354] font-mono">Temp:</span>
            <span className="font-mono font-bold text-[#343B30]">{weather.temperature}°C</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-[#697C58]" />
            <span className="text-[#5A6354] font-mono">Precip:</span>
            <span className="font-mono font-bold text-[#343B30]">{precipVal ?? 0} mm/h</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-[#7C8775]" />
            <span className="text-[#5A6354] font-mono">Wind:</span>
            <span className="font-mono font-bold text-[#343B30]">{weather.wind_speed} km/h</span>
          </div>

          <div className="flex items-center">
            <span className="font-medium text-[11px] px-2 py-0.5 rounded-md bg-[#FCFAF6] border border-[#DFD8C8] text-[#343B30]">
              {weather.weather_description}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
