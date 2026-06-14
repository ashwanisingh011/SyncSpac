import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  FolderKanban,
  MessageSquare,
  BarChart3,
  Settings,
  Bell,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  HelpCircle,
  Star,
  Inbox,
  X,
  Check,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardLayoutProps {
  children: React.ReactNode;
  defaultActiveNav?: NavKey;
  onNavChange?: (key: NavKey) => void;
}

export type NavKey = 'kanban' | 'projects' | 'chat' | 'analytics' | 'inbox' | 'favorites';

interface NavItem {
  key: NavKey;
  label: string;
  icon: React.ElementType;
  shortcut: string;
  badge?: number;
  badgeType?: 'count' | 'dot';
}

interface Workspace {
  id: string;
  name: string;
  plan: string;
  initials: string;
  color: string;
}

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  color: string;
  status: 'online' | 'away' | 'offline';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY_NAV: NavItem[] = [
  { key: 'inbox',     label: 'Inbox',              icon: Inbox,        shortcut: 'G I', badge: 5, badgeType: 'count' },
  { key: 'favorites', label: 'My Issues',           icon: Star,         shortcut: 'G M' },
  { key: 'kanban',    label: 'Kanban Board',        icon: LayoutGrid,   shortcut: 'G K', badge: 1, badgeType: 'dot' },
];

const TEAM_NAV: NavItem[] = [
  { key: 'projects',  label: 'Projects',            icon: FolderKanban, shortcut: 'G P' },
  { key: 'chat',      label: 'Real-Time Chat',      icon: MessageSquare,shortcut: 'G C', badge: 12, badgeType: 'count' },
  { key: 'analytics', label: 'Activity Analytics',  icon: BarChart3,    shortcut: 'G A' },
];

const WORKSPACES: Workspace[] = [
  { id: 'syncspac', name: 'SyncSpac', plan: 'Pro',  initials: 'SS', color: '#5e6ad2' },
  { id: 'devteam',  name: 'Dev Team', plan: 'Team', initials: 'DT', color: '#26b5ce' },
];

const TEAM_MEMBERS: TeamMember[] = [
  { id: 'a', name: 'Ashwani Singh', initials: 'A', color: '#5e6ad2', status: 'online'  },
  { id: 'b', name: 'Priya Nair',   initials: 'P', color: '#7c5aed', status: 'online'  },
  { id: 'c', name: 'Rohan Mehta',  initials: 'R', color: '#26b5ce', status: 'away'    },
  { id: 'd', name: 'Leila Osei',   initials: 'L', color: '#4cb782', status: 'offline' },
];

const STATUS_DOT: Record<string, string> = {
  online:  '#4cb782',
  away:    '#f2a20a',
  offline: '#404348',
};

const BREADCRUMB_MAP: Record<NavKey, { label: string; parent?: string }> = {
  inbox:     { label: 'Inbox' },
  favorites: { label: 'My Issues' },
  kanban:    { label: 'Board', parent: 'SyncSpac' },
  projects:  { label: 'Projects', parent: 'SyncSpac' },
  chat:      { label: 'Chat' },
  analytics: { label: 'Analytics', parent: 'SyncSpac' },
};

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30, mass: 0.8 };

// ─── Workspace Switcher ───────────────────────────────────────────────────────

