'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListTodo,
  FileText,
  Building2,
  Headphones,
  X,
  Grid,
} from 'lucide-react';

const navItems = [
  { href: '/client-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/client-dashboard/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/client-dashboard/documents', label: 'Documents', icon: FileText },
  { href: '/client-dashboard/contact-us', label: 'Contact Us', icon: Headphones },
];

interface ClientSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientSidebar({
  isOpen,
  onClose,
}: ClientSidebarProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-30 flex h-full w-[220px] flex-col
          border-r border-slate-100 bg-white
          transition-transform duration-300 ease-in-out
          lg:static lg:z-auto lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
          <Link href="/client-dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[#DEEBFF] dark:bg-slate-900 shadow-sm">
              <Grid className="h-3.5 w-3.5 text-[#0052CC] dark:text-blue-400" />
            </div>
            <span className="text-md font-bold tracking-tight text-slate-800 dark:text-white">TaskBridge</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-700 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/client-dashboard' && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all
                      ${isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'
                        }`}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Headphones className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-semibold text-slate-800">Need Help?</p>
            </div>
            <p className="mb-2.5 text-[11px] leading-relaxed text-slate-500">
              Our support team is here to assist you with any questions.
            </p>
            <Link
              href="/client-dashboard/contact-us"
              className="block w-full text-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
