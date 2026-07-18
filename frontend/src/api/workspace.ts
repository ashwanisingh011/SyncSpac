import api from './axios';
import { uploadLogo } from './upload';
import type {
  Organization,
  OrganizationMembership,
  OrganizationSummary,
  OrgRole,
  WorkspaceRoleCapabilities,
  WorkspaceRoleOption,
  WorkspaceFormData,
  WorkspaceMember,
  InviteMemberFormData,
  BillingInfo,
  Plan,
  SubscriptionPlan,
  WorkspaceSettings,
} from '@/types/workspace';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert backend OrganizationMembership → OrganizationSummary for context */
const membershipToSummary = (m: OrganizationMembership): OrganizationSummary => ({
  id: m.organization._id,
  name: m.organization.name,
  slug: m.organization.slug,
  description: m.organization.description,
  logoUrl: m.organization.logoUrl ?? (m.organization as Organization & { logo?: string }).logo,
  plan: m.organization.plan ?? 'free',
  memberCount: m.memberCount ?? 0,
  myRole: m.role,
  myRoleName: m.roleName,
  myRoleDescription: m.roleDescription,
  capabilities: m.capabilities,
  permissions: m.permissions,
  subscriptionStatus: m.subscriptionStatus,
});

type RawMemberDoc = {
  _id: string;
  user:
    | string
    | { _id: string; name: string; email: string; username?: string; avatar?: string; avatarUrl?: string };
  organization: string;
  role: OrgRole;
  roleName?: string;
  roleDescription?: string;
  status: string;
  joinedAt?: string;
  createdAt: string;
};

/** Backend :memberId routes expect the User _id, not OrganizationMember _id. */
const resolveUserId = (user: RawMemberDoc['user']): string => {
  if (typeof user === 'object' && user !== null) {
    return String(user._id);
  }
  return String(user);
};

const resolveUserProfile = (
  user: RawMemberDoc['user'],
): { name: string; email: string; username?: string; avatarUrl?: string } => {
  if (typeof user === 'object' && user !== null) {
    return {
      name: user.name,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl ?? user.avatar,
    };
  }
  return { name: 'Unknown', email: '' };
};

const mapMemberStatus = (
  status: string,
): WorkspaceMember['status'] => {
  if (status === 'suspended') return 'inactive';
  if (status === 'pending' || status === 'active') return status;
  return 'inactive';
};

/** Convert backend OrganizationMember → WorkspaceMember for table */
const toWorkspaceMember = (m: RawMemberDoc): WorkspaceMember => {
  const profile = resolveUserProfile(m.user);
  return {
    id: String(m._id),
    userId: resolveUserId(m.user),
    workspaceId: String(m.organization),
    name: profile.name,
    email: profile.email,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    role: m.role,
    roleName: m.roleName,
    roleDescription: m.roleDescription,
    joinedAt: m.joinedAt ?? m.createdAt,
    status: mapMemberStatus(m.status),
  };
};

// ─── Organization ─────────────────────────────────────────────────────────────

/**
 * GET /api/organization/my-workspaces
 * Returns all orgs user is an active member of.
 */
export const getUserOrganizations = async (): Promise<OrganizationSummary[]> => {
  const { data } = await api.get('/organization/my-workspaces');
  const memberships: OrganizationMembership[] = data.data;
  return memberships
    .filter((m) => !m.organization.isDeleted)
    .map(membershipToSummary);
};

/**
 * POST /api/organization/
 * Create a new organization. Backend accepts { name }.
 */
export interface CreateOrganizationResult {
  organization: Organization;
  user?: { _id?: string; id?: string; name?: string; email?: string; role?: string };
}

export const createOrganization = async (
  formData: WorkspaceFormData,
): Promise<CreateOrganizationResult> => {
  const { data } = await api.post('/organization', { name: formData.name });
  const organization = data.data.organization as Organization;
  const user = data.data.user as CreateOrganizationResult['user'];

  let logoUrl: string | undefined = undefined;
  if (formData.logo && organization._id) {
    try {
      const uploadRes = await uploadLogo(formData.logo);
      if (uploadRes.success) {
        logoUrl = uploadRes.url;
      }
    } catch (uploadErr) {
      console.error('Failed to upload organization logo:', uploadErr);
    }
  }

  if (organization._id && (formData.timezone || logoUrl)) {
    try {
      await api.patch(`/organization/${organization._id}/settings`, {
        ...(formData.timezone ? { timezone: formData.timezone } : {}),
        ...(logoUrl ? { logoUrl } : {}),
      });
      if (logoUrl) {
        organization.logoUrl = logoUrl;
        (organization as { logo?: string }).logo = logoUrl;
      }
    } catch {
      // Non-blocking: org exists even if settings patch fails
    }
  }

  return { organization, user };
};

