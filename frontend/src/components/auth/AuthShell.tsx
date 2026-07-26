'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Logo, { LogoMark } from '@/components/Logo';
import { cn } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────────
   AuthShell — split-screen auth layout.
   Left: permanently-dark brand panel with a live product mockup.
   Right: minimal, typography-led form column.
   ──────────────────────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;

/* ─── Live board mockup ──────────────────────────────────────── */

interface MockCard {
  id: string;
  issueKey: string;
  title: string;
  label: string;
  labelClass: string;
  avatarClass: string;
}

const BOARD: { title: string; dot: string; cards: MockCard[] }[] = [
  {
    title: 'To Do',
    dot: 'bg-white/30',
    cards: [
      { id: 't1', issueKey: 'WEB-148', title: 'Refine pricing page hero', label: 'Design', labelClass: 'bg-violet-400/15 text-violet-300', avatarClass: 'bg-violet-500' },
      { id: 't2', issueKey: 'WEB-151', title: 'Empty states for search', label: 'UX', labelClass: 'bg-sky-400/15 text-sky-300', avatarClass: 'bg-sky-500' },
    ],
  },
  {
    title: 'In Progress',
    dot: 'bg-[#579DFF]',
    cards: [
      { id: 'p1', issueKey: 'WEB-142', title: 'Board drag & drop polish', label: 'Frontend', labelClass: 'bg-blue-400/15 text-blue-300', avatarClass: 'bg-blue-500' },
    ],
  },
  {
    title: 'Done',
    dot: 'bg-[#4BCE97]',
    cards: [
      { id: 'd1', issueKey: 'WEB-139', title: 'Session timeout handling', label: 'Auth', labelClass: 'bg-emerald-400/15 text-emerald-300', avatarClass: 'bg-emerald-500' },
    ],
  },
];

/** The card that periodically ships from In Progress → Done. */
const MOVING_CARD: MockCard = {
  id: 'mv1',
  issueKey: 'WEB-136',
  title: 'New auth experience',
  label: 'Release',
  labelClass: 'bg-amber-400/15 text-amber-300',
  avatarClass: 'bg-amber-500',
};

function BoardCard({ card, shipped = false }: { card: MockCard; shipped?: boolean }) {
  return (
    <motion.div
      layoutId={card.id === 'mv1' ? 'auth-moving-card' : undefined}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="rounded-lg border border-white/[0.07] bg-white/[0.05] p-2.5 backdrop-blur-sm"
    >
      <p className="text-[11px] font-medium leading-snug text-white/85">{card.title}</p>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn('rounded px-1.5 py-px text-[8.5px] font-semibold', card.labelClass)}>
            {card.label}
          </span>
          <span className="text-[8.5px] font-semibold tracking-wide text-white/35">{card.issueKey}</span>
        </div>
        <div className="flex items-center gap-1">
          {shipped && (
            <motion.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.25 }}
              viewBox="0 0 16 16" className="h-3 w-3 text-[#4BCE97]" fill="currentColor"
            >
              <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm3.22-8.72a.75.75 0 00-1.06-1.06L7.25 8.13 5.84 6.72a.75.75 0 10-1.06 1.06l1.94 1.94a.75.75 0 001.06 0l3.44-3.44z" />
            </motion.svg>
          )}
          <span className={cn('h-4 w-4 rounded-full ring-[1.5px] ring-[#101623]', card.avatarClass)} />
        </div>
      </div>
    </motion.div>
  );
}

