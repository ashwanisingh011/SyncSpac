import ProfilePage from '@/app/(protected)/profile/page';

export default function DashboardProfilePage() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
      <ProfilePage />
    </div>
  );
}
