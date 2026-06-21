import React, {useState} from 'react';
import { login } from '../api/authService.ts';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Box } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  }
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await login({email, password});
            navigate('/dashboard');
        } catch (err: any) {
            setError('Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#0E1015] flex flex-col justify-center items-center p-4 antialiased selection:bg-white/20">
            {/* Minimal Background Element */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-white/1.5 blur-[120px] rounded-full" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-95 relative z-10"
            >
                {/* Logo/Brand */}
                <motion.div variants={itemVariants} className="flex justify-center mb-8">
                    <div className="w-10 h-10 rounded-lg bg-[#2E3038] border border-white/10 flex items-center justify-center shadow-lg shadow-black/50">
                        <Box className="w-5 h-5 text-[#E8E8FD]" />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-[#E8E8FD] tracking-tight mb-2">Log in to Acme Corp</h1>
                    <p className="text-[14px] text-[#8A8F98]">Enter your details below to continue.</p>
                </motion.div>

                <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        <div className="relative group">
                            <input
                                type="email"
                                required
                                placeholder="Email address"
                                className="w-full bg-[#1C1D22] border border-white/6 text-[#E8E8FD] text-[14px] px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 focus:bg-[#232429] transition-all placeholder:text-[#8A8F98]"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative group">
                            <input
                                type="password"
                                required
                                placeholder="Password"
                                className="w-full bg-[#1C1D22] border border-white/6 text-[#E8E8FD] text-[14px] px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 focus:bg-[#232429] transition-all placeholder:text-[#8A8F98]"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} className="text-[#E5484D] text-[13px] bg-[#E5484D]/10 border border-[#E5484D]/20 px-3 py-2 rounded-md">
                            {error}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#E8E8FD] hover:bg-white text-[#0E1015] font-medium text-[14px] py-3 rounded-lg transition-colors flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {isLoading ? (
                           <div className="w-4 h-4 border-2 border-[#0E1015]/20 border-t-[#0E1015] rounded-full animate-spin" />
                        ) : (
                            <>
                                Continue
                                <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                            </>
                        )}
                    </button>
                </motion.form>

                <motion.div variants={itemVariants} className="mt-8 text-center">
                    <p className="text-[13px] text-[#8A8F98]">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-[#E8E8FD] hover:text-white hover:underline underline-offset-4 transition-colors">
                            Sign up
                        </Link>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    )
}

export default Login;