"use client";

import SuperAdminRoute from '@/components/SuperAdminRoute';
import { SuperAdminProvider } from '@/context/superadminContext';
import SuperAdminLayoutShell from './components/SuperAdminLayoutShell';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps): React.JSX.Element {
  return (
    <SuperAdminRoute>
      <SuperAdminProvider>
        <SuperAdminLayoutShell>
          {children}
        </SuperAdminLayoutShell>
      </SuperAdminProvider>
    </SuperAdminRoute>
  );
}
