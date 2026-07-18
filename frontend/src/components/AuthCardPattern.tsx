export default function AuthCardPattern(): React.JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0052CC] via-[#2684FF] to-[#36B37E]" />
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-[32px] border border-[#B3D4FF]/60 bg-[#E9F2FF]/50 rotate-12 dark:border-blue-900/40 dark:bg-blue-950/20" />
      <div className="absolute -left-10 bottom-8 h-28 w-28 rounded-[28px] border border-[#ABF5D1]/60 bg-[#E3FCEF]/40 -rotate-12 dark:border-emerald-900/40 dark:bg-emerald-950/20" />
      <div className="absolute right-8 top-10 grid w-24 grid-cols-3 gap-1.5 opacity-[0.18] dark:opacity-[0.12]">
        <div className="h-8 rounded bg-[#0052CC]" />
        <div className="h-12 rounded bg-[#6554C0]" />
        <div className="h-6 rounded bg-[#36B37E]" />
        <div className="h-10 rounded bg-[#2684FF]" />
        <div className="h-7 rounded bg-[#FFAB00]" />
        <div className="h-11 rounded bg-[#00B8D9]" />
      </div>
    </div>
  );
}
