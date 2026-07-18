'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { OrganizationProvider } from '@/context/OrganizationContext';
import { NotificationProvider } from '@/context/NotificationContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps): React.JSX.Element {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <OrganizationProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </OrganizationProvider>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
