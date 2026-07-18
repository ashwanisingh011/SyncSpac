export default function AtlassianBackground(): React.JSX.Element {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(76,154,255,0.22),transparent_34%),linear-gradient(180deg,#F7F8F9_0%,#EFF4FF_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,139,253,0.16),transparent_34%),linear-gradient(180deg,#020617_0%,#0F172A_100%)]">
      <div className="absolute -left-20 bottom-[-120px] h-[420px] w-[420px] rounded-[64px] bg-[#0052CC]/10 rotate-12 dark:bg-[#1D7AFC]/10" />
      <div className="absolute -right-24 top-20 h-[360px] w-[360px] rounded-[72px] bg-[#36B37E]/12 -rotate-12 dark:bg-[#36B37E]/10" />
      <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-white/85 to-transparent dark:from-slate-950/85" />
      <div className="absolute left-[8%] top-[18%] hidden w-64 rounded-lg border border-white/70 bg-white/70 p-3 shadow-[0_16px_44px_rgba(9,30,66,0.16)] backdrop-blur md:block dark:border-slate-700/60 dark:bg-slate-900/60">
        <div className="mb-3 h-2 w-20 rounded bg-[#0052CC]" />
        <div className="space-y-2">
          <div className="h-8 rounded bg-[#F4F5F7] dark:bg-slate-800" />
          <div className="h-8 rounded bg-[#F4F5F7] dark:bg-slate-800" />
          <div className="h-8 rounded bg-[#E9F2FF] dark:bg-blue-950/50" />
        </div>
      </div>
      <div className="absolute right-[7%] bottom-[16%] hidden w-72 rounded-lg border border-white/70 bg-white/70 p-3 shadow-[0_16px_44px_rgba(9,30,66,0.16)] backdrop-blur lg:block dark:border-slate-700/60 dark:bg-slate-900/60">
        <div className="grid grid-cols-3 gap-2">
          <div className="h-24 rounded bg-[#F4F5F7] dark:bg-slate-800" />
          <div className="h-24 rounded bg-[#E9F2FF] dark:bg-blue-950/50" />
          <div className="h-24 rounded bg-[#E3FCEF] dark:bg-emerald-950/40" />
        </div>
      </div>
    </div>
  );
}
