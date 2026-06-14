import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import DashboardLayout from './DashboardLayout.tsx';
import {
  Plus,
  MoreHorizontal,
  ArrowUpRight,
  CheckCircle2,
  Timer,
  Circle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

// ─── Demo data ────────────────────────────────────────────────────────────────

interface DemoIssue {
  id: string;
  key: string;
  title: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assignee: {
    initials: string;
    color: string;
  };
}

const DEMO_ISSUES: Record<'todo' | 'inProgress' | 'done', DemoIssue[]> = {
  todo: [
    { id: 'd1', key: 'SYN-18', title: 'Design token audit for v2 system', priority: 'high', assignee: { initials: 'A', color: '#5e6ad2' } },
    { id: 'd2', key: 'SYN-19', title: 'Set up CI pipeline on GitHub Actions', priority: 'medium', assignee: { initials: 'R', color: '#26b5ce' } },
    { id: 'd3', key: 'SYN-20', title: 'Write API docs for auth endpoints', priority: 'low', assignee: { initials: 'P', color: '#7c5aed' } },
  ],
  inProgress: [
    { id: 'd4', key: 'SYN-15', title: 'Implement WebSocket real-time chat', priority: 'urgent', assignee: { initials: 'P', color: '#7c5aed' } },
    { id: 'd5', key: 'SYN-16', title: 'DashboardLayout component', priority: 'high', assignee: { initials: 'A', color: '#5e6ad2' } },
    { id: 'd6', key: 'SYN-17', title: 'Auth token refresh middleware', priority: 'medium', assignee: { initials: 'L', color: '#4cb782' } },
  ],
  done: [
    { id: 'd7', key: 'SYN-12', title: 'Project schema & MongoDB models', priority: 'low', assignee: { initials: 'R', color: '#26b5ce' } },
    { id: 'd8', key: 'SYN-13', title: 'Login / Register flow with JWT', priority: 'medium', assignee: { initials: 'A', color: '#5e6ad2' } },
    { id: 'd9', key: 'SYN-14', title: 'Route guards & protected pages', priority: 'high', assignee: { initials: 'L', color: '#4cb782' } },
  ],
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#e5534b',
  high:   '#f2a20a',
  medium: '#5e6169',
  low:    '#404348',
};

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30 };

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Open',        value: '14', icon: Circle,        color: '#5e6169', delta: '+3 this week' },
  { label: 'In Progress', value: '3',  icon: Timer,         color: '#f2a20a', delta: 'Active now' },
  { label: 'Completed',   value: '31', icon: CheckCircle2,  color: '#4cb782', delta: '+7 this sprint' },
  { label: 'Overdue',     value: '2',  icon: AlertCircle,   color: '#e5534b', delta: 'Needs attention' },
];

const StatsRow: React.FC = () => (
  <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
    {STATS.map((s, i) => {
      const Icon = s.icon;
      return (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.28 }}
          className="rounded-xl px-6 py-6 transition-colors"
          style={{
            background: '#141516',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#5e6169' }}>
              {s.label}
            </span>
            <Icon size={14} style={{ color: s.color }} />
          </div>
          <p className="text-[28px] font-bold tabular-nums leading-none tracking-[-0.5px]" style={{ color: '#f7f8f8' }}>
            {s.value}
          </p>
          <p className="mt-2 text-[11px]" style={{ color: '#404348' }}>{s.delta}</p>
        </motion.div>
      );
    })}
  </div>
);

// ─── Issue Row ────────────────────────────────────────────────────────────────

const IssueRow: React.FC<{
  issue: typeof DEMO_ISSUES['todo'][0];
  index: number;
}> = ({ issue, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -4 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.04, duration: 0.2 }}
    className="group flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer transition-colors hover:bg-white/[0.04]"
  >
    <AlertCircle size={12} style={{ color: PRIORITY_COLOR[issue.priority], flexShrink: 0 }} />
    <span className="flex-1 truncate text-[13px]" style={{ color: '#f7f8f8' }}>{issue.title}</span>
    <span className="shrink-0 text-[11px] font-mono" style={{ color: '#404348' }}>{issue.key}</span>
    <div
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
      style={{ background: issue.assignee.color }}
    >
      {issue.assignee.initials}
    </div>
    <MoreHorizontal size={13} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#5e6169' }} />
  </motion.div>
);

