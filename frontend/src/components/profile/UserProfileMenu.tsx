'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Settings, User, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { getUserInitials } from '@/lib/userDisplay';

export interface UserProfileMenuItem {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface UserProfileMenuProps {
  avatarSize?: 'sm' | 'md';
  showChevron?: boolean;
  className?: string;
  profileHref?: string | null;
  settingsHref?: string | null;
  settingsLabel?: string;
  showProfile?: boolean;
  showSettings?: boolean;
  extraItems?: UserProfileMenuItem[];
  /** Controlled open state (optional). */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

const avatarSizeClasses = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-8 h-8 text-xs',
} as const;

export default function UserProfileMenu({
  avatarSize = 'md',
  showChevron = true,
  className = '',
  profileHref = '/profile',
  settingsHref = '/settings',
  settingsLabel = 'Settings',
  showProfile = true,
  showSettings = true,
  extraItems = [],
  isOpen: controlledOpen,
  onOpenChange,
  onProfileClick,
  onSettingsClick,
}: UserProfileMenuProps): React.JSX.Element {
  const { user, logout } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = controlledOpen ?? internalOpen;

  const setOpen = (next: boolean): void => {
    if (controlledOpen === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = (): void => {
    setOpen(false);
    logout();
    router.push('/login');
  };

  const renderMenuAction = (
    key: string,
    icon: LucideIcon,
    label: string,
    options: { href?: string; onClick?: () => void; variant?: 'default' | 'danger' },
  ): ReactNode => {
    const Icon = icon;
    const baseClass =
      options.variant === 'danger'
        ? 'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors'
        : 'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-content-secondary hover:bg-surface-hover transition-colors';

    if (options.href) {
      return (
        <Link key={key} href={options.href} onClick={() => setOpen(false)} className={baseClass}>
          <Icon className="w-4 h-4 text-content-tertiary" />
          {label}
        </Link>
      );
    }

    return (
      <button
        key={key}
        type="button"
        onClick={() => {
          options.onClick?.();
          setOpen(false);
        }}
        className={baseClass}
      >
        <Icon className="w-4 h-4 text-content-tertiary" />
        {label}
      </button>
    );
  };

  const menuItems: ReactNode[] = [];

  if (showProfile) {
    if (profileHref) {
      menuItems.push(renderMenuAction('profile', User, 'My Profile', { href: profileHref }));
    } else if (onProfileClick) {
      menuItems.push(renderMenuAction('profile', User, 'My Profile', { onClick: onProfileClick }));
    }
  }

  if (showSettings) {
    if (settingsHref) {
      menuItems.push(
        renderMenuAction('settings', Settings, settingsLabel, { href: settingsHref }),
      );
    } else if (onSettingsClick) {
      menuItems.push(
        renderMenuAction('settings', Settings, settingsLabel, { onClick: onSettingsClick }),
      );
    } else {
      menuItems.push(renderMenuAction('settings-static', Settings, settingsLabel, {}));
    }
  }

  extraItems.forEach((item, index) => {
    menuItems.push(
      renderMenuAction(`extra-${index}`, item.icon, item.label, {
        href: item.href,
        onClick: item.onClick,
      }),
    );
  });

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div
          className={`${avatarSizeClasses[avatarSize]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden shrink-0`}
        >
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt={user.name ?? 'Profile'} className="w-full h-full object-cover" />
          ) : (
            getUserInitials(user?.name)
          )}
        </div>
        {showChevron && (
          <ChevronDown className="w-3.5 h-3.5 text-content-tertiary hidden sm:block" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-12 w-52 bg-surface rounded-xl shadow-xl border border-line overflow-hidden z-50"
        >
          <div className="px-4 py-3 border-b border-line">
            <p className="text-sm font-semibold text-content truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-content-tertiary truncate">
              {user?.email || ''}
            </p>
          </div>

          {menuItems}

          <div className="border-t border-line">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
