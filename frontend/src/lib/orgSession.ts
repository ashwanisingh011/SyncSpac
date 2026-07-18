/** Keys used by OrganizationContext for persistence */
export const ORG_STORAGE_KEYS = {
  currentOrgId: 'currentOrgId',
  orgsCache: 'orgsCache',
} as const;

/** Clear organization selection and cache (e.g. on logout). */
export function clearOrganizationSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ORG_STORAGE_KEYS.currentOrgId);
  localStorage.removeItem(ORG_STORAGE_KEYS.orgsCache);
}