type WorkspaceSettingsResponse = {
  organization: Organization & { logo?: string };
  settings: Omit<WorkspaceSettings, 'name' | 'description' | 'logoUrl'>;
};

const mapWorkspaceSettingsResponse = (payload: WorkspaceSettingsResponse): WorkspaceSettings => ({
  name: payload.organization.name,
  description: payload.organization.description ?? '',
  logoUrl: payload.organization.logoUrl ?? payload.organization.logo ?? '',
  primaryColor: payload.settings.primaryColor,
  secondaryColor: payload.settings.secondaryColor,
  timezone: payload.settings.timezone,
  language: payload.settings.language,
  defaultLayout: payload.settings.defaultLayout ?? 'kanban',
});

/**
 * GET /api/organization/:orgId/settings
 */
export const getOrganizationSettings = async (
  orgId: string,
): Promise<WorkspaceSettings> => {
  const { data } = await api.get(`/organization/${orgId}/settings`);
  return mapWorkspaceSettingsResponse(data.data as WorkspaceSettingsResponse);
};

/**
 * PATCH /api/organization/:orgId/settings
 */
export const updateOrganizationSettings = async (
  orgId: string,
  payload: Partial<WorkspaceSettings>,
): Promise<WorkspaceSettings> => {
  const { data } = await api.patch(`/organization/${orgId}/settings`, payload);
  return mapWorkspaceSettingsResponse(data.data as WorkspaceSettingsResponse);
};

// ─── Members ──────────────────────────────────────────────────────────────────

/**
 * GET /api/organization/:orgId/members
 */
export const getWorkspaceMembers = async (
  orgId: string,
): Promise<WorkspaceMember[]> => {
  const { data } = await api.get(`/organization/${orgId}/members`);
  const list = data?.data;
  if (!Array.isArray(list)) return [];
  return list
    .filter((m: RawMemberDoc) => m && m.user)
    .map((m: RawMemberDoc) => toWorkspaceMember(m));
};

/** Member count via GET /organization/:orgId/members */
export const getOrganizationMemberCount = async (orgId: string): Promise<number> => {
  const members = await getWorkspaceMembers(orgId);
  return members.length;
};

/**
 * Fetch member count for one org only (avoids rate-limit bursts from N parallel calls).
 */
export const enrichOrganizationMemberCount = async (
  org: OrganizationSummary,
): Promise<OrganizationSummary> => {
  try {
    const memberCount = await getOrganizationMemberCount(org.id);
    return { ...org, memberCount };
  } catch {
    return org;
  }
};

/**
 * POST /api/organization/:orgId/invite
 * Sends invite email. Backend expects { email, role }.
 */
export const inviteMember = async (
  orgId: string,
  payload: InviteMemberFormData,
): Promise<{ message: string }> => {
  const { data } = await api.post(`/organization/${orgId}/invite`, payload);
  return data;
};

/**
 * PATCH /api/organization/:orgId/members/:memberId/role
 */
/**
 * @param userId - User document _id (backend queries OrganizationMember by user field)
 */
export const updateMemberRole = async (
  orgId: string,
  userId: string,
  role: OrgRole,
): Promise<WorkspaceMember> => {
  const { data } = await api.patch(
    `/organization/${orgId}/members/${userId}/role`,
    { role },
  );
  return toWorkspaceMember(data.data as RawMemberDoc);
};

export const getWorkspaceRoles = async (
  orgId: string,
): Promise<{
  roles: WorkspaceRoleOption[];
  currentUserCapabilities: WorkspaceRoleCapabilities;
  currentUserPermissions: string[];
}> => {
  const { data } = await api.get(`/organization/${orgId}/roles`);
  return data.data as {
    roles: WorkspaceRoleOption[];
    currentUserCapabilities: WorkspaceRoleCapabilities;
    currentUserPermissions: string[];
  };
};

