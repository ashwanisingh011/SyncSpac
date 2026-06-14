import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createProject } from '../api/projectService.ts';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout.tsx';
import {
  FolderKanban,
  Lock,
  Globe,
  ChevronDown,
  Users,
  ArrowRight,
  Check,
  X,
  Info,
  Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Visibility = 'private' | 'internal' | 'public';
type IconOption = { key: string; label: string; color: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const VISIBILITY_OPTIONS: {
  key: Visibility;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    key: 'private',
    label: 'Private',
    description: 'Only invited members can access',
    icon: Lock,
  },
  {
    key: 'internal',
    label: 'Internal',
    description: 'All workspace members can view',
    icon: Users,
  },
  {
    key: 'public',
    label: 'Public',
    description: 'Anyone with the link can view',
    icon: Globe,
  },
];

const PROJECT_ICONS: IconOption[] = [
  { key: 'kanban',    label: '⬛', color: '#5e6ad2' },
  { key: 'rocket',   label: '🚀', color: '#26b5ce' },
  { key: 'fire',     label: '🔥', color: '#e5534b' },
  { key: 'star',     label: '⭐', color: '#f2a20a' },
  { key: 'gem',      label: '💎', color: '#7c5aed' },
  { key: 'bolt',     label: '⚡', color: '#4cb782' },
  { key: 'leaf',     label: '🌿', color: '#4cb782' },
  { key: 'shield',   label: '🛡️', color: '#388bfd' },
  { key: 'globe',    label: '🌍', color: '#26b5ce' },
  { key: 'brain',    label: '🧠', color: '#7c5aed' },
  { key: 'target',   label: '🎯', color: '#e5534b' },
  { key: 'chart',    label: '📊', color: '#5e6ad2' },
];

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30, mass: 0.8 };

// ─── Subcomponents ────────────────────────────────────────────────────────────

/** Linear-style input field */
const Field: React.FC<{
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, hint, required, children }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <label className="text-[13px] font-medium" style={{ color: '#f7f8f8' }}>
        {label}
        {required && <span style={{ color: '#e5534b' }}> *</span>}
      </label>
      {hint && (
        <span title={hint} className="cursor-help" style={{ color: '#404348' }}>
          <Info size={12} />
        </span>
      )}
    </div>
    {children}
  </div>
);

