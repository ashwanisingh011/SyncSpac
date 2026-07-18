'use client';

import { useSuperAdmin } from '@/context/superadminContext';
import WelcomeBanner from './components/WelcomeBanner';
import StatCards from './components/StatCards';
import UserGrowthChart from './components/RevenueChart';
import SubscriptionChart from './components/SubscriptionChart';
import TopOrgsTable from './components/TopOrgsTable';
import PlatformHealth from './components/PlatformHealth';
import ActivityFeed from './components/ActivityFeed';
import QuickActions from './components/QuickActions';
import AiUsageChart from './components/AiUsageChart';

export default function SuperAdminDashboardPage() {
  const { stats, auditLogs, loading, loadStats, setActiveItem } = useSuperAdmin();

  return (
    <>
      <WelcomeBanner stats={stats} loading={loading} onRefresh={loadStats} />
      <StatCards stats={stats} loading={loading && !stats} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <UserGrowthChart />
        </div>
        <SubscriptionChart stats={stats} />
      </div>
      <TopOrgsTable onNavigateToOrgs={() => setActiveItem('organizations')} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PlatformHealth />
        <ActivityFeed logs={auditLogs} onNavigateToActivity={() => setActiveItem('activity')} />
        <QuickActions setActiveItem={setActiveItem} onRefreshStats={loadStats} />
      </div>
      <AiUsageChart />
    </>
  );
}
