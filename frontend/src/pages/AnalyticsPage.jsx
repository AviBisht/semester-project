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
        <div className="w-8 h-8 border-3 border-[#A9CCE3] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500 font-medium">Aggregating incident analytics...</p>
      </div>
    );
  }

  // Soft pastel bar colors for the single bar chart
  const barColors = [
    '#A9CCE3', // Soft blue
    '#F2C6CF', // Soft pink
    '#B8D8C4', // Soft green
    '#FCE4D6', // Soft orange
    '#FFF2CD', // Soft yellow
    '#D1E7DD', // Soft mint
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F3A4D]">
          Emergency Operations Analytics
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Historical overview of registered incidents across Dehradun municipal divisions.
        </p>
      </div>

      {/* Summary Cards: Resolved vs Active Count */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D9] shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Incidents
            </span>
            <Activity className="w-4 h-4 text-sky-700" />
          </div>
          <div className="mt-2 text-3xl font-bold text-[#1F3A4D]">
            {data?.total_incidents ?? 0}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Overall logged reports
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#F0F6FA] border border-[#A9CCE3] shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1F3A4D] uppercase tracking-wider">
              Active Cases
            </span>
            <AlertCircle className="w-4 h-4 text-sky-700" />
          </div>
          <div className="mt-2 text-3xl font-bold text-[#1F3A4D]">
            {data?.active_incidents ?? 0}
          </div>
          <span className="text-[11px] text-[#1F3A4D]/75 mt-1 block">
            Reported, Assigned, or In Progress
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#F2F7F4] border border-[#B8D8C4] shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#234A35] uppercase tracking-wider">
              Resolved Cases
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2 text-3xl font-bold text-[#234A35]">
            {data?.resolved_incidents ?? 0}
          </div>
          <span className="text-[11px] text-[#234A35]/75 mt-1 block">
            Successfully concluded operations
          </span>
        </div>
      </div>

      {/* Single Bar Chart: Incidents by Type */}
      <div className="bg-[#FFFFFF] border border-[#E8E2D9] rounded-2xl p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4 border-b border-[#E8E2D9] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#1F3A4D] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-700" />
              Incidents by Type
            </h2>
            <span className="text-xs text-gray-500">
              Distribution of emergencies across categories
            </span>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#FAF7F2] border border-[#E8E2D9] text-[#1F3A4D]">
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E2D9" />
                <XAxis
                  dataKey="type"
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  tick={{ fontSize: 11, fill: '#1F3A4D' }}
                  height={50}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#1F3A4D' }}
                  axisLine={{ stroke: '#E8E2D9' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(169, 204, 227, 0.15)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-xl border border-[#E8E2D9] shadow-soft text-xs">
                          <span className="font-bold text-[#1F3A4D] block">
                            {payload[0].payload.type}
                          </span>
                          <span className="text-gray-600 mt-1 block">
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
                      stroke="#FFFFFF"
                      strokeWidth={1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">
              No incident data recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