const WorkspaceSwitcher: React.FC<{
  active: Workspace;
  onSelect: (ws: Workspace) => void;
}> = ({ active, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative px-4 pt-4 pb-2">
      <motion.button
        id="workspace-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none"
        whileTap={{ scale: 0.98 }}
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-black text-white shadow-sm"
          style={{ background: active.color }}
        >
          {active.initials}
        </span>
        <span className="flex-1 min-w-0 text-[13px] font-semibold truncate" style={{ color: '#f7f8f8' }}>
          {active.name}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={SPRING}
          style={{ color: '#5e6169' }}
        >
          <ChevronDown size={13} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            className="absolute left-3 right-3 top-[calc(100%+4px)] z-50 overflow-hidden rounded-xl"
            style={{
              background: '#1e1f22',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
            initial={{ scale: 0.95, y: -6, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -6, opacity: 0 }}
            transition={SPRING}
          >
            <div className="p-1.5">
              {WORKSPACES.map((ws) => (
                <motion.button
                  key={ws.id}
                  role="option"
                  aria-selected={ws.id === active.id}
                  onClick={() => { onSelect(ws); setOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
                  style={{ background: ws.id === active.id ? 'rgba(255,255,255,0.06)' : undefined }}
                  whileHover={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-black text-white shadow-sm"
                    style={{ background: ws.color }}
                  >
                    {ws.initials}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold" style={{ color: '#f7f8f8' }}>{ws.name}</span>
                    <span className="block text-[11px] mt-0.5" style={{ color: '#5e6169' }}>{ws.plan} plan</span>
                  </span>
                  {ws.id === active.id && <Check size={14} style={{ color: '#5e6ad2' }} />}
                </motion.button>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="p-1.5">
              <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] transition-colors hover:bg-white/[0.04]" style={{ color: '#5e6169' }}>
                <Plus size={13} />
                Create or join workspace
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Nav Item ─────────────────────────────────────────────────────────────────

const NavButton: React.FC<{
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <motion.button
      id={`nav-${item.key}`}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left focus-visible:outline-none"
      whileTap={{ scale: 0.98 }}
    >
      {/* Hover / active background */}
      <AnimatePresence>
        {(hovered || isActive) && (
          <motion.span
            layoutId={isActive ? 'nav-active-pill' : undefined}
            className="absolute inset-0 rounded-lg"
            style={{ background: isActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <span
        className="relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center transition-colors duration-150"
        style={{ color: isActive ? '#f7f8f8' : hovered ? '#c7c9ce' : '#5e6169' }}
      >
        <Icon size={15} strokeWidth={isActive ? 2 : 1.6} />
      </span>

      {/* Label */}
      <span
        className="relative z-10 flex-1 truncate text-[13px] transition-colors duration-150"
        style={{
          color: isActive ? '#f7f8f8' : hovered ? '#c7c9ce' : '#9b9ea4',
          fontWeight: isActive ? 500 : 400,
        }}
      >
        {item.label}
      </span>

      {/* Right section */}
      <span className="relative z-10 flex items-center gap-2">
        {/* Keyboard shortcut on hover */}
        <AnimatePresence>
          {hovered && !item.badge && (
            <motion.span
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={SPRING}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: '#5e6169',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {item.shortcut}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        {item.badge && !hovered && (
          <AnimatePresence>
            {item.badgeType === 'dot' ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-[6px] w-[6px] rounded-full"
                style={{ background: '#5e6ad2' }}
              />
            ) : (
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#9b9ea4',
                  minWidth: 18,
                  textAlign: 'center' as const,
                }}
              >
                {item.badge}
              </motion.span>
            )}
          </AnimatePresence>
        )}
      </span>
    </motion.button>
  );
};

// ─── Sidebar Section Header ───────────────────────────────────────────────────

const SectionLabel: React.FC<{ label: string; action?: React.ReactNode }> = ({ label, action }) => (
  <div className="flex items-center justify-between px-2.5 pb-1.5 pt-4">
    <span
      className="text-[11px] font-semibold uppercase tracking-[0.08em]"
      style={{ color: '#404348' }}
    >
      {label}
    </span>
    {action}
  </div>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeNav: NavKey;
  onNavChange: (k: NavKey) => void;
  workspace: Workspace;
  onWorkspaceChange: (ws: Workspace) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeNav, onNavChange, workspace, onWorkspaceChange }) => (
  <motion.aside
    initial={{ x: -12, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    className="flex h-full w-[240px] shrink-0 flex-col select-none overflow-hidden"
    style={{ background: '#141516', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    aria-label="Sidebar"
  >
    {/* Workspace switcher */}
    <WorkspaceSwitcher active={workspace} onSelect={onWorkspaceChange} />

    {/* Search */}
    <div className="px-4 pb-2">
      <motion.button
        id="sidebar-search"
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] transition-colors hover:bg-white/[0.05]"
        whileTap={{ scale: 0.98 }}
      >
        <Search size={14} style={{ color: '#5e6169' }} />
        <span className="flex-1 text-left text-[13px]" style={{ color: '#5e6169' }}>Search…</span>
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#404348', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          ⌘K
        </span>
      </motion.button>
    </div>

    {/* Primary nav */}
    <nav className="px-4" aria-label="Primary">
      <div className="space-y-0.5">
        {PRIMARY_NAV.map((item) => (
          <NavButton
            key={item.key}
            item={item}
            isActive={activeNav === item.key}
            onClick={() => onNavChange(item.key)}
          />
        ))}
      </div>
    </nav>

    {/* Separator */}
    <div className="mx-4 my-3" style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

    {/* Team section */}
    <nav className="flex-1 overflow-y-auto px-4 scrollbar-none" aria-label="Team">
      <SectionLabel
        label="Team"
        action={
          <motion.button
            aria-label="New item"
            className="rounded p-1 hover:bg-white/[0.06] transition-colors"
            style={{ color: '#404348' }}
            whileHover={{ color: '#9b9ea4' }}
            whileTap={{ scale: 0.9 }}
          >
            <Plus size={13} />
          </motion.button>
        }
      />
      <div className="space-y-0.5">
        {TEAM_NAV.map((item) => (
          <NavButton
            key={item.key}
            item={item}
            isActive={activeNav === item.key}
            onClick={() => onNavChange(item.key)}
          />
        ))}
      </div>

      {/* Members */}
      <SectionLabel label="Members" />
      <div className="space-y-0.5">
        {TEAM_MEMBERS.map((m) => (
          <motion.button
            key={m.id}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[6px] transition-colors hover:bg-white/[0.05]"
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: m.color }}>
              {m.initials}
              <span
                className="absolute -bottom-px -right-px h-2 w-2 rounded-full"
                style={{
                  background: STATUS_DOT[m.status],
                  border: '2px solid #141516',
                }}
              />
            </span>
            <span className="truncate text-[13px]" style={{ color: '#9b9ea4' }}>{m.name}</span>
          </motion.button>
        ))}
      </div>
    </nav>

    {/* Bottom: user */}
    <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
        <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ background: '#5e6ad2' }}>
          A
          <span
            className="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full"
            style={{ background: '#4cb782', border: '2px solid #141516' }}
          />
        </div>
        <span className="flex-1 truncate text-[13px] font-medium" style={{ color: '#9b9ea4' }}>
          Ashwani Singh
        </span>
        <div className="flex items-center gap-0.5">
          <motion.button
            aria-label="Help"
            className="rounded-md p-1.5 transition-colors hover:bg-white/[0.05]"
            style={{ color: '#404348' }}
            whileHover={{ color: '#9b9ea4' }}
          >
            <HelpCircle size={14} />
          </motion.button>
          <motion.button
            id="settings-btn"
            aria-label="Settings"
            className="rounded-md p-1.5 transition-colors hover:bg-white/[0.05]"
            style={{ color: '#404348' }}
            whileHover={{ rotate: 45, color: '#9b9ea4' }}
            transition={SPRING}
          >
            <Settings size={14} />
          </motion.button>
        </div>
      </div>
    </div>
  </motion.aside>
);

// ─── Notification Panel ───────────────────────────────────────────────────────

const NotifPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const items = [
    { icon: '⚡', title: 'New issue assigned', sub: 'Fix token rotation · 2m ago', unread: true },
    { icon: '💬', title: 'Comment on SYN-42',   sub: 'Priya Nair · 18m ago',      unread: true },
    { icon: '✅', title: 'Build passed',          sub: 'main → production · 1h ago', unread: false },
    { icon: '🔔', title: 'Sprint started',        sub: 'Sprint 4 · SyncSpac · 2h ago', unread: false },
  ];

  return (
    <motion.div
      ref={ref}
      className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-xl"
      style={{
        background: '#1e1f22',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
      }}
      initial={{ scale: 0.96, y: -6, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.96, y: -6, opacity: 0 }}
      transition={SPRING}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-[13px] font-semibold" style={{ color: '#f7f8f8' }}>Notifications</span>
        <button onClick={onClose} className="rounded-md p-1 transition-colors hover:bg-white/[0.06]" style={{ color: '#5e6169' }}>
          <X size={14} />
        </button>
      </div>
      <div>
        {items.map((n, i) => (
          <motion.button
            key={i}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
            whileHover={{ x: 1 }}
            transition={SPRING}
          >
            <span className="mt-0.5 text-sm leading-none">{n.icon}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-medium truncate" style={{ color: '#f7f8f8' }}>{n.title}</span>
              <span className="block text-[11px] mt-0.5" style={{ color: '#5e6169' }}>{n.sub}</span>
            </span>
            {n.unread && <span className="mt-2 h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: '#5e6ad2' }} />}
          </motion.button>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="p-2">
        <button className="w-full rounded-lg py-2 text-center text-[12px] font-medium transition-colors hover:bg-white/[0.04]" style={{ color: '#5e6169' }}>
          Mark all as read
        </button>
      </div>
    </motion.div>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────

const Header: React.FC<{ activeNav: NavKey }> = ({ activeNav }) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const bc = BREADCRUMB_MAP[activeNav];

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className="flex h-12 shrink-0 items-center justify-between px-6"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0f1011' }}
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2">
        {bc.parent && (
          <>
            <span className="text-[13px]" style={{ color: '#5e6169' }}>{bc.parent}</span>
            <ChevronRight size={12} style={{ color: '#404348' }} />
          </>
        )}
        <span className="text-[13px] font-medium" style={{ color: '#f7f8f8' }}>{bc.label}</span>
      </nav>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative">
          <motion.button
            id="notif-bell"
            aria-label="Notifications"
            onClick={() => setNotifOpen(v => !v)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06]"
            style={{ color: '#5e6169' }}
            whileHover={{ color: '#9b9ea4' }}
            whileTap={{ scale: 0.92 }}
          >
            <Bell size={15} strokeWidth={1.6} />
            <span
              className="absolute top-1.5 right-1.5 h-[6px] w-[6px] rounded-full"
              style={{ background: '#5e6ad2' }}
            />
          </motion.button>
          <AnimatePresence>
            {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)} />}
          </AnimatePresence>
        </div>

        <div className="mx-1 h-5" style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Avatar stack */}
        <div className="flex items-center">
          {TEAM_MEMBERS.slice(0, 3).map((m, i) => (
            <motion.div
              key={m.id}
              title={m.name}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{
                background: m.color,
                marginLeft: i === 0 ? 0 : -7,
                zIndex: 4 - i,
                border: '2px solid #0f1011',
              }}
              whileHover={{ scale: 1.15, zIndex: 99, y: -2 }}
              transition={SPRING}
            >
              {m.initials}
            </motion.div>
          ))}
          <motion.button
            aria-label="Invite member"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold transition-colors hover:bg-white/[0.10]"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: '#5e6169',
              marginLeft: -7,
              zIndex: 0,
              border: '2px solid #0f1011',
            }}
            whileHover={{ scale: 1.1, y: -2 }}
            transition={SPRING}
          >
            +
          </motion.button>
        </div>

        <div className="mx-1 h-5" style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* New issue */}
        <motion.button
          id="new-issue-header-btn"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold btn-glow transition-all"
          style={{ background: '#5e6ad2', color: '#fff' }}
          whileHover={{ background: '#6b78e5' }}
          whileTap={{ scale: 0.96 }}
          transition={SPRING}
        >
          <Plus size={13} />
          New issue
        </motion.button>
      </div>
    </motion.header>
  );
};

// ─── Page Canvas ──────────────────────────────────────────────────────────────

const PageCanvas: React.FC<{ children: React.ReactNode; navKey: NavKey }> = ({ children, navKey }) => (
  <AnimatePresence mode="wait">
    <motion.main
      key={navKey}
      id="page-canvas"
      role="main"
      className="flex-1 overflow-y-auto scrollbar-none"
      style={{ background: '#0f1011' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.main>
  </AnimatePresence>
);

// ─── DashboardLayout ──────────────────────────────────────────────────────────

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  defaultActiveNav = 'kanban',
  onNavChange,
}) => {
  const [activeNav, setActiveNav] = useState<NavKey>(defaultActiveNav);
  const [workspace, setWorkspace] = useState<Workspace>(WORKSPACES[0]);

  const handleNav = (key: NavKey) => {
    setActiveNav(key);
    onNavChange?.(key);
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: '#0f1011', fontFamily: 'var(--font-sans)' }}
    >
      <Sidebar
        activeNav={activeNav}
        onNavChange={handleNav}
        workspace={workspace}
        onWorkspaceChange={setWorkspace}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header activeNav={activeNav} />
        <PageCanvas navKey={activeNav}>{children}</PageCanvas>
      </div>
    </div>
  );
};

export default DashboardLayout;