function LiveBoardMock() {
  const [shipped, setShipped] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setShipped((s) => !s), 4200);
    return () => clearInterval(t);
  }, []);

  return (
    <LayoutGroup>
      <div className="w-full rounded-xl border border-white/[0.08] bg-[#0C111B]/80 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.7)]">
        {/* Product chrome */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <LogoMark size={13} />
            <span className="text-white/60">Website Redesign</span>
            <span className="text-white/25">/</span>
            <span>Board</span>
          </div>
          <div className="flex -space-x-1">
            <span className="h-4 w-4 rounded-full bg-rose-500 ring-[1.5px] ring-[#0C111B]" />
            <span className="h-4 w-4 rounded-full bg-blue-500 ring-[1.5px] ring-[#0C111B]" />
            <span className="h-4 w-4 rounded-full bg-emerald-500 ring-[1.5px] ring-[#0C111B]" />
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-3 gap-2.5 p-3">
          {BOARD.map((col, i) => {
            const isProgress = i === 1;
            const isDone = i === 2;
            return (
              <div key={col.title} className="rounded-lg bg-white/[0.025] p-2">
                <div className="mb-2 flex items-center gap-1.5 px-0.5">
                  <span className={cn('h-1.5 w-1.5 rounded-full', col.dot)} />
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40">
                    {col.title}
                  </span>
                  <span className="ml-auto text-[9px] tabular-nums text-white/25">
                    {col.cards.length + ((isProgress && !shipped) || (isDone && shipped) ? 1 : 0)}
                  </span>
                </div>
                <div className="space-y-2">
                  {isProgress && !shipped && <BoardCard card={MOVING_CARD} />}
                  {col.cards.map((card) => (
                    <BoardCard key={card.id} card={card} />
                  ))}
                  {isDone && shipped && <BoardCard card={MOVING_CARD} shipped />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </LayoutGroup>
  );
}

/* ─── Rotating quote ─────────────────────────────────────────── */

const QUOTES = [
  {
    text: 'The first PM tool where the board actually feels faster than a spreadsheet.',
    name: 'Priya N.',
    role: 'Engineering Lead',
  },
  {
    text: 'We moved three teams off Jira in a week. Nobody asked to go back.',
    name: 'Marcus T.',
    role: 'Head of Product',
  },
  {
    text: 'Sprint planning went from an hour to fifteen minutes.',
    name: 'Aiko S.',
    role: 'Delivery Manager',
  },
];

function RotatingQuote() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const quote = QUOTES[index];

  return (
    <div className="relative h-[74px]">
      <AnimatePresence mode="wait">
        <motion.figure
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <blockquote className="text-[13.5px] leading-relaxed text-white/70">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <figcaption className="mt-2 text-[11px] text-white/40">
            <span className="font-medium text-white/60">{quote.name}</span>
            <span className="mx-1.5">·</span>
            {quote.role}
          </figcaption>
        </motion.figure>
      </AnimatePresence>
      {/* Progress dots */}
      <div className="absolute -bottom-4 flex gap-1.5">
        {QUOTES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Quote ${i + 1}`}
            className={cn(
              'h-1 rounded-full transition-all duration-300 cursor-pointer',
              i === index ? 'w-4 bg-white/50' : 'w-1 bg-white/20 hover:bg-white/30'
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Brand panel (always dark) ──────────────────────────────── */

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-[#0A0E16] lg:flex lg:w-[52%] lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* Fine grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 100% 80% at 30% 20%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 80% at 30% 20%, black 20%, transparent 80%)',
        }}
      />
      {/* Static glows — subtle, no drifting blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[440px] w-[440px] rounded-full bg-[#1D7AFC] opacity-[0.13] blur-[128px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[380px] w-[380px] rounded-full bg-[#7C6CF0] opacity-[0.10] blur-[128px]" />

      {/* Logo */}
      <div className="relative">
        <Link href="/" className="inline-flex items-center transition-opacity hover:opacity-80">
          <Logo size={27} onDark />
        </Link>
      </div>

      {/* Center: headline + live mock */}
      <div className="relative max-w-[480px]">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-white xl:text-[36px]"
        >
          Where focused teams
          <br />
          ship their best work.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
          className="mt-4 max-w-[400px] text-[14px] leading-relaxed text-white/50"
        >
          Boards, backlogs, and sprints — without the ceremony. Everything your team needs to plan, track, and deliver.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: EASE }}
          className="mt-10"
        >
          <LiveBoardMock />
        </motion.div>
      </div>

      {/* Bottom: rotating quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="relative max-w-[400px]"
      >
        <RotatingQuote />
      </motion.div>
    </aside>
  );
}

/* ─── Shell ──────────────────────────────────────────────────── */

export interface AuthShellProps {
  /** Form column heading. */
  title: string;
  /** One-line supporting copy under the heading. */
  subtitle?: string;
  /** Top-right alternate action, rendered as hint text + outlined button. */
  altAction?: { hint?: string; label: string; href: string };
  children: ReactNode;
  /** Small print under the form. */
  footnote?: ReactNode;
}

export default function AuthShell({ title, subtitle, altAction, children, footnote }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-surface text-content">
      <BrandPanel />

      {/* Form column */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-[72px] items-center justify-between px-5 sm:px-8">
          {/* Mobile logo (brand panel hidden below lg) */}
          <Link href="/" className="transition-opacity hover:opacity-80 lg:invisible">
            <Logo size={24} />
          </Link>
          <div className="flex items-center gap-2.5">
            {altAction && (
              <div className="flex items-center gap-3">
                {altAction.hint && (
                  <span className="hidden text-[13px] text-content-tertiary sm:inline">
                    {altAction.hint}
                  </span>
                )}
                <Link
                  href={altAction.href}
                  className={cn(
                    'inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3.5 text-[13px] font-medium text-content',
                    'transition-colors duration-150 hover:border-line-strong hover:bg-surface-hover'
                  )}
                >
                  {altAction.label}
                </Link>
              </div>
            )}
            <span aria-hidden className="mx-1 hidden h-5 w-px bg-line sm:block" />
            <ThemeToggle />
          </div>
        </header>

        {/* Form */}
        <main className="flex flex-1 items-center justify-center px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="w-full max-w-[384px]"
          >
            <h2 className="text-[24px] font-semibold tracking-[-0.015em] text-content">{title}</h2>
            {subtitle && <p className="mt-1.5 text-[13.5px] leading-relaxed text-content-tertiary">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </motion.div>
        </main>

        {/* Footnote */}
        <footer className="p-6 text-center text-[11.5px] leading-relaxed text-content-tertiary">
          {footnote ?? (
            <>By continuing, you agree to SyncSpac&apos;s Terms of Service and Privacy Policy.</>
          )}
        </footer>
      </div>
    </div>
  );
}

/* ─── Field primitives (labelled, senior-grade focus states) ─── */

export function AuthField({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  /** Right-aligned helper next to the label, e.g. "Forgot password?" */
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-content-secondary">
          {label}
        </label>
        {hint}
      </div>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.18 }}
            className="text-xs text-danger"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export const authInputClass = (hasError?: boolean) =>
  cn(
    'h-11 w-full rounded-lg border bg-surface px-3.5 text-[14px] text-content outline-none',
    'transition-[border-color,box-shadow] duration-150 placeholder:text-content-tertiary/70',
    hasError
      ? 'border-danger shadow-[0_0_0_3px_color-mix(in_srgb,var(--danger)_12%,transparent)]'
      : 'border-line hover:border-line-strong focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-subtle)]'
  );

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = '••••••••••',
  error,
  autoComplete,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: boolean;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn(authInputClass(error), 'pr-11')}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-content-tertiary transition-colors hover:text-content cursor-pointer"
      >
        {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
}

/** Primary submit button with inner-highlight — premium, not flat. */
export function AuthSubmit({
  loading,
  children,
  loadingLabel,
}: {
  loading?: boolean;
  children: ReactNode;
  loadingLabel?: string;
}) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileTap={loading ? undefined : { scale: 0.985 }}
      className={cn(
        'relative h-11 w-full overflow-hidden rounded-lg text-[14px] font-semibold text-white cursor-pointer',
        'bg-gradient-to-b from-brand-500 to-brand-600 dark:from-brand-400 dark:to-brand-500',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(9,30,66,0.24)]',
        'transition-[filter] duration-150 hover:brightness-[1.06] active:brightness-95',
        'disabled:cursor-not-allowed disabled:opacity-60'
      )}
    >
      <span className={cn('inline-flex items-center justify-center gap-2 transition-opacity', loading && 'opacity-0')}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          {loadingLabel}
        </span>
      )}
    </motion.button>
  );
}

/** "or" divider. */
export function AuthDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[11px] font-medium uppercase tracking-wider text-content-tertiary">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** Secondary (social) button. */
export function AuthSocialButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-surface text-[13.5px] font-medium text-content',
        'transition-colors duration-150 hover:border-line-strong hover:bg-surface-hover cursor-pointer'
      )}
    >
      {children}
    </button>
  );
}
