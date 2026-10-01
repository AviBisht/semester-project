import React from 'react';
import { CloudRain, AlertTriangle, Wind, Droplets, CheckCircle2 } from 'lucide-react';

export default function WeatherBanner({ weather }) {
  if (!weather) return null;

  const isWarning = weather.is_warning;

  return (
    <div
      className={`rounded-xl border p-4 mb-6 transition-all duration-300 ${
        isWarning
          ? 'bg-[#FDF2F4] border-[#F2C6CF] text-[#6B2B3A]'
          : 'bg-[#F2F7F4] border-[#B8D8C4] text-[#234A35]'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left side: status icon & city & condition */}
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg ${
              isWarning ? 'bg-[#F2C6CF] text-[#6B2B3A]' : 'bg-[#B8D8C4] text-[#234A35]'
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
              <span className="font-semibold text-sm tracking-wide uppercase">
                Weather Advisory &bull; {weather.city}
              </span>
              {weather.is_mock && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Fallback Mode
                </span>
              )}
            </div>
            <p className="text-sm mt-0.5 font-medium">
              {weather.warning_message}
            </p>
          </div>
        </div>

        {/* Right side: weather metrics */}
        <div className="flex items-center gap-4 text-xs md:text-sm divide-x divide-black/10 pt-2 md:pt-0">
          <div className="flex items-center gap-1.5 pl-0">
            <span className="font-medium">Temp:</span>
            <span className="font-semibold">{weather.temperature}°C</span>
          </div>

          <div className="flex items-center gap-1.5 pl-4">
            <Droplets className="w-3.5 h-3.5 opacity-70" />
            <span className="font-medium">Rain/Precip:</span>
            <span className="font-semibold">{weather.precipitation ?? weather.rain} mm/h</span>
          </div>

          <div className="flex items-center gap-1.5 pl-4">
            <Wind className="w-3.5 h-3.5 opacity-70" />
            <span className="font-medium">Wind:</span>
            <span className="font-semibold">{weather.wind_speed} km/h</span>
          </div>

          <div className="flex items-center gap-1.5 pl-4">
            <span className="font-semibold text-xs px-2 py-0.5 rounded-full bg-white/70 border border-current/20">
              {weather.weather_description}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
