'use client';

import PlatformHealth from '../components/PlatformHealth';
import {
  Cpu,
  Database,
  Inbox,
  Info,
} from 'lucide-react';

export default function SuperAdminSystemPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PlatformHealth />
        
        {/* CPU/Memory details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-850 dark:text-white mb-1">Server Runtime</h3>
            <p className="text-xs text-slate-400 dark:text-slate-450 mb-4">NodeJS details & execution scopes</p>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-500 dark:text-slate-455 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" /> Version
                </span>
                <span className="font-bold">{process.version || 'v20.10'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-500 dark:text-slate-455 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-400" /> DB Dialect
                </span>
                <span className="font-bold">MongoDB MQL</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-500 dark:text-slate-455 flex items-center gap-1.5">
                  <Inbox className="w-3.5 h-3.5 text-slate-400" /> Queue Driver
                </span>
                <span className="font-bold text-red-500 dark:text-red-400">BullMQ (Redis)</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-955/20 border border-blue-100 dark:border-blue-900/40 p-3.5 rounded-lg text-xs mt-4 flex gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-750 dark:text-blue-300 leading-normal">
              Diagnostics automatically verify DB latency and clean queues every 30s. If queue memory overflows, clear cache.
            </p>
          </div>
        </div>

        {/* AI & Integration health status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-850 dark:text-white mb-1">Integration Statuses</h3>
            <p className="text-xs text-slate-400 dark:text-slate-450">Active API connections and keys validation</p>
          </div>

          <div className="space-y-2">
            {[
              { name: 'Gemini AI API', desc: 'Configured / Ready', ok: true },
              { name: 'Cloudinary Storage', desc: 'Configured / Running', ok: true },
              { name: 'Nodemailer SMTP', desc: 'Configured / ready', ok: true },
              { name: 'BullMQ Queues', desc: 'Redis fallback enabled', ok: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg">
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{item.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{item.desc}</span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  item.ok 
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450' 
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450'
                }`}>
                  {item.ok ? 'Active' : 'Fallback'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
