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
import { Activity, ShieldCheck, AlertCircle, BarChart3, Database, Calendar, FileText, ArrowDownRight } from 'lucide-react';

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
      <div className="flex-1 flex flex-col items-center justify-center p-16 text-center text-xs font-mono text-[#5A6354] bg-[#F5F0E5]">
        <div className="w-6 h-6 border-2 border-[#697C58] border-t-transparent rounded-full animate-spin mb-3 mx-auto" />
        <p>Generating Dehradun District Operational Telemetry Report...</p>
      </div>
    );
  }

  // Curated Palette (Olive, Terracotta, Sage, Restrained Red, Amber, Charcoal)
  const barColors = [
    '#697C58', // Deep Olive
    '#CF806B', // Terracotta
    '#8C9D78', // Sage Green
    '#DC2626', // Restrained Red
    '#D97706', // Amber
    '#343B30', // Charcoal Green
  ];

  const total = data?.total_incidents || 0;
  const active = data?.active_incidents || 0;
  const resolved = data?.resolved_incidents || 0;
  const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex-1 w-full bg-[#F5F0E5] text-[#343B30] pb-20">
      <div className="bg-[#FCFAF6] border-b border-[#DFD8C8] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#697C58]" />
              <span className="text-[11px] font-mono text-[#5A6354] uppercase tracking-wider font-bold">
                Dehradun District Disaster Management Authority (DDMA) &bull; Intelligence Bureau
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#343B30] tracking-tight">
              Operational Telemetry &amp; Hazard Classification Report
            </h1>
            <p className="text-xs sm:text-sm text-[#5A6354] mt-1 max-w-2xl leading-relaxed">
              Official district response metrics, aggregate incident triage volumes, and hazard distribution across the Dehradun municipal grid.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-[#5A6354]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EFE9DC] border border-[#DFD8C8] rounded-sm">
              <Database className="w-3.5 h-3.5 text-[#697C58]" />
              <span>SQLite Verified Store</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-[#DFD8C8] bg-[#FCFAF6]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DFD8C8]">
          <div className="p-6 sm:p-8">
            <span className="text-[10px] font-mono text-[#5A6354] uppercase tracking-widest font-bold block mb-1">
              TOTAL INCIDENTS LOGGED
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-bold text-[#343B30] tracking-tight">
              {total}
            </div>
            <span className="text-xs text-[#5A6354] mt-2 block font-mono">
              Cumulative intake tickets
            </span>
          </div>

          <div className="p-6 sm:p-8">
            <span className="text-[10px] font-mono text-[#CF806B] uppercase tracking-widest font-bold block mb-1">
              ACTIVE IN TRIAGE / DISPATCH
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-bold text-[#CF806B] tracking-tight">
              {active}
            </div>
            <span className="text-xs text-[#5A6354] mt-2 block font-mono">
              Pending final resolution
            </span>
          </div>

          <div className="p-6 sm:p-8">
            <span className="text-[10px] font-mono text-[#166534] uppercase tracking-widest font-bold block mb-1">
              RESOLVED &amp; CLEARED
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-bold text-[#16A34A] tracking-tight">
              {resolved}
            </div>
            <span className="text-xs text-[#5A6354] mt-2 block font-mono">
              Site mitigation completed
            </span>
          </div>

          <div className="p-6 sm:p-8">
            <span className="text-[10px] font-mono text-[#697C58] uppercase tracking-widest font-bold block mb-1">
              DISTRICT RESOLUTION RATE
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-bold text-[#697C58] tracking-tight">
              {resolutionRate}%
            </div>
            <span className="text-xs text-[#5A6354] mt-2 block font-mono">
              Intake closure ratio
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="border border-[#DFD8C8] bg-[#FCFAF6] rounded-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#DFD8C8] bg-[#EFE9DC]/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#697C58]" />
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-[#343B30]">
                Incident Volume by Hazard Category
              </h2>
            </div>
            <span className="text-xs font-mono text-[#5A6354]">
              Data Scope: Entire Dehradun District Operational History
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#DFD8C8]">
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#5A6354] font-bold block mb-6">
                  Distribution Visualization
                </span>

                <div className="h-80 w-full">
                  {data?.incidents_by_type && data.incidents_by_type.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.incidents_by_type}
                        margin={{ top: 10, right: 10, left: -15, bottom: 45 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DFD8C8" opacity={0.7} />
                        <XAxis
                          dataKey="type"
                          interval={0}
                          angle={-18}
                          textAnchor="end"
                          tick={{ fontSize: 10, fill: '#5A6354', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#DFD8C8' }}
                          height={50}
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
                                <div className="bg-[#FCFAF6] p-3 rounded border border-[#DFD8C8] shadow-md text-xs font-mono">
                                  <span className="font-bold text-[#343B30] block">
                                    {payload[0].payload.type}
                                  </span>
                                  <span className="text-[#5A6354] mt-1 block">
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
                    <div className="h-full flex items-center justify-center text-xs text-[#7C8775] italic font-mono">
                      No incident classifications recorded in database.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#DFD8C8] flex items-center justify-between text-xs font-mono text-[#5A6354]">
                <span>Automated real-time aggregation</span>
                <span>Sorted by ingestion sequence</span>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#5A6354] font-bold block mb-4">
                  Classification Distribution Matrix
                </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="border-b-2 border-[#DFD8C8] text-[10px] text-[#5A6354] uppercase tracking-wider">
                        <th className="pb-3 font-bold">Hazard Category</th>
                        <th className="pb-3 text-right font-bold">Count</th>
                        <th className="pb-3 text-right font-bold">Share</th>
                        <th className="pb-3 pl-3 font-bold">Proportion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFD8C8]">
                      {data?.incidents_by_type && data.incidents_by_type.length > 0 ? (
                        data.incidents_by_type.map((item, idx) => {
                          const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
                          const color = barColors[idx % barColors.length];
                          return (
                            <tr key={item.type} className="hover:bg-[#EFE9DC]/30 transition-colors">
                              <td className="py-3 pr-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="text-[#343B30] font-semibold truncate max-w-[130px] sm:max-w-none">
                                    {item.type}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 text-right font-bold text-[#343B30]">
                                {item.count}
                              </td>
                              <td className="py-3 text-right text-[#5A6354]">
                                {pct}%
                              </td>
                              <td className="py-3 pl-3 w-24">
                                <div className="h-2 w-full bg-[#DFD8C8] rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: color,
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-[#7C8775] italic">
                            No records present.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#DFD8C8] text-[11px] font-mono text-[#5A6354] leading-relaxed">
                Summary generated from Dehradun Emergency Operations Centre live database. No synthetic or interpolated values.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
