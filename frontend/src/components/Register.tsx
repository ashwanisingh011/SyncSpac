import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { register } from '../api/authService.ts';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  GitBranch,
  Globe,
  Check,
} from 'lucide-react';

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30 };

// ─── Password strength ────────────────────────────────────────────────────────

const getStrength = (p: string): { score: number; label: string; color: string } => {
  if (p.length === 0) return { score: 0, label: '',        color: 'transparent'           };
  if (p.length < 6)   return { score: 1, label: 'Weak',   color: '#e5534b'               };
  if (p.length < 10)  return { score: 2, label: 'Fair',   color: '#f2a20a'               };
  if (/[A-Z]/.test(p) && /[0-9]/.test(p))
                      return { score: 4, label: 'Strong',  color: '#4cb782'               };
  return              { score: 3, label: 'Good',   color: '#5e6ad2'               };
};

const StrengthBar: React.FC<{ password: string }> = ({ password }) => {
  const { score, label, color } = getStrength(password);
  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-1.5"
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            className="h-0.5 flex-1 rounded-full"
            animate={{ background: i <= score ? color : 'rgba(255,255,255,0.08)' }}
            transition={{ duration: 0.25 }}
          />
        ))}
      </div>
      <p className="text-[11px] font-medium" style={{ color }}>
        {label} password
      </p>
    </motion.div>
  );
};

// ─── Input field ──────────────────────────────────────────────────────────────

const InputField: React.FC<{
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: boolean;
  suffix?: React.ReactNode;
  hint?: string;
}> = ({ id, label, type, value, onChange, placeholder, autoComplete, error, suffix, hint }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-medium" style={{ color: '#f7f8f8' }}>
          {label}
        </label>
        {hint && <span className="text-[11px]" style={{ color: '#5e6169' }}>{hint}</span>}
      </div>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full rounded-md px-4 py-2.5 text-[13px] outline-none transition-all placeholder:text-[#404348]"
          style={{
            background: '#1a1b1e',
            color: '#f7f8f8',
            border: error
              ? '1px solid rgba(229,83,75,0.5)'
              : focused
              ? '1px solid rgba(94,106,210,0.55)'
              : '1px solid rgba(255,255,255,0.08)',
            boxShadow: focused
              ? error
                ? '0 0 0 2px rgba(229,83,75,0.10)'
                : '0 0 0 2px rgba(94,106,210,0.12)'
              : 'none',
            paddingRight: suffix ? '2.5rem' : undefined,
          }}
        />
        {suffix && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Social button ────────────────────────────────────────────────────────────

const SocialBtn: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <motion.button
    type="button"
    className="flex flex-1 items-center justify-center gap-2.5 rounded-md py-2.5 text-[13px] font-medium transition-colors"
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      color: '#9b9ea4',
    }}
    whileHover={{ background: 'rgba(255,255,255,0.07)', color: '#f7f8f8' }}
    whileTap={{ scale: 0.98 }}
    transition={SPRING}
  >
    <Icon size={14} />
    {label}
  </motion.button>
);

// ─── Logo mark ────────────────────────────────────────────────────────────────

const LogoMark: React.FC = () => (
  <div className="flex items-center gap-2">
    <div
      className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-black text-white"
      style={{ background: '#5e6ad2' }}
    >
      S
    </div>
    <span className="text-[15px] font-bold tracking-[-0.3px]" style={{ color: '#f7f8f8' }}>
      SyncSpac
    </span>
  </div>
);

// ─── Terms bullet ─────────────────────────────────────────────────────────────

const TermsBullet: React.FC<{ text: string }> = ({ text }) => (
  <li className="flex items-start gap-2 text-[12px]" style={{ color: '#5e6169' }}>
    <Check size={11} className="mt-0.5 shrink-0" style={{ color: '#4cb782' }} />
    {text}
  </li>
);

// ─── Register ────────────────────────────────────────────────────────────────

