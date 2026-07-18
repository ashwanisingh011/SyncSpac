'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { aiUsageData, topAiTools } from '../data/mockData';
import { Zap } from 'lucide-react';

export default function AiUsageChart() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">AI Usage</h3>
          <p className="text-xs text-slate-400 dark:text-slate-450 mt-0.5">Weekly requests & token consumption</p>
        </div>
        <div className="flex items-center gap-1.5 bg-pink-50 dark:bg-pink-950/20 text-pink-655 dark:text-pink-400 text-xs font-semibold px-2.5 py-1 rounded-full">
          <Zap className="w-3 h-3" />
          1.2M reqs/mo
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={aiUsageData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
            tickFormatter={(v) => `${v / 1000}K`} />
          <Tooltip
            formatter={(v: unknown) => [(v as number).toLocaleString(), 'Requests']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
          />
          <Bar dataKey="requests" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>

      {/* Top tools */}
      <div className="mt-5 space-y-2.5">
        <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Top AI Tools</p>
        {topAiTools.map((tool) => (
          <div key={tool.name} className="flex items-center gap-3">
            <span className="text-xs text-slate-655 dark:text-slate-350 w-36 truncate">{tool.name}</span>
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all"
                style={{ width: `${tool.pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 w-8 text-right">{tool.pct}%</span>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        {[
          { label: 'Total Tokens', value: '257M' },
          { label: 'Avg Latency', value: '680ms' },
          { label: 'Error Rate', value: '0.3%' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-sm font-bold text-slate-800 dark:text-white">{s.value}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-450">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
