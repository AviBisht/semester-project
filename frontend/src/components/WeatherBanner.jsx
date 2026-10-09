import React from 'react';
import { CloudRain, AlertTriangle, Wind, Droplets, CheckCircle2 } from 'lucide-react';

export default function WeatherBanner({ weather }) {
  if (!weather) return null;

  const isWarning = weather.is_warning;

  return (
    <div
      className={`rounded-xl border p-4 mb-6 transition-all duration-300 shadow-card ${
        isWarning
          ? 'bg-[#3D2517]/80 border-[#C47A35] text-[#F0E6D8]'
          : 'bg-[#242321] border-[#594538]/80 text-[#F0E6D8]'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left side: status icon & city & condition */}
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shadow-sm ${
              isWarning ? 'bg-[#C47A35] text-[#191817]' : 'bg-[#594538] text-[#F0E6D8]'
            }`}
          >
            {isWarning ? (
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            ) : (
              <CloudRain className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs tracking-wider uppercase text-[#B5A493]">
                Weather Advisory &bull; {weather.city}
              </span>
              {weather.is_mock && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#594538]/60 text-[#F0E6D8] border border-[#C47A35]/50 font-mono">
                  Fallback Mode
                </span>
              )}
            </div>
            <p className="text-sm mt-0.5 font-medium text-[#F0E6D8]">
              {weather.warning_message}
            </p>
          </div>
        </div>

        {/* Right side: weather metrics */}
        <div className="flex items-center gap-4 text-xs md:text-sm divide-x divide-[#594538]/60 pt-2 md:pt-0">
          <div className="flex items-center gap-1.5 pl-0">
            <span className="font-medium text-[#B5A493]">Temp:</span>
            <span className="font-semibold text-[#F0E6D8]">{weather.temperature}°C</span>
          </div>

          <div className="flex items-center gap-1.5 pl-4">
            <Droplets className="w-3.5 h-3.5 text-[#C47A35]" />
            <span className="font-medium text-[#B5A493]">Precip:</span>
            <span className="font-semibold text-[#F0E6D8]">{weather.precipitation ?? weather.rain} mm/h</span>
          </div>

          <div className="flex items-center gap-1.5 pl-4">
            <Wind className="w-3.5 h-3.5 text-[#B5A493]" />
            <span className="font-medium text-[#B5A493]">Wind:</span>
            <span className="font-semibold text-[#F0E6D8]">{weather.wind_speed} km/h</span>
          </div>

          <div className="flex items-center gap-1.5 pl-4">
            <span className="font-semibold text-xs px-2.5 py-0.5 rounded-full bg-[#191817] border border-[#594538] text-[#F0E6D8]">
              {weather.weather_description}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