const Register: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const navigate = useNavigate();

  const set = (key: keyof typeof formData) => (v: string) =>
    setFormData(prev => ({ ...prev, [key]: v }));

  const canSubmit =
    formData.name.trim().length >= 2 &&
    formData.email.includes('@') &&
    formData.password.length >= 6 &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch {
      setLoading(false);
      setError('Registration failed. That email may already be in use.');
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ background: '#0f1011' }}
    >
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(94,106,210,0.08) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        className="relative w-full max-w-[420px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <LogoMark />
        </div>

        {/* Card */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: '#141516',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Success overlay */}
          <AnimatePresence>
            {success && (
              <motion.div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center"
                style={{ background: '#141516' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: 'rgba(76,183,130,0.12)', border: '1px solid rgba(76,183,130,0.25)' }}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                >
                  <Check size={22} style={{ color: '#4cb782' }} strokeWidth={2.5} />
                </motion.div>
                <motion.p
                  className="mt-4 text-[15px] font-semibold"
                  style={{ color: '#f7f8f8' }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Account created!
                </motion.p>
                <motion.p
                  className="mt-1 text-[13px]"
                  style={{ color: '#5e6169' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.18 }}
                >
                  Taking you to your dashboard…
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card header */}
          <div
            className="px-8 pt-8 pb-5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <h1 className="text-[18px] font-bold tracking-[-0.2px]" style={{ color: '#f7f8f8' }}>
              Create account
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: '#5e6169' }}>
              Start collaborating with your team
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-5" style={{ padding: '32px' }}>
              {/* SSO */}
              <div className="flex gap-3">
                <SocialBtn icon={GitBranch} label="GitHub" />
                <SocialBtn icon={Globe} label="Google" />
              </div>

              {/* Divider */}
              <div className="my-1 flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span className="text-[11px] font-medium" style={{ color: '#404348' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Full name */}
              <InputField
                id="reg-name"
                label="Full name"
                type="text"
                value={formData.name}
                onChange={set('name')}
                placeholder="Ashwani Singh"
                autoComplete="name"
                error={!!error}
              />

              {/* Email */}
              <InputField
                id="reg-email"
                label="Work email"
                type="email"
                value={formData.email}
                onChange={set('email')}
                placeholder="you@company.com"
                autoComplete="email"
                error={!!error}
              />

              {/* Password */}
              <div className="space-y-2">
                <InputField
                  id="reg-password"
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  value={formData.password}
                  onChange={set('password')}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  hint="min. 6 chars"
                  error={!!error}
                  suffix={
                    <motion.button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="rounded p-0.5 transition-colors"
                      style={{ color: '#5e6169' }}
                      whileHover={{ color: '#9b9ea4' }}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                    </motion.button>
                  }
                />
                <AnimatePresence>
                  {formData.password && <StrengthBar password={formData.password} />}
                </AnimatePresence>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12px]"
                    style={{
                      background: 'rgba(229,83,75,0.08)',
                      border: '1px solid rgba(229,83,75,0.20)',
                      color: '#e5534b',
                    }}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlertCircle size={13} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                id="register-submit"
                type="submit"
                disabled={!canSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-[13px] font-semibold transition-all disabled:cursor-not-allowed"
                style={{
                  background: canSubmit ? '#5e6ad2' : 'rgba(255,255,255,0.05)',
                  color: canSubmit ? '#fff' : '#404348',
                }}
                whileHover={canSubmit ? { background: '#6b78e5', boxShadow: '0 0 18px rgba(94,106,210,0.3)' } : {}}
                whileTap={canSubmit ? { scale: 0.98 } : {}}
                transition={SPRING}
              >
                {loading ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                      <Loader2 size={13} />
                    </motion.span>
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={13} />
                  </>
                )}
              </motion.button>

              {/* Fine print */}
              <ul className="space-y-1.5 pt-3">
                <TermsBullet text="Free 14-day trial — no credit card needed" />
                <TermsBullet text="By continuing you agree to our Terms of Service" />
              </ul>
            </div>
          </form>
        </div>

        {/* Login link */}
        <p className="mt-6 text-center text-[13px]" style={{ color: '#5e6169' }}>
          Already have an account?{' '}
          <Link
            to="/"
            className="font-medium transition-colors"
            style={{ color: '#9b9ea4' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f7f8f8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9b9ea4')}
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;