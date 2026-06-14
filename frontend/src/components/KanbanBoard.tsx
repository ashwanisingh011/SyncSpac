import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Circle,
  Timer,
  CheckCircle2,
  Plus,
  MoreHorizontal,
  AlertCircle,
  Tag,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  _id: string;
  title: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low' | 'none';
  label?: string;
}

interface Project {
  name: string;
  columns: {
    todo: Task[];
    inProgress: Task[];
    done: Task[];
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  urgent: { color: '#e5534b', label: 'Urgent' },
  high:   { color: '#f2a20a', label: 'High' },
  medium: { color: '#5e6ad2', label: 'Medium' },
  low:    { color: '#4cb782', label: 'Low' },
  none:   { color: '#404348', label: 'None' },
};

const COLUMNS = [
  { key: 'todo',       label: 'Todo',        icon: Circle,       iconColor: '#5e6169', headerAccent: 'rgba(255,255,255,0.03)' },
  { key: 'inProgress', label: 'In Progress', icon: Timer,        iconColor: '#f2a20a', headerAccent: 'rgba(242,162,10,0.06)' },
  { key: 'done',       label: 'Done',        icon: CheckCircle2, iconColor: '#4cb782', headerAccent: 'rgba(76,183,130,0.06)' },
];

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30 };

// ─── Issue Card ───────────────────────────────────────────────────────────────

const IssueCard: React.FC<{ task: Task; index: number }> = ({ task, index }) => {
  const priority = task.priority ?? 'none';
  const pc = PRIORITY_CONFIG[priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.04, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -1 }}
      className="group relative cursor-pointer rounded-lg p-4 transition-colors"
      style={{
        background: '#1a1b1e',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)';
        (e.currentTarget as HTMLElement).style.background = '#1e1f22';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
        (e.currentTarget as HTMLElement).style.background = '#1a1b1e';
      }}
    >
      {/* Options button */}
      <motion.button
        aria-label="Issue options"
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: '#5e6169' }}
        whileHover={{ background: 'rgba(255,255,255,0.08)', color: '#9b9ea4' }}
        whileTap={{ scale: 0.9 }}
      >
        <MoreHorizontal size={13} />
      </motion.button>

      {/* Title */}
      <p className="pr-8 text-[13px] font-medium leading-relaxed" style={{ color: '#f7f8f8' }}>
        {task.title}
      </p>

      {/* Footer meta */}
      <div className="mt-3 flex items-center gap-2.5">
        <span title={`Priority: ${pc.label}`}>
          <AlertCircle size={12} style={{ color: pc.color }} />
        </span>
        {task.label && (
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#5e6169',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <Tag size={9} />
            {task.label}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// ─── Kanban Column ────────────────────────────────────────────────────────────

const KanbanColumn: React.FC<{
  col: typeof COLUMNS[0];
  tasks: Task[];
  colIndex: number;
}> = ({ col, tasks, colIndex }) => {
  const Icon = col.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: colIndex * 0.07, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-w-[280px] flex-1 flex-col overflow-hidden rounded-xl"
      style={{ background: '#141516', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: col.headerAccent, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2.5">
          <Icon size={14} strokeWidth={1.8} style={{ color: col.iconColor }} />
          <span className="text-[12px] font-semibold" style={{ color: '#9b9ea4' }}>{col.label}</span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#5e6169' }}
          >
            {tasks.length}
          </span>
        </div>
        <motion.button
          aria-label={`Add issue to ${col.label}`}
          className="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
          style={{ color: '#404348' }}
          whileHover={{ background: 'rgba(255,255,255,0.07)', color: '#9b9ea4' }}
          whileTap={{ scale: 0.9 }}
          transition={SPRING}
        >
          <Plus size={14} />
        </motion.button>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 scrollbar-none">
        <AnimatePresence>
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-24 items-center justify-center"
            >
              <p className="text-[12px]" style={{ color: '#404348' }}>No issues</p>
            </motion.div>
          ) : (
            tasks.map((task, i) => (
              <IssueCard key={task._id} task={task} index={i} />
            ))
          )}
        </AnimatePresence>

        {/* Add issue footer */}
        <motion.button
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] transition-colors"
          style={{ color: '#404348' }}
          whileHover={{ background: 'rgba(255,255,255,0.04)', color: '#9b9ea4' }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={13} />
          Add issue
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── KanbanBoard ──────────────────────────────────────────────────────────────

const KanbanBoard: React.FC<{ project: Project }> = ({ project }) => {
  const [cols] = useState(() => ({
    todo:       project?.columns?.todo       ?? [],
    inProgress: project?.columns?.inProgress ?? [],
    done:       project?.columns?.done       ?? [],
  }));

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[13px]" style={{ color: '#5e6169' }}>Loading board…</p>
      </div>
    );
  }

  return (
    <div
      className="flex h-full gap-4 overflow-x-auto p-6 scrollbar-none"
      style={{ background: '#0f1011' }}
    >
      {COLUMNS.map((col, i) => {
        const tasks = cols[col.key as keyof typeof cols] ?? [];
        return <KanbanColumn key={col.key} col={col} tasks={tasks} colIndex={i} />;
      })}
    </div>
  );
};

export default KanbanBoard;