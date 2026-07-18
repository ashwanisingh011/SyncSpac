'use client';

import { useContext } from 'react';
import OrganizationContext from './organizationContextInstance';
import type { OrganizationContextValue } from './organizationContextInstance';

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
