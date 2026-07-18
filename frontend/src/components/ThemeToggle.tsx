"use client";

import { useEffect, useState } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps): React.JSX.Element {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme ? savedTheme === 'dark' : prefersDark;

    document.documentElement.classList.toggle('dark', shouldUseDark);
    setIsDarkMode(shouldUseDark);
  }, []);

  const toggleTheme = (): void => {
    const nextMode = !isDarkMode;
    document.documentElement.classList.toggle('dark', nextMode);
    window.localStorage.setItem('theme', nextMode ? 'dark' : 'light');
    setIsDarkMode(nextMode);
  };

  const Icon = isDarkMode ? SunMedium : MoonStar;
  const label = isDarkMode ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus:ring-offset-slate-950 ${className}`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
    </button>
  );
}
