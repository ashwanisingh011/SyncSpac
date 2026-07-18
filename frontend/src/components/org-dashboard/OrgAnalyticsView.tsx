'use client';

import { useMemo } from 'react';
import type { Task } from '@/types/tasks';
import type { Project } from '@/types/projects';
import type { WorkspaceMember } from '@/types/workspace';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  TrendingUp,
  BarChart2,
  Calendar,
  Activity,
  Layers,
  UserCheck,
} from 'lucide-react';

interface OrgAnalyticsViewProps {
  allTasks: Task[];
  projects: Project[];
  members: WorkspaceMember[];
}

// ─── Tiny SVG Bar Chart ───────────────────────────────────────────────────────
interface BarItem {
  label: string;
  value: number;
  color: string;
}
function MiniBarChart({ data, maxH = 80 }: { data: BarItem[]; maxH?: number }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((item) => {
        const heightPct = (item.value / maxVal) * maxH;
        return (
          <div key={item.label} className="flex flex-col items-center flex-1 gap-1 group">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.value}
            </span>
            <div
              style={{ height: `${Math.max(6, heightPct)}px` }}
              className={`w-full rounded-t-md transition-all duration-500 ${item.color}`}
            />
            <span className="text-[9px] text-slate-400 dark:text-slate-500 text-center leading-tight truncate w-full text-center">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Donut Chart (SVG) ────────────────────────────────────────────────────────
interface DonutSlice {
  label: string;
  value: number;
  color: string;
}
function DonutChart({ slices, size = 100 }: { slices: DonutSlice[]; size?: number }) {
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  let cumAngle = -Math.PI / 2;

  const paths = slices.map((slice) => {
    const angle = (slice.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`;
    return { path, color: slice.color, label: slice.label, value: slice.value };
  });

  return (
    <svg width={size} height={size} className="shrink-0">
      {paths.map((p, i) => (
        <path key={i} d={p.path} fill={p.color} className="opacity-90 hover:opacity-100 transition-opacity" />
      ))}
      {/* Center hole */}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="white" className="dark:fill-slate-900" />
    </svg>
  );
}

// ─── Stat mini-card ───────────────────────────────────────────────────────────
function MiniStat({ label, value, icon: Icon, colorClass }: { label: string; value: string | number; icon: React.ElementType; colorClass: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{value}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Progress row ─────────────────────────────────────────────────────────────
function ProgressRow({ label, value, total, colorClass }: { label: string; value: number; total: number; colorClass: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
        <span className="font-medium">{label}</span>
        <span className="font-bold text-slate-800 dark:text-slate-200">{value} <span className="text-slate-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrgAnalyticsView({ allTasks, projects, members }: OrgAnalyticsViewProps) {
  const now = new Date();

  // ── Task Status Counts ──────────────────────────────────────────────────────
  const taskStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allTasks.forEach((t) => { counts[t.status] = (counts[t.status] ?? 0) + 1; });
    return counts;
  }, [allTasks]);

  const completedCount = (taskStatusCounts['done'] ?? 0) + (taskStatusCounts['completed'] ?? 0);
  const inProgressCount = taskStatusCounts['in-progress'] ?? 0;
  const todoCount = taskStatusCounts['todo'] ?? 0;
  const reviewCount = taskStatusCounts['review'] ?? 0;
  const blockedCount = taskStatusCounts['blocked'] ?? 0;
  const backlogCount = taskStatusCounts['backlog'] ?? 0;

  const overdueCount = useMemo(() =>
    allTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done' && t.status !== 'completed').length,
    [allTasks]
  );

  const upcomingCount = useMemo(() =>
    allTasks.filter((t) => {
      if (!t.dueDate || t.status === 'done' || t.status === 'completed') return false;
      const d = new Date(t.dueDate);
      return d >= now && d <= new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    }).length,
    [allTasks]
  );

  const completionRate = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  // ── Priority breakdown ──────────────────────────────────────────────────────
  const highPri = allTasks.filter((t) => t.priority === 'high' && t.status !== 'done').length;
  const medPri = allTasks.filter((t) => t.priority === 'medium' && t.status !== 'done').length;
  const lowPri = allTasks.filter((t) => t.priority === 'low' && t.status !== 'done').length;

  // ── Type breakdown ──────────────────────────────────────────────────────────
  const typeBar: BarItem[] = useMemo(() => {
    const counts: Record<string, number> = {};
    allTasks.forEach((t) => { const type = t.type ?? 'task'; counts[type] = (counts[type] ?? 0) + 1; });
    const colorMap: Record<string, string> = {
      task: 'bg-indigo-500', bug: 'bg-red-500', epic: 'bg-violet-500',
      story: 'bg-amber-500', subtask: 'bg-cyan-500', improvement: 'bg-emerald-500',
    };
    return Object.entries(counts).map(([type, val]) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: val,
      color: colorMap[type] ?? 'bg-slate-500',
    }));
  }, [allTasks]);

  // ── Role breakdown ──────────────────────────────────────────────────────────
  const activeMembers = members.filter((m) => m.status === 'active');
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeMembers.forEach((m) => {
      const r = (m.role ?? 'member').toLowerCase();
      counts[r] = (counts[r] ?? 0) + 1;
    });
    return counts;
  }, [activeMembers]);

  const roleDonutSlices: DonutSlice[] = useMemo(() => {
    const colorMap: Record<string, string> = {
      owner: '#6366F1', admin: '#8B5CF6', manager: '#3B82F6', 'project_manager': '#3B82F6',
      lead: '#10B981', developer: '#F59E0B', member: '#F59E0B',
      guest: '#94A3B8', client: '#CBD5E1',
    };
    return Object.entries(roleCounts).map(([role, count]) => ({
      label: role,
      value: count,
      color: colorMap[role] ?? '#94A3B8',
    }));
  }, [roleCounts]);

  // ── Project stats ───────────────────────────────────────────────────────────
  const projectTaskMap = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    allTasks.forEach((t) => {
      const pid = typeof t.project === 'object' ? t.project._id : t.project;
      if (!map[pid]) map[pid] = { total: 0, done: 0 };
      map[pid].total++;
      if (t.status === 'done' || t.status === 'completed') map[pid].done++;
    });
    return map;
  }, [allTasks]);

  const topProjects = useMemo(() =>
    projects
      .map((p) => ({ project: p, stats: projectTaskMap[p._id] ?? { total: 0, done: 0 } }))
      .sort((a, b) => b.stats.total - a.stats.total)
      .slice(0, 6),
    [projects, projectTaskMap]
  );

  // ── Member productivity (tasks done) ────────────────────────────────────────
  const memberDoneMap = useMemo(() => {
    const map: Record<string, number> = {};
    allTasks.filter((t) => t.status === 'done' || t.status === 'completed').forEach((t) => {
      const aid = t.assignedTo
        ? typeof t.assignedTo === 'object' ? t.assignedTo._id : t.assignedTo
        : null;
      if (aid) map[aid] = (map[aid] ?? 0) + 1;
    });
    return map;
  }, [allTasks]);

  const topMembers = useMemo(() =>
    activeMembers
      .map((m) => ({ member: m, done: memberDoneMap[m.userId] ?? 0 }))
      .sort((a, b) => b.done - a.done)
      .slice(0, 6),
    [activeMembers, memberDoneMap]
  );

  // ── Upcoming deadlines ──────────────────────────────────────────────────────
  const upcomingDeadlines = useMemo(() =>
    allTasks
      .filter((t) => t.dueDate && t.status !== 'done' && t.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 8),
    [allTasks]
  );

  const orgHealth = completionRate >= 70 ? 'Excellent' : completionRate >= 40 ? 'Good' : completionRate >= 20 ? 'Fair' : 'Needs Attention';
  const healthColor = completionRate >= 70 ? 'text-emerald-600' : completionRate >= 40 ? 'text-blue-600' : completionRate >= 20 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Comprehensive overview of your organization's performance.</p>
      </div>

      {/* ── Top metric tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniStat label="Total Tasks" value={allTasks.length} icon={BarChart2} colorClass="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600" />
        <MiniStat label="Completed" value={completedCount} icon={CheckCircle2} colorClass="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600" />
        <MiniStat label="In Progress" value={inProgressCount} icon={Activity} colorClass="bg-blue-50 dark:bg-blue-950/30 text-blue-600" />
        <MiniStat label="Overdue" value={overdueCount} icon={AlertCircle} colorClass={`${overdueCount > 0 ? 'bg-red-50 dark:bg-red-950/30 text-red-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`} />
        <MiniStat label="Due This Week" value={upcomingCount} icon={Calendar} colorClass="bg-amber-50 dark:bg-amber-950/30 text-amber-600" />
        <MiniStat label="Active Members" value={activeMembers.length} icon={UserCheck} colorClass="bg-violet-50 dark:bg-violet-950/30 text-violet-600" />
      </div>

      {/* ── Row 1: Task Status + Priority + Type ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Task Status Overview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" /> Task Status Overview
          </h2>
          <div className="space-y-3">
            <ProgressRow label="Completed" value={completedCount} total={allTasks.length} colorClass="bg-emerald-500" />
            <ProgressRow label="In Progress" value={inProgressCount} total={allTasks.length} colorClass="bg-blue-500" />
            <ProgressRow label="To Do" value={todoCount} total={allTasks.length} colorClass="bg-slate-400" />
            <ProgressRow label="In Review" value={reviewCount} total={allTasks.length} colorClass="bg-violet-500" />
            <ProgressRow label="Blocked" value={blockedCount} total={allTasks.length} colorClass="bg-red-500" />
            <ProgressRow label="Backlog" value={backlogCount} total={allTasks.length} colorClass="bg-amber-400" />
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Priority Breakdown (Open)
          </h2>
          <div className="space-y-3 mb-4">
            <ProgressRow label="High Priority" value={highPri} total={allTasks.length} colorClass="bg-red-500" />
            <ProgressRow label="Medium Priority" value={medPri} total={allTasks.length} colorClass="bg-amber-500" />
            <ProgressRow label="Low Priority" value={lowPri} total={allTasks.length} colorClass="bg-slate-400" />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'High', val: highPri, cls: 'text-red-600 dark:text-red-400' },
              { label: 'Medium', val: medPri, cls: 'text-amber-600 dark:text-amber-400' },
              { label: 'Low', val: lowPri, cls: 'text-slate-600 dark:text-slate-400' },
            ].map((p) => (
              <div key={p.label}>
                <p className={`text-lg font-black ${p.cls}`}>{p.val}</p>
                <p className="text-[10px] text-slate-400">{p.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Task Type Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-500" /> Tasks by Type
          </h2>
          {typeBar.length > 0 ? (
            <MiniBarChart data={typeBar} />
          ) : (
            <div className="flex items-center justify-center h-24 text-xs text-slate-400">No tasks yet</div>
          )}
        </div>
      </div>

      {/* ── Row 2: Project Overview + Users by Role ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Project Overview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Project Progress
          </h2>
          {topProjects.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No projects found.</p>
          ) : (
            <div className="space-y-3">
              {topProjects.map(({ project, stats }) => {
                const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
                return (
                  <div key={project._id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{project.name}</span>
                      <span className="text-slate-400 font-medium shrink-0 ml-2">{stats.done}/{stats.total} <span className="text-slate-300">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Users by Role */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" /> Users by Role
          </h2>
          <div className="flex items-center gap-6">
            <DonutChart slices={roleDonutSlices.length > 0 ? roleDonutSlices : [{ label: 'No data', value: 1, color: '#E2E8F0' }]} size={110} />
            <div className="flex-1 space-y-2">
              {roleDonutSlices.length === 0 ? (
                <p className="text-xs text-slate-400">No member data.</p>
              ) : (
                roleDonutSlices.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="capitalize text-slate-600 dark:text-slate-400">{s.label.replace(/_/g, ' ')}</span>
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Team Performance + Upcoming Deadlines ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Team Performance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" /> Team Performance (Tasks Completed)
          </h2>
          {topMembers.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No data available.</p>
          ) : (
            <div className="space-y-3">
              {topMembers.map(({ member, done }) => {
                const maxDone = topMembers[0]?.done ?? 1;
                const pct = maxDone > 0 ? Math.round((done / maxDone) * 100) : 0;
                const initials = member.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
                return (
                  <div key={member.userId} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{member.name}</span>
                        <span className="font-bold text-slate-600 dark:text-slate-400">{done} done</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Upcoming Deadlines
          </h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No pending deadlines.</p>
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.map((task) => {
                const due = new Date(task.dueDate!);
                const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
                const isOverdue = daysLeft < 0;
                const isCritical = daysLeft >= 0 && daysLeft <= 2;
                return (
                  <div key={task._id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{task.title}</p>
                      <p className="text-[10px] text-slate-400">{task.taskKey} · {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${
                      isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        : isCritical ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                    }`}>
                      {isOverdue ? 'Overdue' : `${daysLeft}d left`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Org Health ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" /> Organization Health Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className={`text-3xl font-black ${healthColor}`}>{completionRate}%</p>
            <p className="text-xs text-slate-500 mt-1">Completion Rate</p>
            <p className={`text-xs font-bold mt-0.5 ${healthColor}`}>{orgHealth}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
              {allTasks.length > 0 ? Math.round((inProgressCount / allTasks.length) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-500 mt-1">In-Progress Rate</p>
          </div>
          <div className="text-center">
            <p className={`text-3xl font-black ${overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {allTasks.length > 0 ? Math.round((overdueCount / allTasks.length) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Overdue Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-violet-600 dark:text-violet-400">
              {activeMembers.length > 0 ? Math.round(completedCount / activeMembers.length) : 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">Avg Tasks Done/Member</p>
          </div>
        </div>
      </div>
    </div>
  );
}
