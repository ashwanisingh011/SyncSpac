"use client";

import { useEffect, useState } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

/** Enable smooth color transitions briefly while the theme flips. */
function withThemeTransition(apply: () => void): void {
  const root = document.documentElement;
  root.classList.add('theme-transition');
  apply();
  window.setTimeout(() => root.classList.remove('theme-transition'), 350);
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps): React.JSX.Element {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme ? savedTheme === 'dark' : prefersDark;

    document.documentElement.classList.toggle('dark', shouldUseDark);
    setIsDarkMode(shouldUseDark);
  }, []);

  const toggleTheme = (): void => {
    const nextMode = !isDarkMode;
    withThemeTransition(() => {
      document.documentElement.classList.toggle('dark', nextMode);
    });
    window.localStorage.setItem('theme', nextMode ? 'dark' : 'light');
    setIsDarkMode(nextMode);
  };

  const label = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-content-secondary shadow-card transition-colors hover:bg-surface-hover hover:text-content cursor-pointer',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDarkMode ? 'sun' : 'moon'}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="inline-flex"
        >
          {isDarkMode
            ? <SunMedium className="h-[18px] w-[18px]" strokeWidth={2} />
            : <MoonStar className="h-[18px] w-[18px]" strokeWidth={2} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
