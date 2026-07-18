import { createContext } from 'react';
import type { OrganizationSummary } from '@/types/workspace';

export interface OrganizationContextValue {
  /** The currently active organization (null until chosen). */
  currentOrg: OrganizationSummary | null;
  /** All orgs the user belongs to. */
  organizations: OrganizationSummary[];
  /** Whether the initial org check is still running. */
  isOrgReady: boolean;
  /** Switch the active org (also persists to localStorage). */
  setCurrentOrg: (org: OrganizationSummary) => void;
  /** Called after creating/joining a new org. */
  addOrganization: (org: OrganizationSummary) => void;
  /** Reload org list from API. */
  refreshOrganizations: () => Promise<void>;
  /** Update cached member count for one org (e.g. after invite/remove). */
  setOrganizationMemberCount: (orgId: string, count: number) => void;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export default OrganizationContext;
