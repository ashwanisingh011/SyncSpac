import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProjectById } from '../api/projectService.ts';
import DashboardLayout from './DashboardLayout.tsx';
import KanbanBoard from './KanbanBoard.tsx';
import {
  Settings,
  Users,
  LayoutGrid,
  List,
  Plus,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

type ViewMode = 'board' | 'list';

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30 };

const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<ViewMode>('board');

  useEffect(() => {
    const get = async () => {
      try {
        const { data } = await fetchProjectById(id!);
        setProject(data);
      } catch {
        setError('Could not load project. Check that the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    get();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout defaultActiveNav="projects">
        <div className="flex h-full items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            style={{ color: '#5e6169' }}
          >
            <Loader2 size={20} />
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout defaultActiveNav="projects">
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: 'rgba(229,83,75,0.1)', border: '1px solid rgba(229,83,75,0.2)' }}
          >
            <AlertCircle size={20} style={{ color: '#e5534b' }} />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold" style={{ color: '#f7f8f8' }}>Project not found</p>
            <p className="mt-1 text-[13px]" style={{ color: '#5e6169' }}>{error}</p>
          </div>
          <motion.button
            onClick={() => navigate('/dashboard')}
            className="rounded-md px-4 py-1.5 text-[13px] font-medium"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#9b9ea4' }}
            whileHover={{ background: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.97 }}
          >
            Back to dashboard
          </motion.button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout defaultActiveNav="projects">
      <div className="flex h-full flex-col">
        {/* Sub-header */}
        <motion.div
          className="flex shrink-0 items-center justify-between px-6 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Left: breadcrumb + title */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-[13px] transition-colors"
              style={{ color: '#5e6169' }}
            >
              Projects
            </button>
            <ChevronRight size={12} style={{ color: '#404348' }} />
            <span className="flex items-center gap-2 text-[13px] font-medium" style={{ color: '#f7f8f8' }}>
              <span className="text-base">📁</span>
              {project.name}
            </span>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-1.5">
            {/* View toggle */}
            <div
              className="flex items-center gap-px rounded-md p-0.5"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              {(['board', 'list'] as ViewMode[]).map((v) => (
                <motion.button
                  key={v}
                  id={`view-${v}`}
                  onClick={() => setView(v)}
                  className="relative flex items-center gap-1.5 rounded px-2.5 py-1 text-[12px] font-medium transition-colors"
                  style={{ color: view === v ? '#f7f8f8' : '#5e6169' }}
                  whileTap={{ scale: 0.97 }}
                >
                  {view === v && (
                    <motion.span
                      layoutId="view-pill"
                      className="absolute inset-0 rounded"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                      transition={SPRING}
                    />
                  )}
                  <span className="relative z-10">
                    {v === 'board' ? <LayoutGrid size={13} /> : <List size={13} />}
                  </span>
                  <span className="relative z-10 capitalize">{v}</span>
                </motion.button>
              ))}
            </div>

            <div className="h-4 mx-1" style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* Members button */}
            <motion.button
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors"
              style={{ color: '#9b9ea4', background: 'rgba(255,255,255,0.04)' }}
              whileHover={{ background: 'rgba(255,255,255,0.08)', color: '#f7f8f8' }}
              whileTap={{ scale: 0.97 }}
            >
              <Users size={13} />
              Members
            </motion.button>

            {/* Settings */}
            <motion.button
              aria-label="Project settings"
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{ color: '#5e6169' }}
              whileHover={{ background: 'rgba(255,255,255,0.06)', color: '#9b9ea4' }}
              whileTap={{ scale: 0.92 }}
            >
              <Settings size={14} />
            </motion.button>

            {/* Add issue */}
            <motion.button
              id="add-issue-btn"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-semibold"
              style={{ background: '#5e6ad2', color: '#fff' }}
              whileHover={{ background: '#6b78e5' }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING}
            >
              <Plus size={13} />
              Add issue
            </motion.button>
          </div>
        </motion.div>

        {/* Board or List content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {view === 'board' ? (
              <motion.div
                key="board"
                className="h-full"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <KanbanBoard project={project} />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                className="h-full overflow-y-auto px-6 py-4 scrollbar-none"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <ListView project={project} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

// ─── List View (bonus) ────────────────────────────────────────────────────────

const ListView: React.FC<{ project: any }> = ({ project }) => {
  const allTasks = [
    ...(project?.columns?.todo?.map((t: any) => ({ ...t, status: 'Todo' })) ?? []),
    ...(project?.columns?.inProgress?.map((t: any) => ({ ...t, status: 'In Progress' })) ?? []),
    ...(project?.columns?.done?.map((t: any) => ({ ...t, status: 'Done' })) ?? []),
  ];

  const STATUS_COLORS: Record<string, string> = {
    'Todo': '#5e6169',
    'In Progress': '#5e6ad2',
    'Done': '#4cb782',
  };

  if (allTasks.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <List size={18} style={{ color: '#404348' }} />
        </div>
        <p className="text-[13px]" style={{ color: '#404348' }}>No issues yet</p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div
        className="grid grid-cols-[1fr_120px_100px] px-4 py-2 text-[11px] font-semibold uppercase tracking-widest"
        style={{ background: '#141516', color: '#404348', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span>Title</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      {allTasks.map((task: any, i: number) => (
        <motion.div
          key={task._id}
          className="grid grid-cols-[1fr_120px_100px] items-center px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
          style={{
            background: i % 2 === 0 ? '#141516' : '#161719',
            borderBottom: i < allTasks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
          }}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03, duration: 0.2 }}
        >
          <span className="truncate text-[13px]" style={{ color: '#f7f8f8' }}>{task.title}</span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: STATUS_COLORS[task.status] ?? '#5e6169' }}
            />
            <span className="text-[12px]" style={{ color: '#9b9ea4' }}>{task.status}</span>
          </span>
          <motion.button
            className="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
            style={{ color: '#404348' }}
            whileHover={{ background: 'rgba(255,255,255,0.06)', color: '#9b9ea4' }}
          >
            <MoreHorizontal size={13} />
          </motion.button>
        </motion.div>
      ))}
    </div>
  );
};

export default ProjectPage;