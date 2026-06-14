import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layout,
  Layers,
  MessageSquare,
  Activity,
  ChevronDown,
  Bell,
  Settings,
  Search,
  Plus
} from 'lucide-react';

// Utilities
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: 'kanban', label: 'Kanban Board', icon: Layout, shortcut: '⌘1' },
  { id: 'projects', label: 'Projects', icon: Layers, shortcut: '⌘2' },
  { id: 'chat', label: 'Real-Time Chat', icon: MessageSquare, shortcut: '⌘3' },
  { id: 'analytics', label: 'Activity Analytics', icon: Activity, shortcut: '⌘4' },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState('kanban');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#070a13] text-slate-400 font-sans selection:bg-indigo-600/30">
      {/* Background Mesh Glow */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 flex h-full w-full">
        {/* Sidebar */}
        <aside className="w-64 h-full flex flex-col bg-slate-950/80 backdrop-blur-md border-r border-slate-900/60 z-20">

          {/* Workspace Dropdown Container */}
          <div className="relative p-4">
            <button
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/50 transition-colors group focus:outline-none focus:ring-2 focus:ring-indigo-600/50"
            >
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <span className="text-white text-xs font-bold leading-none tracking-wider">A</span>
                </div>
                <span className="text-slate-200 font-medium tracking-wide text-sm group-hover:text-white transition-colors">Acme Corp</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </button>

            {/* Workspace Dropdown Menu */}
            <AnimatePresence>
              {workspaceOpen && (
                <motion.div
                  initial={{ scale: 0.96, y: -8, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.96, y: -8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute top-16 left-4 right-4 bg-slate-900 border border-slate-800/60 rounded-lg shadow-xl shadow-black/50 overflow-hidden z-50 origin-top"
                >
                  <div className="p-1">
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-200 bg-slate-800/50 rounded-md">Acme Corp</button>
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 rounded-md transition-colors">Personal</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const isHovered = hoveredTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  onMouseEnter={() => setHoveredTab(item.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className="relative w-full flex items-center justify-between px-3 py-2 text-sm rounded-md focus:outline-none outline-none group"
                >
                  {/* Indicator Slider Active State */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-slate-900/60 rounded-md border border-slate-800/50"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  {/* Indicator Slider Hover State (only when not active) */}
                  {isHovered && !isActive && (
                    <motion.div
                      layoutId="hoverTabIndicator"
                      className="absolute inset-0 bg-slate-900/30 rounded-md"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    />
                  )}

                  <div className="relative flex items-center gap-3 z-10">
                    <item.icon
                      className={cn(
                        "w-4 h-4 transition-colors duration-200",
                        isActive ? "text-indigo-400" : isHovered ? "text-indigo-400" : "text-slate-500"
                      )}
                    />
                    <span
                      className={cn(
                        "font-medium tracking-wide transition-colors duration-200",
                        isActive ? "text-slate-200" : isHovered ? "text-slate-200" : "text-slate-400"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>

                  {/* Micro-Hover Animation Tip */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 5 }}
                        className="relative z-10 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wider bg-slate-800 text-slate-400 border border-slate-700"
                      >
                        {item.shortcut}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </nav>

          {/* Bottom Profile Utility */}
          <div className="p-4 border-t border-slate-900/60">
            <div className="flex items-center justify-between group">
              <button className="flex items-center gap-3 flex-1 hover:bg-slate-900/50 p-2 -ml-2 rounded-lg transition-colors focus:outline-none">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64"
                    alt="User"
                    className="w-8 h-8 rounded-full border border-slate-800 object-cover"
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-[1.5px] border-[#070a13] rounded-full" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium text-slate-200 tracking-wide">Jane Doe</span>
                  <span className="text-[11px] text-slate-500 tracking-wider uppercase">Lead Engineer</span>
                </div>
              </button>
              <button className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors focus:outline-none">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main className="flex-1 h-full flex flex-col overflow-hidden relative z-10 bg-transparent">

          {/* Header Bar */}
          <header className="h-14 flex items-center justify-between px-6 border-b border-slate-900/60 bg-slate-950/40 backdrop-blur-sm z-20 shrink-0">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm tracking-wide">
              <span className="text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">Workspace</span>
              <span className="mx-2 text-slate-700">/</span>
              <span className="text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">Projects</span>
              <span className="mx-2 text-slate-700">/</span>
              <span className="text-slate-200 font-medium">{NAV_ITEMS.find(item => item.id === activeTab)?.label}</span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-5">
              <button className="text-slate-400 hover:text-indigo-400 transition-colors focus:outline-none">
                <Search className="w-4 h-4" />
              </button>

              <button className="relative text-slate-400 hover:text-indigo-400 transition-colors focus:outline-none">
                <Bell className="w-4 h-4" />
                <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-indigo-500 rounded-full border border-[#070a13]" />
              </button>

              {/* Avatar Group */}
              <div className="flex -space-x-2">
                <img className="w-6 h-6 rounded-full border-2 border-[#070a13] relative z-[3]" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" alt="Team member" />
                <img className="w-6 h-6 rounded-full border-2 border-[#070a13] relative z-[2]" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64" alt="Team member" />
                <img className="w-6 h-6 rounded-full border-2 border-[#070a13] relative z-[1]" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64" alt="Team member" />
              </div>

              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm shadow-indigo-600/20">
                <Plus className="w-3 h-3" />
                New Task
              </button>
            </div>
          </header>

          {/* Page Canvas Container */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 relative">
            <motion.div
              key={activeTab} // Retrigger animation when tab changes
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="max-w-7xl mx-auto h-full"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
