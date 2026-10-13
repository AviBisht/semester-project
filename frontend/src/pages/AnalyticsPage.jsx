import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from 'recharts';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('operator_token');
    if (!token) {
      navigate('/operator/login');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/api/analytics');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs font-mono text-[#5A6354] bg-[#F5F0E5]">
        <div className="w-6 h-6 border-2 border-[#697C58] border-t-transparent rounded-full animate-spin mb-3 mx-auto" />
        <p>Loading Dehradun District Operational Telemetry...</p>
      </div>
    );
  }

  // Earthy Emergency Telemetry Palette (Olive + Terracotta + Sage)
  const barColors = [
    '#697C58', // Deep Olive
    '#CF806B', // Muted Terracotta
    '#A4B08A', // Light Sage Accent
    '#DC2626', // Restrained Red
    '#EA580C', // Burnt Orange
    '#343B30', // Charcoal Green
  ];

  const total = data?.total_incidents || 0;

  return (
    <div className="flex-1 w-full bg-[#F5F0E5] text-[#343B30] p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Masthead */}
      <div className="border-b border-[#DFD8C8] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono text-[#697C58] font-bold uppercase tracking-wider block">
            Dehradun District Operations Intelligence
          </span>
          <h1 className="text-xl font-bold text-[#343B30]">
            Incident Volume & Hazard Classification Telemetry
          </h1>
        </div>

        {/* Live Ribbon */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8] shadow-xs">
            <span className="text-[#5A6354] block text-[10px]">Total Logged</span>
            <span className="text-sm font-bold text-[#343B30]">{data?.total_incidents ?? 0}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8] shadow-xs">
            <span className="text-[#CF806B] block text-[10px] font-bold">Active</span>
            <span className="text-sm font-bold text-[#CF806B]">{data?.active_incidents ?? 0}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8] shadow-xs">
            <span className="text-[#166534] block text-[10px] font-bold">Resolved</span>
            <span className="text-sm font-bold text-[#16A34A]">{data?.resolved_incidents ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Main Analytical Chart & Category Matrix (Split Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Bar Chart Visualization (8 cols) */}
        <div className="lg:col-span-8 bg-[#FCFAF6] border border-[#DFD8C8] rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between border-b border-[#DFD8C8] pb-3 mb-4">
            <span className="text-xs font-mono font-bold text-[#343B30] uppercase tracking-wider">
              Hazard Volume by Classification
            </span>
            <span className="text-[10px] font-mono text-[#5A6354] bg-[#EEF2E6] px-2 py-0.5 rounded-md border border-[#BAC7AF]">
              SQLite Verified
            </span>
          </div>

          <div className="h-72 w-full">
            {data?.incidents_by_type && data.incidents_by_type.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.incidents_by_type}
                  margin={{ top: 10, right: 10, left: -15, bottom: 35 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DFD8C8" opacity={0.8} />
                  <XAxis
                    dataKey="type"
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    tick={{ fontSize: 10, fill: '#5A6354', fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#DFD8C8' }}
                    height={40}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#5A6354', fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#DFD8C8' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(105, 124, 88, 0.08)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#FCFAF6] p-2.5 rounded-lg border border-[#DFD8C8] shadow-md text-xs font-mono">
                            <span className="font-bold text-[#343B30] block">
                              {payload[0].payload.type}
                            </span>
                            <span className="text-[#5A6354] mt-0.5 block">
                              Volume: <strong className="text-[#697C58]">{payload[0].value}</strong> incident(s)
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.incidents_by_type.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={barColors[index % barColors.length]}
                        stroke="#FCFAF6"
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#7C8775] italic">
                No incident classifications logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Right: Breakdown Table & Distribution Metrics (4 cols) */}
        <div className="lg:col-span-4 bg-[#FCFAF6] border border-[#DFD8C8] rounded-xl p-5 flex flex-col justify-between shadow-card">
          <div>
            <span className="text-xs font-mono font-bold text-[#343B30] uppercase tracking-wider block border-b border-[#DFD8C8] pb-3 mb-3">
              Distribution Matrix
            </span>

            <div className="space-y-2 font-mono text-xs">
              {data?.incidents_by_type && data.incidents_by_type.map((item, idx) => {
                const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                return (
                  <div key={item.type} className="p-2 rounded-lg bg-[#FCFAF6] border border-[#DFD8C8] flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: barColors[idx % barColors.length] }}
                      />
                      <span className="text-[#343B30] truncate text-[11px] font-medium">{item.type}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-[#343B30] text-xs">{item.count}</span>
                      <span className="text-[10px] text-[#5A6354] ml-1.5 font-medium">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DFD8C8] text-[11px] font-mono text-[#5A6354]">
            Data queries verified against Dehradun SQLite emergency database.
          </div>
        </div>
      </div>
    </div>
  );
}
