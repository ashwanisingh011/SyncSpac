"use client";

import { isSuperAdmin } from '@/lib/userRoles';
import { Search, Shield, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import ThemeToggle from '@/components/ThemeToggle';
import Logo from '@/components/Logo';
import UserProfileMenu from '@/components/profile/UserProfileMenu';
import { useState, useEffect } from 'react';
import CommandPalette from '@/components/CommandPalette';
import { useAuth } from '@/context/useAuth';
import NotificationBell from '@/components/NotificationBell';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Projects', href: '/projects' },
  { label: 'Workspace', href: '/workspace' },
  { label: 'Teams', href: '/workspace/teams' },
];

export default function TopNavbar(): React.JSX.Element {
  const { user } = useAuth();
  const pathname = usePathname();
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

  const isActive = (href: string): boolean => {
    if (href === '/workspace') return pathname === '/workspace' || (pathname.startsWith('/workspace/') && !pathname.startsWith('/workspace/teams'));
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <nav className="glass sticky top-0 z-50 flex h-14 items-center justify-between border-b border-line px-4 text-content">
        <div className="flex items-center gap-3">
          {/* Hamburger button for mobile/tablet */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-content-tertiary hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Open global menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/projects" className="transition-opacity hover:opacity-80">
            <Logo size={24} />
          </Link>

          <div className="hidden md:flex items-center gap-1 text-sm font-medium ml-2">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative px-3 py-1.5 rounded-md transition-colors',
                    active ? 'text-primary' : 'text-content-secondary hover:text-content hover:bg-surface-hover'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="topnav-active-pill"
                      className="absolute inset-0 rounded-md bg-primary-subtle"
                      transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </Link>
              );
            })}
            {isSuperAdmin(user?.role) && (
              <Link
                href="/superadmin"
                className="px-3 py-1.5 rounded-md transition-colors font-semibold text-primary hover:bg-surface-hover"
              >
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="group relative hidden sm:flex w-64 h-9 items-center gap-2 rounded-lg border border-line bg-surface-sunken px-3 text-xs text-content-tertiary transition-all hover:border-line-strong hover:bg-surface cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search anything…</span>
            <span className="rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-semibold shadow-card">
              ⌘K
            </span>
          </button>

          <ThemeToggle />
          <NotificationBell />

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
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px] md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed top-0 left-0 z-50 h-full w-64 bg-surface-overlay p-5 shadow-overlay md:hidden flex flex-col border-r border-line text-content"
            >
              <div className="flex items-center justify-between pb-4 border-b border-line mb-5">
                <Logo size={22} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-content-tertiary hover:text-content hover:bg-surface-hover transition-colors cursor-pointer"
                  aria-label="Close global menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1 font-medium">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 + i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'block px-3 py-2.5 rounded-lg text-sm transition-colors',
                        isActive(link.href)
                          ? 'bg-primary-subtle text-primary font-semibold'
                          : 'text-content-secondary hover:bg-surface-hover hover:text-content'
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                {isSuperAdmin(user?.role) && (
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 + NAV_LINKS.length * 0.05 }}
                  >
                    <Link
                      href="/superadmin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-primary hover:bg-surface-hover"
                    >
                      Admin Panel
                    </Link>
                  </motion.div>
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
