import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Clock,
  Search,
  Plus,
  Briefcase,
  Settings,
  Layers,
  ChevronDown,
  ChevronRight,
  PenSquare,
  Bell,
  Check
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

const TOP_NAV = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'my-issues', label: 'My Issues', icon: Clock },
];

const YOUR_TEAMS = [
  { id: 'engineering', label: 'Engineering', icon: Layers },
  { id: 'design', label: 'Design', icon: Briefcase },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState('engineering');
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [sidebarHover, setSidebarHover] = useState<string | null>(null);
  const location = useLocation();

  // Create mock breadcrumbs based on route
  const getBreadcrumbs = () => {
    if (location.pathname.includes('/project/')) return "Workspace > Projects > Design System Revamp";
    if (location.pathname.includes('/dashboard')) return "Workspace > Projects";
    return "Workspace";
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0E1015] text-[#E8E8FD] font-sans selection:bg-white/20 flex antialiased" style={{ WebkitFontSmoothing: 'antialiased' }}>

      {/* Sidebar */}
      <aside className="w-60 shrink-0 h-full flex flex-col bg-[#17181D] border-r border-white/4 z-20 relative">

        {/* Workspace Header Dropdown Container */}
        <div className="h-11 px-3 flex items-center justify-between shrink-0 relative">
          <button
            onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
            className="flex items-center gap-2 h-7 px-1.5 rounded-md hover:bg-white/5 transition-colors focus:outline-none w-full"
          >
            <div className="w-4 h-4 rounded-[3px] bg-[#2E3038] border border-white/10 flex items-center justify-center shadow-sm">
              <span className="text-[#E8E8FD] text-[9px] font-bold leading-none">A</span>
            </div>
            <span className="text-[13px] font-medium text-[#E8E8FD] flex-1 text-left">Acme Corp</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8A8F98]" />
          </button>

          {/* Animated Workspace Dropdown */}
          <AnimatePresence>
            {isWorkspaceOpen && (
              <motion.div
                initial={{ scale: 0.96, y: -8, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.96, y: -8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute top-10 left-3 right-3 bg-[#1C1D22] border border-white/8 rounded-lg shadow-xl shadow-black/50 overflow-hidden z-50 origin-top"
              >
                <div className="p-1.5 flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-[#8A8F98] uppercase tracking-wider px-2 py-1">Workspaces</span>
                  <button className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-[#E8E8FD] bg-white/5 rounded-[5px] text-left">
                     <div className="w-4 h-4 rounded-[3px] bg-[#2E3038] border border-white/10 flex items-center justify-center shadow-sm">
                        <span className="text-[#E8E8FD] text-[9px] font-bold leading-none">A</span>
                     </div>
                     <span className="flex-1">Acme Corp</span>
                     <Check className="w-3.5 h-3.5 text-[#E8E8FD]" />
                  </button>
                  <button className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-[#8A8F98] hover:text-[#E8E8FD] hover:bg-white/3 rounded-[5px] text-left transition-colors">
                     <div className="w-4 h-4 rounded-[3px] bg-[#2E3038] border border-white/10 flex items-center justify-center shadow-sm">
                        <span className="text-[#E8E8FD] text-[9px] font-bold leading-none">P</span>
                     </div>
                     <span className="flex-1">Personal</span>
                  </button>
                  <div className="h-px w-full bg-white/4 my-1" />
                  <button className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-[#8A8F98] hover:text-[#E8E8FD] hover:bg-white/3 rounded-[5px] text-left transition-colors">
                     <Plus className="w-3.5 h-3.5" />
                     <span>Create Workspace</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Actions */}
        <div className="px-3 pb-2 pt-1">
          <button className="w-full flex items-center gap-2 h-7 px-2 text-[13px] text-[#8A8F98] hover:text-[#E8E8FD] hover:bg-white/5 rounded-md transition-colors text-left group overflow-hidden">
            <PenSquare className="w-3.5 h-3.5" />
            <span className="flex-1">New Issue</span>
            {/* Animated Pill */}
            <motion.div
               initial={{ x: 10, opacity: 0 }}
               whileHover={{ x: 0, opacity: 1 }}
               className="text-[10px] border border-white/10 px-1 rounded-[3px] font-mono tracking-wider bg-white/3 text-[#E8E8FD]"
            >
              C
            </motion.div>
          </button>
          <button className="w-full flex items-center gap-2 h-7 px-2 text-[13px] text-[#8A8F98] hover:text-[#E8E8FD] hover:bg-white/5 rounded-md transition-colors text-left group overflow-hidden mt-0.5">
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1">Search</span>
             {/* Animated Pill */}
            <motion.div
               initial={{ x: 10, opacity: 0 }}
               whileHover={{ x: 0, opacity: 1 }}
               className="text-[10px] border border-white/10 px-1 rounded-[3px] font-mono tracking-wider bg-white/3 text-[#E8E8FD]"
            >
              ⌘K
            </motion.div>
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 space-y-5 pt-2">

          {/* Top Level */}
          <div className="space-y-0.5 relative">
            {TOP_NAV.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  onMouseEnter={() => setSidebarHover(item.id)}
                  onMouseLeave={() => setSidebarHover(null)}
                  className="w-full flex items-center justify-between h-7 px-2 text-[13px] rounded-md relative z-10 transition-colors focus:outline-none group overflow-hidden"
                >
                  {/* Indicator Slider Active State */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-white/6 rounded-md z-0"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-2">
                    <item.icon className={cn("w-3.5 h-3.5 transition-colors", isActive ? "text-[#E8E8FD]" : "text-[#8A8F98] group-hover:text-[#E8E8FD]")} />
                    <span className={cn("font-medium transition-colors", isActive ? "text-[#E8E8FD]" : "text-[#8A8F98] group-hover:text-[#E8E8FD]")}>
                      {item.label}
                    </span>
                  </div>

                  {/* Micro-hover Sliding Pill for nav items */}
                  <AnimatePresence>
                     {sidebarHover === item.id && !isActive && (
                         <motion.div
                            initial={{ x: 10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 10, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="relative z-10 text-[9px] font-mono font-medium tracking-wider bg-white/5 px-1 rounded-[3px] text-[#E8E8FD] border border-white/5"
                         >
                            ⌘{(TOP_NAV.indexOf(item) + 1)}
                         </motion.div>
                     )}
                  </AnimatePresence>
                </button>
              )
            })}
          </div>

          {/* Teams */}
          <div>
            <div className="flex items-center justify-between px-2 h-6 group/header cursor-pointer mb-0.5">
              <span className="text-[11px] font-semibold text-[#8A8F98] tracking-wide uppercase group-hover/header:text-[#E8E8FD] transition-colors">Your Teams</span>
              <button className="opacity-0 group-hover/header:opacity-100 text-[#8A8F98] hover:text-[#E8E8FD] transition-opacity"><Plus className="w-3.5 h-3.5" /></button>
            </div>
            <div className="space-y-0.5 relative">
              {YOUR_TEAMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    onMouseEnter={() => setSidebarHover(item.id)}
                    onMouseLeave={() => setSidebarHover(null)}
                    className="w-full flex items-center gap-2 h-7 px-2 text-[13px] rounded-md relative z-10 transition-colors focus:outline-none group"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-white/6 rounded-md z-0"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <div className="w-3.5 flex justify-center">
                        <ChevronRight className="w-3 h-3 text-[#8A8F98] opacity-0 group-hover:opacity-100 -ml-1 transition-opacity" />
                    </div>
                    <span className={cn("relative z-10 font-medium -ml-1 transition-colors", isActive ? "text-[#E8E8FD]" : "text-[#8A8F98] group-hover:text-[#E8E8FD]")}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom Profile */}
        <div className="px-3 pb-3 pt-2 mt-auto">
           <button className="w-full flex items-center justify-between h-8 px-2 text-[13px] text-[#8A8F98] hover:bg-white/5 rounded-md transition-colors group">
              <div className="flex items-center gap-2">
                 <div className="w-4 h-4 rounded-full bg-[#1C1D22] border border-white/10 overflow-hidden shrink-0 relative">
                     <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop" className="w-full h-full object-cover" alt="User" />
                 </div>
                 <span className="font-medium truncate flex-1 text-left group-hover:text-[#E8E8FD] transition-colors">Jane Doe</span>
              </div>
              <Settings className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
           </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 bg-transparent">

        {/* Global Header Bar */}
        <header className="h-12 flex items-center justify-between px-6 border-b border-white/4 bg-[#0E1015]/80 backdrop-blur-md z-20 shrink-0">
            {/* Breadcrumbs */}
            <div className="flex items-center text-[13px] font-medium tracking-wide">
              {getBreadcrumbs().split(' > ').map((crumb, idx, arr) => (
                <React.Fragment key={idx}>
                   <span className={cn(
                       "cursor-pointer transition-colors",
                       idx === arr.length - 1 ? "text-[#E8E8FD]" : "text-[#8A8F98] hover:text-[#E8E8FD]"
                   )}>
                       {crumb}
                   </span>
                   {idx < arr.length - 1 && <span className="mx-2 text-[#2E3038]">/</span>}
                </React.Fragment>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <button className="relative text-[#8A8F98] hover:text-[#E8E8FD] transition-colors focus:outline-none">
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#E8E8FD] rounded-full border-[1.5px] border-[#0E1015]" />
              </button>

              {/* Avatar Group */}
              <div className="flex -space-x-1.5">
                <img className="w-5 h-5 rounded-full border-[1.5px] border-[#0E1015] relative z-3" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&fit=crop" alt="Team member" />
                <img className="w-5 h-5 rounded-full border-[1.5px] border-[#0E1015] relative z-2" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop" alt="Team member" />
                <img className="w-5 h-5 rounded-full border-[1.5px] border-[#0E1015] relative z-1" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop" alt="Team member" />
              </div>
            </div>
        </header>

        {/* Page Canvas Container (with Entrance Animation) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
            <motion.div
               key={location.pathname}
               initial={{ opacity: 0, y: 12 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
               className="h-full w-full"
            >
               {children}
            </motion.div>
        </div>
      </main>

    </div>
  );
}