/** Visibility dropdown */
const VisibilitySelect: React.FC<{
  value: Visibility;
  onChange: (v: Visibility) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = VISIBILITY_OPTIONS.find(o => o.key === value)!;
  const Icon = selected.icon;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-2.5 rounded-md px-4 py-2.5 text-left transition-colors"
        style={{
          background: '#1a1b1e',
          border: open ? '1px solid rgba(94,106,210,0.5)' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: open ? '0 0 0 2px rgba(94,106,210,0.15)' : undefined,
        }}
        whileTap={{ scale: 0.99 }}
      >
        <Icon size={14} style={{ color: '#9b9ea4' }} />
        <span className="flex-1 text-[13px]" style={{ color: '#f7f8f8' }}>{selected.label}</span>
        <span className="text-[11px] truncate mr-2" style={{ color: '#5e6169' }}>{selected.description}</span>
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
            className="absolute left-0 top-[calc(100%+4px)] z-30 w-full overflow-hidden rounded-lg"
            style={{
              background: '#1e1f22',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
            initial={{ scale: 0.97, y: -4, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: -4, opacity: 0 }}
            transition={SPRING}
          >
            <div className="p-1">
              {VISIBILITY_OPTIONS.map(opt => {
                const OIcon = opt.icon;
                const isSelected = opt.key === value;
                return (
                  <motion.button
                    key={opt.key}
                    type="button"
                    onClick={() => { onChange(opt.key); setOpen(false); }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors"
                    style={{ background: isSelected ? 'rgba(94,106,210,0.12)' : undefined }}
                    whileHover={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <OIcon size={13} style={{ color: isSelected ? '#5e6ad2' : '#5e6169' }} />
                    <span className="flex-1">
                      <span className="block text-[13px] font-medium" style={{ color: '#f7f8f8' }}>{opt.label}</span>
                      <span className="block text-[11px]" style={{ color: '#5e6169' }}>{opt.description}</span>
                    </span>
                    {isSelected && <Check size={12} style={{ color: '#5e6ad2' }} />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Icon picker */
const IconPicker: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    {PROJECT_ICONS.map(icon => (
      <motion.button
        key={icon.key}
        type="button"
        onClick={() => onChange(icon.key)}
        title={icon.key}
        className="flex h-8 w-8 items-center justify-center rounded-md text-base transition-all"
        style={{
          background: value === icon.key ? `${icon.color}22` : 'rgba(255,255,255,0.04)',
          border: value === icon.key ? `1.5px solid ${icon.color}60` : '1.5px solid transparent',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        transition={SPRING}
      >
        {icon.label}
      </motion.button>
    ))}
  </div>
);

// ─── Success overlay ──────────────────────────────────────────────────────────

const SuccessOverlay: React.FC = () => (
  <motion.div
    className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-xl"
    style={{ background: '#141516' }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.2 }}
  >
    <motion.div
      className="flex h-14 w-14 items-center justify-center rounded-full"
      style={{ background: 'rgba(76,183,130,0.15)', border: '1px solid rgba(76,183,130,0.3)' }}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.05 }}
    >
      <Check size={24} style={{ color: '#4cb782' }} strokeWidth={2.5} />
    </motion.div>
    <motion.p
      className="mt-4 text-[15px] font-semibold"
      style={{ color: '#f7f8f8' }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
    >
      Project created!
    </motion.p>
    <motion.p
      className="mt-1 text-[13px]"
      style={{ color: '#5e6169' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.18 }}
    >
      Redirecting to your board…
    </motion.p>
  </motion.div>
);

// ─── CreateProject Page ───────────────────────────────────────────────────────

const CreateProject: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName]             = useState('');
  const [description, setDesc]      = useState('');
  const [identifier, setIdentifier] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('internal');
  const [selectedIcon, setIcon]     = useState('kanban');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');

  // Auto-generate identifier from name
  useEffect(() => {
    if (name) {
      setIdentifier(
        name
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 4) || ''
      );
    }
  }, [name]);

  const canSubmit = name.trim().length > 0 && !loading;
  const selectedIconMeta = PROJECT_ICONS.find(i => i.key === selectedIcon);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await createProject({ name: name.trim(), description, identifier, visibility });
      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate(`/project/${data.project._id}`), 1400);
    } catch {
      setLoading(false);
      setError('Failed to create project. Please try again.');
    }
  };

  return (
    <DashboardLayout defaultActiveNav="projects">
      <div
        className="flex h-full items-start justify-center overflow-y-auto px-8 py-12 scrollbar-none"
        style={{ background: '#0f1011' }}
      >
        <div className="w-full max-w-xl">
          {/* Page heading */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <FolderKanban size={15} style={{ color: '#5e6ad2' }} />
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#5e6169' }}>
                Projects
              </span>
            </div>
            <h1 className="text-[22px] font-bold tracking-[-0.3px]" style={{ color: '#f7f8f8' }}>
              Create project
            </h1>
            <p className="mt-1.5 text-[13px]" style={{ color: '#5e6169' }}>
              Projects help you organize and track your team's work in one place.
            </p>
          </motion.div>

          {/* Form card */}
          <motion.div
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: '#141516',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.06 }}
          >
            <AnimatePresence>
              {success && <SuccessOverlay />}
            </AnimatePresence>

            <form onSubmit={handleSubmit} noValidate>
              {/* Form body */}
              <div className="flex flex-col gap-6" style={{ padding: '32px' }}>
                {/* Icon + Name row */}
                <div className="flex items-start gap-3">
                  {/* Icon badge */}
                  <motion.div
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-xl"
                    style={{
                      background: selectedIconMeta
                        ? `${selectedIconMeta.color}18`
                        : 'rgba(255,255,255,0.05)',
                      border: selectedIconMeta
                        ? `1px solid ${selectedIconMeta.color}35`
                        : '1px solid rgba(255,255,255,0.07)',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={SPRING}
                  >
                    {selectedIconMeta?.label ?? '📁'}
                  </motion.div>

                  {/* Name input */}
                  <div className="flex-1">
                    <Field label="Project name" required>
                      <input
                        id="project-name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Design System v3, Q3 Roadmap…"
                        autoFocus
                        className="w-full rounded-lg px-4 py-3 text-[13px] outline-none transition-all placeholder:text-[#404348]"
                        style={{
                          background: '#1a1b1e',
                          border: name ? '1px solid rgba(94,106,210,0.4)' : '1px solid rgba(255,255,255,0.08)',
                          color: '#f7f8f8',
                          boxShadow: name ? '0 0 0 2px rgba(94,106,210,0.1)' : undefined,
                        }}
                        onFocus={e => {
                          e.target.style.border = '1px solid rgba(94,106,210,0.5)';
                          e.target.style.boxShadow = '0 0 0 2px rgba(94,106,210,0.12)';
                        }}
                        onBlur={e => {
                          if (!name) {
                            e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                            e.target.style.boxShadow = 'none';
                          }
                        }}
                      />
                    </Field>
                  </div>
                </div>

                {/* Description */}
                <Field label="Description" hint="Optional — shown in project listings">
                  <textarea
                    id="project-description"
                    value={description}
                    onChange={e => setDesc(e.target.value)}
                    placeholder="What is this project about? Add context for your team…"
                    rows={3}
                    className="w-full resize-none rounded-lg px-4 py-3 text-[13px] outline-none transition-all placeholder:text-[#404348]"
                    style={{
                      background: '#1a1b1e',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#f7f8f8',
                    }}
                    onFocus={e => {
                      e.target.style.border = '1px solid rgba(94,106,210,0.5)';
                      e.target.style.boxShadow = '0 0 0 2px rgba(94,106,210,0.10)';
                    }}
                    onBlur={e => {
                      e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </Field>

                {/* Identifier */}
                <Field label="Identifier" hint="Used as prefix for issue numbers (e.g. SYN-42)">
                  <div className="relative">
                    <span
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-mono font-semibold"
                      style={{ color: '#5e6169' }}
                    >
                      #
                    </span>
                    <input
                      id="project-identifier"
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
                      placeholder="PROJ"
                      className="w-full rounded-lg py-3 pl-8 pr-4 font-mono text-[13px] uppercase tracking-widest outline-none transition-all placeholder:text-[#404348]"
                      style={{
                        background: '#1a1b1e',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#f7f8f8',
                      }}
                      onFocus={e => {
                        e.target.style.border = '1px solid rgba(94,106,210,0.5)';
                        e.target.style.boxShadow = '0 0 0 2px rgba(94,106,210,0.10)';
                      }}
                      onBlur={e => {
                        e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </Field>

                {/* Visibility */}
                <Field label="Visibility">
                  <VisibilitySelect value={visibility} onChange={setVisibility} />
                </Field>

                {/* Icon picker */}
                <Field label="Project icon">
                  <IconPicker value={selectedIcon} onChange={setIcon} />
                </Field>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12px]"
                      style={{
                        background: 'rgba(229,83,75,0.1)',
                        border: '1px solid rgba(229,83,75,0.25)',
                        color: '#e5534b',
                      }}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X size={13} style={{ color: '#e5534b' }} />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3">
                  <motion.button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="rounded-lg px-4 py-2 text-[13px] font-medium transition-colors hover:bg-white/[0.05]"
                    style={{ color: '#5e6169' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    id="create-project-btn"
                    type="submit"
                    disabled={!canSubmit}
                    className="flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-semibold transition-all disabled:cursor-not-allowed"
                    style={{
                      background: canSubmit ? '#5e6ad2' : 'rgba(255,255,255,0.06)',
                      color: canSubmit ? '#fff' : '#404348',
                    }}
                    whileHover={canSubmit ? { background: '#6b78e5' } : {}}
                    whileTap={canSubmit ? { scale: 0.97 } : {}}
                    transition={SPRING}
                  >
                    {loading ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 size={13} />
                        </motion.span>
                        Creating…
                      </>
                    ) : (
                      <>
                        Create project
                        <ArrowRight size={13} />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>

          {/* Tip */}
          <motion.p
            className="mt-6 text-center text-[11px]"
            style={{ color: '#404348' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            You can change visibility and settings anytime after creating the project.
          </motion.p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateProject;