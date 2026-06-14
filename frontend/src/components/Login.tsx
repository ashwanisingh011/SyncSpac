import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { login } from '../api/authService.ts';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  GitBranch,
  Globe,
} from 'lucide-react';

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 30 };

// ─── Shared field wrapper ─────────────────────────────────────────────────────

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
}> = ({ id, label, type, value, onChange, placeholder, autoComplete, error, suffix }) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium" style={{ color: '#f7f8f8' }}>
        {label}
      </label>
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

const SocialBtn: React.FC<{ icon: React.ElementType; label: string; onClick?: () => void }> = ({
  icon: Icon,
  label,
  onClick,
}) => (
  <motion.button
    type="button"
    onClick={onClick}
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

// ─── Login ────────────────────────────────────────────────────────────────────

const Login: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const canSubmit = email.trim().length > 0 && password.length >= 1 && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch {
      setLoading(false);
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: '#0f1011' }}
    >
      {/* Subtle background glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(94,106,210,0.08) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        className="relative w-full max-w-[400px]"
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
          className="overflow-hidden rounded-2xl"
          style={{
            background: '#141516',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Card header */}
          <div
            className="px-8 pt-8 pb-5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <h1 className="text-[18px] font-bold tracking-[-0.2px]" style={{ color: '#f7f8f8' }}>
              Sign in
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: '#5e6169' }}>
              Welcome back to SyncSpac
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-5" style={{ padding: '32px' }}>
              {/* SSO buttons */}
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

              {/* Email */}
              <InputField
                id="login-email"
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@company.com"
                autoComplete="email"
                error={!!error}
              />

              {/* Password */}
              <InputField
                id="login-password"
                label="Password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="current-password"
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

              {/* Forgot password */}
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  className="text-[12px] transition-colors"
                  style={{ color: '#5e6169' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#9b9ea4')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#5e6169')}
                >
                  Forgot password?
                </button>
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
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
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
                id="login-submit"
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
                    Signing in…
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={13} />
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>

        {/* Register link */}
        <p className="mt-6 text-center text-[13px]" style={{ color: '#5e6169' }}>
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium transition-colors"
            style={{ color: '#9b9ea4' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f7f8f8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9b9ea4')}
          >
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;