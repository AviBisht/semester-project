import React, { useState, useEffect } from 'react';
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
import { BarChart3, CheckCircle2, AlertCircle, ShieldAlert, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-[#C47A35] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#B5A493] font-medium">Aggregating incident analytics...</p>
      </div>
    );
  }

  // Sophisticated Burnt Amber and Earth Brown palette for bar chart
  const barColors = [
    '#C47A35', // Burnt Amber
    '#594538', // Earth Brown
    '#D89B5F', // Light Amber
    '#8C6747', // Warm Brown
    '#E0B083', // Soft Amber-Cream
    '#6E5343', // Deep Earth Brown
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F0E6D8]">
          Emergency Operations Analytics
        </h1>
        <p className="text-xs sm:text-sm text-[#B5A493] mt-1">
          Historical overview of registered incidents across Dehradun municipal divisions.
        </p>
      </div>

      {/* Summary Cards: Resolved vs Active Count */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-[#242321] border border-[#594538] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#B5A493] uppercase tracking-wider">
              Total Incidents
            </span>
            <Activity className="w-4 h-4 text-[#C47A35]" />
          </div>
          <div className="mt-2 text-3xl font-bold text-[#F0E6D8]">
            {data?.total_incidents ?? 0}
          </div>
          <span className="text-[11px] text-[#B5A493] mt-1 block">
            Overall logged reports
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#2A2826] border border-[#C47A35]/60 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#C47A35] uppercase tracking-wider">
              Active Cases
            </span>
            <AlertCircle className="w-4 h-4 text-[#C47A35]" />
          </div>
          <div className="mt-2 text-3xl font-bold text-[#F0E6D8]">
            {data?.active_incidents ?? 0}
          </div>
          <span className="text-[11px] text-[#B5A493] mt-1 block">
            Reported, Assigned, or In Progress
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#242321] border border-[#594538] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9CD4A8] uppercase tracking-wider">
              Resolved Cases
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#9CD4A8]" />
          </div>
          <div className="mt-2 text-3xl font-bold text-[#F0E6D8]">
            {data?.resolved_incidents ?? 0}
          </div>
          <span className="text-[11px] text-[#B5A493] mt-1 block">
            Successfully concluded operations
          </span>
        </div>
      </div>

      {/* Single Bar Chart: Incidents by Type */}
      <div className="bg-[#242321] border border-[#594538] rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4 border-b border-[#594538] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#F0E6D8] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#C47A35]" />
              Incidents by Type
            </h2>
            <span className="text-xs text-[#B5A493]">
              Distribution of emergencies across categories
            </span>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#191817] border border-[#594538] text-[#C47A35]">
            Primary Chart
          </span>
        </div>

        <div className="h-80 w-full mt-2">
          {data?.incidents_by_type && data.incidents_by_type.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.incidents_by_type}
                margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#594538" opacity={0.4} />
                <XAxis
                  dataKey="type"
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  tick={{ fontSize: 11, fill: '#B5A493' }}
                  axisLine={{ stroke: '#594538' }}
                  height={50}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#B5A493' }}
                  axisLine={{ stroke: '#594538' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(196, 122, 53, 0.12)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#191817] p-3 rounded-xl border border-[#594538] shadow-card text-xs">
                          <span className="font-bold text-[#C47A35] block">
                            {payload[0].payload.type}
                          </span>
                          <span className="text-[#F0E6D8] mt-1 block">
                            Count: <strong>{payload[0].value}</strong> incidents
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.incidents_by_type.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={barColors[index % barColors.length]}
                      stroke="#242321"
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#B5A493]">
              No incident data recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