/**
 * DELETE /api/organization/:orgId/members/:memberId
 * @param userId - User document _id
 */
export const removeMember = async (
  orgId: string,
  userId: string,
): Promise<void> => {
  await api.delete(`/organization/${orgId}/members/${userId}`);
};

// ─── Invite accept ────────────────────────────────────────────────────────────

export interface InviteValidationResult {
  valid: boolean;
  email: string | null;
  organizationName: string | null;
  role?: string;
  userExists: boolean;
  expired: boolean;
}

/**
 * GET /api/organization/invitation/:token/validate
 * Public — verifies invite token before login/register.
 */
export const validateInviteByToken = async (
  token: string,
): Promise<InviteValidationResult> => {
  const encoded = encodeURIComponent(token.trim());
  const { data } = await api.get(`/organization/invitation/${encoded}/validate`);
  return data.data as InviteValidationResult;
};

/**
 * POST /api/organization/accept-invite/:token
 * User clicks link from email → token passed here.
 */
export const acceptInviteByToken = async (
  token: string,
): Promise<{ message: string }> => {
  const encoded = encodeURIComponent(token.trim());
  const { data } = await api.post(`/organization/accept-invite/${encoded}`);
  return data;
};

// ─── Billing & Plan APIs ──────────────────────────────────────────────────────

export const getBillingInfo = async (orgId: string): Promise<BillingInfo> => {
  const { data } = await api.get(`/organization/${orgId}/billing`);
  return data.data;
};

export const changePlan = async (
  orgId: string,
  planCode: SubscriptionPlan,
): Promise<BillingInfo> => {
  const { data } = await api.post(`/organization/${orgId}/billing/change-plan`, { plan: planCode });
  return data.data;
};

export const checkoutPlan = async (
  orgId: string,
  payload: {
    planCode: string;
    billingCycle: 'monthly' | 'yearly';
    email: string;
    paymentMethod: 'razorpay';
    cardholderName: string;
    razorpayPaymentId: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
  }
): Promise<BillingInfo> => {
  const { data } = await api.post(`/organization/${orgId}/billing/checkout`, payload);
  return data.data;
};

export const createBillingOrder = async (
  orgId: string,
  payload: {
    planCode: string;
    billingCycle: 'monthly' | 'yearly';
    promoCode?: string;
  }
): Promise<{ orderId: string; amount: number }> => {
  const { data } = await api.post(`/organization/${orgId}/billing/create-order`, payload);
  return data;
};

export const getActivePlans = async (): Promise<Plan[]> => {
  const { data } = await api.get('/plans');
  return data.data.map((plan: any) => ({
    ...plan,
    id: plan.code.toLowerCase(),
  }));
};

export const getPlatformPlans = async (): Promise<Plan[]> => {
  const { data } = await api.get('/plans/admin');
  return data.data.map((plan: any) => ({
    ...plan,
    id: plan.code.toLowerCase(),
  }));
};

export const createPlan = async (planData: Partial<Plan>): Promise<Plan> => {
  const { data } = await api.post('/plans/admin', planData);
  return {
    ...data.data,
    id: data.data.code.toLowerCase(),
  };
};

export const updatePlan = async (code: string, planData: Partial<Plan>): Promise<Plan> => {
  const { data } = await api.put(`/plans/admin/${code}`, planData);
  return {
    ...data.data,
    id: data.data.code.toLowerCase(),
  };
};

export const deletePlan = async (code: string): Promise<void> => {
  await api.delete(`/plans/admin/${code}`);
};

/**
 * DELETE /api/organization/:orgId
 * Permanently deletes the organization and all its data.
 */
export const deleteOrganization = async (orgId: string): Promise<void> => {
  await api.delete(`/organization/${orgId}`);
};

// ─── Convenience aliases ──────────────────────────────────────────────────────
export const getWorkspace = async (orgId: string): Promise<Organization> => {
  // Backend has no GET /organization/:id endpoint yet
  throw new Error(`getWorkspace(${orgId}) — this API doesn't exist in backend yet.`);
};
export const createWorkspace = createOrganization;
export const updateWorkspaceSettings = updateOrganizationSettings;
