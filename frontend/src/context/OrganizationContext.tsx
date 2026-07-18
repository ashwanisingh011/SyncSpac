'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import OrganizationContext, {
  type OrganizationContextValue,
} from './organizationContextInstance';
import { useAuth } from '@/context/useAuth';
import {
  getUserOrganizations,
  enrichOrganizationMemberCount,
} from '@/api/workspace';
import type { OrganizationSummary } from '@/types/workspace';
import { ORG_STORAGE_KEYS } from '@/lib/orgSession';

const STORAGE_KEY = ORG_STORAGE_KEYS.currentOrgId;
const CACHE_KEY = ORG_STORAGE_KEYS.orgsCache;

/** Safe localStorage helpers — no-op during SSR */
const lsGet = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
};

const lsSet = (key: string, value: string) => {
  if (typeof window !== 'undefined') localStorage.setItem(key, value);
};

const lsRemove = (key: string) => {
  if (typeof window !== 'undefined') localStorage.removeItem(key);
};

/** Read the cached org list; returns [] on parse error or SSR */
const readCache = (): OrganizationSummary[] => {
  try {
    const raw = lsGet(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Resolve the active org from a list + savedId */
const resolveActive = (
  orgs: OrganizationSummary[],
  savedId: string | null,
): OrganizationSummary | null =>
  orgs.find((o) => o.id === savedId) ?? orgs[0] ?? null;

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isAuthReady } = useAuth();

  // ── Synchronous init from localStorage cache ─────────────────────────────────
  // This runs before the first render, so pages always have data on refresh.
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>(() =>
    typeof window !== 'undefined' ? readCache() : [],
  );

  const [currentOrg, setCurrentOrgState] = useState<OrganizationSummary | null>(() => {
    if (typeof window === 'undefined') return null;
    const cached = readCache();
    return resolveActive(cached, lsGet(STORAGE_KEY));
  });

  // isOrgReady starts true when cache has data — no spinner on refresh.
  const [isOrgReady, setIsOrgReady] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return readCache().length > 0;
  });

  // ── Background refresh from API ──────────────────────────────────────────────
  const refreshOrganizations = useCallback(async () => {
    try {
      let orgs = await getUserOrganizations();

      // Only fetch member count for the active org (one request, not N parallel)
      const savedId = lsGet(STORAGE_KEY);
      const activePreview = resolveActive(orgs, savedId);
      if (activePreview) {
        const enriched = await enrichOrganizationMemberCount(activePreview);
        orgs = orgs.map((o) => (o.id === enriched.id ? enriched : o));
      }

      lsSet(CACHE_KEY, JSON.stringify(orgs));

      setOrganizations(orgs);
      setCurrentOrgState((prev) => {
        const saved = lsGet(STORAGE_KEY) ?? prev?.id ?? null;
        const active = resolveActive(orgs, saved);
        if (active) lsSet(STORAGE_KEY, active.id);
        return active;
      });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        // Axios interceptor will redirect to /login.
        // Clear stale cache so re-login gets a fresh fetch.
        lsRemove(CACHE_KEY);
        lsRemove(STORAGE_KEY);
        return; // Don't set isOrgReady — interceptor handles navigation
      }
      // Network / 5xx: keep existing state (cache already shown, no flash).
    } finally {
      setIsOrgReady(true);
    }
  }, []);

  // ── React to auth user changes (login / logout) ───────────────────────────────
  // This runs whenever the authenticated user identity changes. This is the
  // KEY FIX for the refresh-then-login bug:
  //
  // Before this fix: the org effect only ran once on mount. If the page loaded
  // with no token (e.g. after a refresh on the login page), it set isOrgReady=true
  // with empty orgs and NEVER re-ran after login. So the onboarding router saw
  // orgs=[] and sent the user to /no-org even though they had orgs.
  //
  // Now: we depend on `authUser` (the actual user object from AuthContext).
  // When authUser becomes non-null (login), we reset isOrgReady to false and
  // fetch fresh orgs from the API. When authUser becomes null (logout), we
  // clear all org state immediately.
  useEffect(() => {
    if (!isAuthReady) return; // Wait for AuthContext to read localStorage

    if (authUser) {
      // User just logged in (or page loaded while already logged in).
      // Reset ready state so consumers know fresh data is loading.
      setIsOrgReady(false);
      refreshOrganizations();
    } else {
      // User logged out — clear all org state
      setOrganizations([]);
      setCurrentOrgState(null);
      setIsOrgReady(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id ?? authUser, isAuthReady, refreshOrganizations]);

  // ── Setters ──────────────────────────────────────────────────────────────────

  const setCurrentOrg = useCallback((org: OrganizationSummary) => {
    setCurrentOrgState(org);
    lsSet(STORAGE_KEY, org.id);
    if (org.memberCount === 0) {
      enrichOrganizationMemberCount(org).then((enriched) => {
        setOrganizations((prev) => {
          const next = prev.map((o) => (o.id === enriched.id ? enriched : o));
          lsSet(CACHE_KEY, JSON.stringify(next));
          return next;
        });
        setCurrentOrgState((prev) =>
          prev?.id === enriched.id ? enriched : prev,
        );
      }).catch(() => {});
    }
  }, []);

  const addOrganization = useCallback((org: OrganizationSummary) => {
    setOrganizations((prev) => {
      const next = prev.some((o) => o.id === org.id) ? prev : [...prev, org];
      lsSet(CACHE_KEY, JSON.stringify(next));
      return next;
    });
    setCurrentOrgState(org);
    lsSet(STORAGE_KEY, org.id);
  }, []);

  const setOrganizationMemberCount = useCallback((orgId: string, count: number) => {
    setOrganizations((prev) => {
      const next = prev.map((o) =>
        o.id === orgId ? { ...o, memberCount: count } : o,
      );
      lsSet(CACHE_KEY, JSON.stringify(next));
      return next;
    });
    setCurrentOrgState((prev) =>
      prev && prev.id === orgId ? { ...prev, memberCount: count } : prev,
    );
  }, []);

  const value: OrganizationContextValue = {
    currentOrg,
    organizations,
    isOrgReady,
    setCurrentOrg,
    addOrganization,
    refreshOrganizations,
    setOrganizationMemberCount,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
