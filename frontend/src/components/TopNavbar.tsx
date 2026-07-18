"use client";

import { isSuperAdmin } from '@/lib/userRoles';
import { Search, HelpCircle, Grid, Shield, Menu, X } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import UserProfileMenu from '@/components/profile/UserProfileMenu';
import { useState, useEffect } from 'react';
import CommandPalette from '@/components/CommandPalette';
import { useAuth } from '@/context/useAuth';
import NotificationBell from '@/components/NotificationBell';

export default function TopNavbar(): React.JSX.Element {
  const { user } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Listen to Cmd+K to toggle palette
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
        <div className="flex items-center gap-3">
          {/* Hamburger button for mobile/tablet */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            aria-label="Open global menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/projects" className="flex items-center gap-2 text-[#0052CC] font-bold hover:text-[#0747A6] dark:text-[#579DFF] dark:hover:text-[#85B8FF]">
            <Grid className="w-5 h-5" />
            <span className="text-xl">TaskBridge</span>
          </Link>

          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link href="/dashboard" className="hover:bg-slate-100 px-3 py-1.5 rounded-md transition-colors text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Dashboard</Link>
            <Link href="/projects" className="hover:bg-slate-100 px-3 py-1.5 rounded-md transition-colors text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Projects</Link>
            <Link href="/workspace" className="hover:bg-slate-100 px-3 py-1.5 rounded-md transition-colors text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Workspace</Link>
            <Link href="/workspace/teams" className="hover:bg-slate-100 px-3 py-1.5 rounded-md transition-colors text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Teams</Link>
            {isSuperAdmin(user?.role) && (
              <Link href="/superadmin" className="hover:bg-slate-100 px-3 py-1.5 rounded-md transition-colors text-blue-600 dark:text-blue-400 dark:hover:bg-slate-800 font-semibold">Admin</Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block w-64 cursor-pointer" onClick={() => setIsCommandPaletteOpen(true)}>
            <input
              type="text"
              placeholder="Search... (⌘K)"
              readOnly
              className="w-full h-8 pl-8 pr-10 text-xs bg-slate-100 border border-transparent hover:border-slate-350 dark:hover:border-slate-800 rounded-md outline-none transition-all cursor-pointer dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-505"
            />
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-505" />
            <span className="absolute right-2 top-1.5 px-1 py-0.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[8px] font-sans font-black rounded text-slate-400 dark:text-slate-505">
              ⌘K
            </span>
          </div>

          <ThemeToggle />
          <NotificationBell />
          {/* <button className="p-1.5 hover:bg-slate-100 rounded-full text-slate-650 dark:text-slate-300 dark:hover:bg-slate-800">
            <HelpCircle className="w-5 h-5" />
          </button> */}

          <UserProfileMenu
            extraItems={
              isSuperAdmin(user?.role)
                ? [{ icon: Shield, label: 'Admin Panel', href: '/superadmin' }]
                : []
            }
          />
        </div>
        <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      </nav>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-950 p-5 shadow-2xl md:hidden flex flex-col border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2 text-[#0052CC] font-bold dark:text-[#579DFF]">
                <Grid className="w-5 h-5" />
                <span className="text-lg">TaskBridge</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                aria-label="Close global menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1.5 font-medium">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                Projects
              </Link>
              <Link
                href="/workspace"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                Workspace
              </Link>
              <Link
                href="/workspace/teams"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                Teams
              </Link>
              {isSuperAdmin(user?.role) && (
                <Link
                  href="/superadmin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 text-blue-600 dark:text-blue-400"
                >
                  Admin Panel
                </Link>
              )}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
