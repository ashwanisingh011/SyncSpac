'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getUserGrowthData, IUserGrowthData } from '@/api/admin';
import { TrendingUp, Users, Loader2 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-lg">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-450 mb-1">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-655 dark:text-slate-400">{p.name}:</span>
            <span className="font-semibold text-slate-800 dark:text-white">
              {p.value} signups
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function UserGrowthChart() {
  const [data, setData] = useState<IUserGrowthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getUserGrowthData();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load user growth stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalSignups = data.reduce((acc, curr) => acc + curr.signups, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">User Growth</h3>
          <p className="text-xs text-slate-400 dark:text-slate-450 mt-0.5">Daily signups for the last 30 days</p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full">
          <TrendingUp className="w-3 h-3" />
          +8.7% MoM
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Signups', value: loading ? '...' : totalSignups.toLocaleString(), sub: 'Last 30 days', icon: Users },
          { label: 'Avg Signups / Day', value: loading ? '...' : (totalSignups / 30).toFixed(1), sub: 'Daily average' },
          { label: 'Growth Status', value: 'Healthy', sub: 'Active' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-lg font-bold text-slate-805 dark:text-white">{s.value}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-450 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[220px]">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="signups" name="New Users" stroke="#6366f1"
              strokeWidth={2} fill="url(#colorSignups)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
