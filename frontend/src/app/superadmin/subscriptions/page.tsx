'use client';

import { useSuperAdmin } from '@/context/superadminContext';
import PlansListView from '../components/PlansListView';

export default function SuperAdminSubscriptionsPage() {
  const { setActiveItem } = useSuperAdmin();

  return (
    <div className="animate-fadeIn">
      <PlansListView onNavigate={setActiveItem} />
    </div>
  );
}
