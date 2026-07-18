'use client';

import { useState, useEffect } from 'react';
import { getSystemHealthData, ISystemHealthData } from '@/api/admin';
import { CheckCircle2, Activity, Loader2, Database, Clock, HardDrive, Inbox } from 'lucide-react';

export default function PlatformHealth() {
  const [health, setHealth] = useState<ISystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(true);

  const fetchHealth = async () => {
    try {
      setPulse(true);
      const res = await getSystemHealthData();
      if (res.success) {
        setHealth(res.data);
      }
    } catch (err) {
      console.error('Failed to retrieve server health metrics:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setPulse(false), 1000);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const services = [
    {
      id: 'server-uptime',
      name: 'Server Uptime',
      icon: Clock,
      value: health?.uptime || '...',
      status: 'operational',
      detail: 'Uptime index',
    },
    {
      id: 'db-latency',
      name: 'Database Cluster',
      icon: Database,
      value: health?.dbLatency || '...',
      status: 'operational',
      detail: 'Ping latency',
    },
    {
      id: 'bull-queue',
      name: 'BullMQ Email Queue',
      icon: Inbox,
      value: health ? `${health.bullJobsCount.active} active / ${health.bullJobsCount.waiting} waiting` : '...',
      status: 'operational',
      detail: 'Job counts',
    },
    {
      id: 'memory-rss',
      name: 'Memory RSS',
      icon: HardDrive,
      value: health?.memory.rss || '...',
      status: 'operational',
      detail: `Heap: ${health?.memory.heapUsed || '...'} / ${health?.memory.heapTotal || '...'}`,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">System Health</h3>
          <p className="text-xs text-slate-400 dark:text-slate-450 mt-0.5">Live platform & database monitors</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Activity className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span className="text-slate-500 dark:text-slate-400">Live</span>
          <span className={`w-2 h-2 rounded-full bg-emerald-400 ${pulse ? 'animate-ping' : 'animate-pulse'}`} />
        </div>
      </div>

      {loading && !health ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/70 dark:hover:bg-slate-850/40 transition-colors border border-transparent dark:border-slate-850"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">{service.name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{service.detail}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{service.value}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450">
                    OK
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
