import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 - Page Not Found | TaskBridge',
  description: 'The page you are looking for does not exist or has been moved.',
};

const animationsStyle = `
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(2deg); }
  }
  @keyframes float-fast {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes cloud-move-left {
    0%, 100% { transform: translateX(0px); }
    50% { transform: translateX(-12px); }
  }
  @keyframes cloud-move-right {
    0%, 100% { transform: translateX(0px); }
    50% { transform: translateX(15px); }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.6; transform: scale(1); filter: drop-shadow(0 0 10px rgba(0, 82, 204, 0.3)); }
    50% { opacity: 0.9; transform: scale(1.05); filter: drop-shadow(0 0 25px rgba(0, 82, 204, 0.6)); }
  }
  @keyframes rotate-gear {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-float-slow {
    animation: float-slow 6s ease-in-out infinite;
  }
  .animate-float-fast {
    animation: float-fast 4s ease-in-out infinite;
  }
  .animate-cloud-left {
    animation: cloud-move-left 8s ease-in-out infinite;
  }
  .animate-cloud-right {
    animation: cloud-move-right 10s ease-in-out infinite;
  }
  .animate-glow {
    animation: pulse-glow 3s ease-in-out infinite;
  }
  .animate-gear-clockwise {
    animation: rotate-gear 12s linear infinite;
    transform-origin: center;
  }
  .animate-gear-counter {
    animation: rotate-gear 16s linear infinite reverse;
    transform-origin: center;
  }
`;

