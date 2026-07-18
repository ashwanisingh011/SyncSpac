'use client';

import { useSuperAdmin } from '@/context/superadminContext';
import CreatePlanForm from '../components/CreatePlanForm';

export default function SuperAdminCreatePlanPage() {
  const { setActiveItem } = useSuperAdmin();

  return (
    <div className="animate-fadeIn">
      <CreatePlanForm onNavigate={setActiveItem} />
    </div>
  );
}