// ─── Mini Column ──────────────────────────────────────────────────────────────

const MiniColumn: React.FC<{
  label: string;
  icon: React.ElementType;
  iconColor: string;
  issues: DemoIssue[];
  colIndex: number;
}> = ({ label, icon: Icon, iconColor, issues, colIndex }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 + colIndex * 0.08, duration: 0.28 }}
    className="flex flex-col overflow-hidden rounded-xl"
    style={{ background: '#141516', border: '1px solid rgba(255,255,255,0.06)' }}
  >
    {/* Column header */}
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center gap-2.5">
        <Icon size={13} style={{ color: iconColor }} />
        <span className="text-[12px] font-semibold" style={{ color: '#9b9ea4' }}>{label}</span>
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#5e6169' }}
        >
          {issues.length}
        </span>
      </div>
      <motion.button
        aria-label={`Add to ${label}`}
        className="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
        style={{ color: '#404348' }}
        whileHover={{ background: 'rgba(255,255,255,0.07)', color: '#9b9ea4' }}
        whileTap={{ scale: 0.9 }}
      >
        <Plus size={13} />
      </motion.button>
    </div>

    {/* Issues */}
    <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-none">
      {issues.map((issue, i) => (
        <IssueRow key={issue.id} issue={issue} index={i} />
      ))}
    </div>
  </motion.div>
);

// ─── Projects List ────────────────────────────────────────────────────────────

const ProjectsList: React.FC<{ projects: any[]; onOpen: (id: string) => void }> = ({ projects, onOpen }) => {
  if (projects.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold" style={{ color: '#f7f8f8' }}>Your Projects</h2>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p: any, i: number) => (
          <motion.button
            key={p._id}
            onClick={() => onOpen(p._id)}
            className="group flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors"
            style={{
              background: '#141516',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            whileHover={{ borderColor: 'rgba(94,106,210,0.3)', background: '#161719' }}
            whileTap={{ scale: 0.99 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="text-xl">📁</span>
            <span className="flex-1 min-w-0">
              <span className="block truncate text-[13px] font-medium" style={{ color: '#f7f8f8' }}>{p.name}</span>
              <span className="block text-[11px] mt-0.5" style={{ color: '#5e6169' }}>Open board</span>
            </span>
            <ExternalLink size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#5e6ad2' }} />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('http://localhost:5001/api/projects', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then(res => setProjects(res.data))
      .catch(() => {/* backend offline */});
  }, []);

  return (
    <DashboardLayout
      defaultActiveNav="kanban"
      onNavChange={(key) => {
        if (key === 'projects') navigate('/project');
      }}
    >
      <div className="px-8 py-8">
        {/* Page title */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-bold tracking-[-0.3px]" style={{ color: '#f7f8f8' }}>
                Board
              </h1>
              <p className="mt-1 text-[13px]" style={{ color: '#5e6169' }}>
                SyncSpac · Sprint 4
              </p>
            </div>
            <motion.button
              id="new-issue-btn"
              onClick={() => navigate('/project')}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold"
              style={{ background: '#5e6ad2', color: '#fff' }}
              whileHover={{ background: '#6b78e5', boxShadow: '0 0 20px rgba(94,106,210,0.35)' }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING}
            >
              <Plus size={14} />
              New project
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mb-12">
          <StatsRow />
        </div>

        {/* Real projects from API */}
        <ProjectsList projects={projects} onOpen={id => navigate(`/project/${id}`)} />

        {/* Mini board preview header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold" style={{ color: '#f7f8f8' }}>
            Active Sprint
          </h2>
          <motion.button
            className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
            style={{ color: '#5e6169' }}
            whileHover={{ color: '#9b9ea4' }}
          >
            View all
            <ArrowUpRight size={12} />
          </motion.button>
        </div>

        {/* Mini board */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <MiniColumn label="Todo"        icon={Circle}       iconColor="#5e6169" issues={DEMO_ISSUES.todo}       colIndex={0} />
          <MiniColumn label="In Progress" icon={Timer}        iconColor="#f2a20a" issues={DEMO_ISSUES.inProgress} colIndex={1} />
          <MiniColumn label="Done"        icon={CheckCircle2} iconColor="#4cb782" issues={DEMO_ISSUES.done}       colIndex={2} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;