export default function NotFound(): React.JSX.Element {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F8F9] px-4 py-12 dark:bg-slate-950">
      <style dangerouslySetInnerHTML={{ __html: animationsStyle }} />
      
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,82,204,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(82,67,170,0.08),transparent_40%)]" />

      <div className="relative z-10 w-full max-w-5xl rounded-3xl border border-white/60 bg-white/40 p-8 shadow-[0_32px_64px_-16px_rgba(9,30,66,0.12)] backdrop-blur-xl dark:border-slate-800/40 dark:bg-slate-900/40 lg:p-16 overflow-hidden">
        {/* Card Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none mix-blend-overlay">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="cardGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="currentColor" className="text-slate-900 dark:text-white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cardGrid)" />
          </svg>
        </div>

        {/* Ambient Glows Inside Card */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-2">
          
          {/* Left Column: Visual Illustration */}
          <div className="flex justify-center">
            <svg viewBox="0 0 500 400" className="w-full max-w-[420px] h-auto drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-10 dark:opacity-20" />
                </pattern>
                <linearGradient id="robotGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0052CC" />
                  <stop offset="100%" stopColor="#5243AA" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Floating Clouds */}
              <g className="animate-cloud-left text-blue-100/50 dark:text-slate-800/40">
                <path d="M 50 350 Q 80 320 120 330 Q 150 310 180 340 Q 200 370 170 380 L 60 380 Z" fill="currentColor" />
              </g>
              <g className="animate-cloud-right text-blue-100/40 dark:text-slate-800/30">
                <path d="M 360 120 Q 380 90 410 100 Q 430 80 450 110 Q 470 130 450 150 L 370 150 Z" fill="currentColor" />
              </g>

              {/* Rotating Gears in background */}
              <g transform="translate(100, 150)" className="animate-gear-clockwise text-slate-200 dark:text-slate-800">
                <circle r="25" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="6 4" />
                <circle r="15" fill="none" stroke="currentColor" strokeWidth="4" />
              </g>
              <g transform="translate(380, 220)" className="animate-gear-counter text-slate-200 dark:text-slate-800">
                <circle r="35" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="8 5" />
                <circle r="20" fill="none" stroke="currentColor" strokeWidth="6" />
              </g>

              {/* The Broken Bridge */}
              <g stroke="currentColor" strokeWidth="4" className="text-slate-300 dark:text-slate-700">
                {/* Left Roadway */}
                <path d="M 20 280 L 180 280" strokeLinecap="round" />
                <path d="M 20 288 L 170 288" strokeDasharray="5 5" />
                {/* Left Tower */}
                <path d="M 60 280 L 60 380" strokeWidth="6" />
                {/* Right Roadway */}
                <path d="M 320 280 L 480 280" strokeLinecap="round" />
                <path d="M 330 288 L 480 288" strokeDasharray="5 5" />
                {/* Right Tower */}
                <path d="M 440 280 L 440 380" strokeWidth="6" />
              </g>

              {/* Connection Cable Outline */}
              <path d="M 60 280 Q 250 380 440 280" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" className="text-slate-300 dark:text-slate-700" fill="none" />

              {/* Floating Warning Sign */}
              <g className="animate-float-fast" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                <path d="M 250 80 L 290 150 L 210 150 Z" fill="#FFAB00" stroke="#FF8B00" strokeWidth="2" strokeLinejoin="round" />
                <text x="250" y="135" fill="#172B4D" fontSize="32" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">!</text>
              </g>

              {/* Cute Floating Searcher Robot */}
              <g className="animate-float-slow" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                {/* Shadow */}
                <ellipse cx="250" cy="330" rx="35" ry="6" fill="black" className="opacity-10 dark:opacity-30" />
                
                {/* Jetpack Flames */}
                <path d="M 235 270 Q 235 295 240 290 Q 245 295 245 270 Z" fill="#FF5630" />
                <path d="M 255 270 Q 255 295 260 290 Q 265 295 265 270 Z" fill="#FF5630" />

                {/* Robot Body */}
                <rect x="225" y="200" width="50" height="60" rx="15" fill="url(#robotGrad)" />
                
                {/* Screen Face */}
                <rect x="232" y="210" width="36" height="24" rx="6" fill="#172B4D" />
                {/* Glowing Eyes */}
                <circle cx="242" cy="222" r="3" fill="#00E5FF" className="animate-glow" />
                <circle cx="258" cy="222" r="3" fill="#00E5FF" className="animate-glow" />
                {/* Blush */}
                <ellipse cx="237" cy="228" rx="2" ry="1" fill="#FF5630" />
                <ellipse cx="263" cy="228" rx="2" ry="1" fill="#FF5630" />

                {/* Antenna */}
                <line x1="250" y1="200" x2="250" y2="185" stroke="#0052CC" strokeWidth="3" />
                <circle cx="250" cy="182" r="4" fill="#FF5630" className="animate-pulse" />

                {/* Hands / Arms */}
                {/* Left Arm holding Magnifying Glass */}
                <path d="M 225 225 Q 200 230 195 245" stroke="#5243AA" strokeWidth="4" strokeLinecap="round" fill="none" />
                {/* Magnifying Glass */}
                <circle cx="188" cy="250" r="10" stroke="#FFAB00" strokeWidth="3" fill="rgba(0,229,255,0.2)" />
                <line x1="195" y1="257" x2="204" y2="266" stroke="#FFAB00" strokeWidth="3" strokeLinecap="round" />

                {/* Right Arm waving */}
                <path d="M 275 225 Q 295 215 305 200" stroke="#5243AA" strokeWidth="4" strokeLinecap="round" fill="none" />

                {/* Question Marks Floating */}
                <text x="195" y="180" fill="#0052CC" fontSize="24" fontWeight="bold" fontFamily="sans-serif" className="animate-bounce" style={{ animationDelay: '0.5s' }}>?</text>
                <text x="305" y="175" fill="#5243AA" fontSize="18" fontWeight="bold" fontFamily="sans-serif" className="animate-bounce" style={{ animationDelay: '1.2s' }}>?</text>
              </g>
            </svg>
          </div>

          {/* Right Column: Copy & Actions */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0052CC] ring-1 ring-inset ring-blue-700/10 dark:bg-blue-950/40 dark:text-[#85B8FF] dark:ring-blue-500/20">
              Error Code 404
            </span>
            
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[#172B4D] sm:text-5xl dark:text-white leading-[1.1]">
              Oops! Page not found
            </h1>
            
            <p className="mt-4 text-base leading-relaxed text-[#42526E] dark:text-slate-400 font-normal">
              We couldn't find the page you were looking for. It may have been moved, deleted, or the URL might be incorrect.
            </p>

            {/* Quick Helper List */}
            <div className="mt-8 border-t border-slate-200/60 pt-8 dark:border-slate-800/60">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B778C] dark:text-slate-500">
                Let's get you reconnected
              </h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href="/"
                  className="flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-[#0052CC] to-[#2684FF] px-6 text-sm font-semibold text-white shadow-md transition-all hover:shadow-[0_4px_20px_rgba(0,82,204,0.35)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/login"
                  className="flex h-11 items-center justify-center rounded-lg border border-[#DFE1E6] bg-white px-6 text-sm font-semibold text-[#172B4D] shadow-sm transition-all hover:bg-[#F4F5F7] hover:scale-[1.02] active:scale-[0.98] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Log in to Workspace
                </Link>
              </div>
            </div>

            {/* Footer Support Info */}
            <p className="mt-10 text-xs text-[#6B778C] dark:text-slate-500">
              Think this is a mistake?{' '}
              <a href="mailto:support@taskbridge.com" className="font-semibold text-[#0052CC] hover:underline dark:text-[#579DFF]">
                Let our team know
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
