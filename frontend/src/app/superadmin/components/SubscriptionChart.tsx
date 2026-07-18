'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { IAdminStats } from '@/api/admin';

interface SubscriptionChartProps {
  stats?: IAdminStats | null;
}

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.08) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-semibold" fontSize={11}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function SubscriptionChart({ stats }: SubscriptionChartProps) {
  const distribution = stats?.planDistribution;
  const hasRealData = distribution && Object.values(distribution).some(v => v > 0);

  const rawData = hasRealData ? [
    { name: 'Free', value: distribution.free || 0, fill: '#94a3b8' },
    { name: 'Pro', value: distribution.pro || 0, fill: '#818cf8' },
    { name: 'Business', value: distribution.business || 0, fill: '#60a5fa' },
    { name: 'Enterprise', value: distribution.enterprise || 0, fill: '#34d399' },
  ] : [
    { name: 'Free', value: 28, fill: '#94a3b8' },
    { name: 'Pro', value: 26, fill: '#818cf8' },
    { name: 'Business', value: 34, fill: '#60a5fa' },
    { name: 'Enterprise', value: 12, fill: '#34d399' },
  ];

  const totalVal = rawData.reduce((acc, curr) => acc + curr.value, 0);
  const data = rawData.map(d => ({
    ...d,
    pct: totalVal ? Math.round((d.value / totalVal) * 100) : 0
  }));

  const activeSubsLabel = stats?.activeSubs !== undefined ? stats.activeSubs.toLocaleString() : '3,672';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Subscription Plans</h3>
        <p className="text-xs text-slate-400 dark:text-slate-450 mt-0.5">Distribution across {hasRealData ? totalVal.toLocaleString() : activeSubsLabel} active subscriptions</p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown) => [`${value as number} accounts`, 'Active']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.fill }} />
            <span className="text-xs text-slate-600 dark:text-slate-350 font-medium">{item.name}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
