// ─── Roles ────────────────────────────────────────────────────────────────────

export type OrgRole = string;

/** Legacy alias kept for sidebar/billing pages */
export type WorkspaceRole = OrgRole;

export interface WorkspaceRoleCapabilities {
  canManageMembers: boolean;
  canManageWorkspace: boolean;
  canDeleteWorkspace: boolean;
  canCreateProject: boolean;
  canManageProjects: boolean;
  canManageBilling: boolean;
}

export interface WorkspaceRoleOption {
  code: string;
  name: string;
  description: string;
  isAssignable: boolean;
  isSystem: boolean;
  permissions: string[];
}

// ─── Organization ─────────────────────────────────────────────────────────────

export interface Organization {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  plan: SubscriptionPlan;
  owner: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrgSubscriptionStatus {
  orgId: string;
  orgName: string;
  planCode: string;
  planName: string;
  limits: {
    users: number;
    projects: number;
    storage: number;
    customRoles: boolean;
    analytics: boolean;
    prioritySupport: boolean;
  };
  usage: {
    users: number;
    projects: number;
    storageBytes: number;
    storageGB: number;
    customRoles: number;
  };
  exceeded: {
    users: boolean;
    projects: boolean;
    storage: boolean;
    customRoles: boolean;
  };
  anyExceeded: boolean;
}

/** Shape returned by GET /organization/my-workspaces (populated) */
export interface OrganizationMembership {
  _id: string;
  organization: Organization;
  user: string;
  role: OrgRole;
  roleName?: string;
  roleDescription?: string;
  capabilities?: WorkspaceRoleCapabilities;
  permissions?: string[];
  status: 'pending' | 'active' | 'suspended';
  joinedAt?: string;
  createdAt: string;
  memberCount?: number;
  subscriptionStatus?: OrgSubscriptionStatus;
}

/** Minimal shape used in OrganizationContext */
export interface OrganizationSummary {
  id: string;           // mapped from _id
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  plan: SubscriptionPlan;
  memberCount: number;
  myRole: OrgRole;
  myRoleName?: string;
  myRoleDescription?: string;
  capabilities?: WorkspaceRoleCapabilities;
  permissions?: string[];
  subscriptionStatus?: OrgSubscriptionStatus;
}


// ─── Onboarding ───────────────────────────────────────────────────────────────

export type OnboardingStep =
  | 'checking'
  | 'select'
  | 'no-org'
  | 'complete';

// ─── Workspace / Org form ─────────────────────────────────────────────────────

export interface WorkspaceFormData {
  name: string;
  slug?: string;
  description?: string;
  industry?: string;
  teamSize?: string;
  timezone?: string;
  logo?: File | null;
}

// ─── Members ──────────────────────────────────────────────────────────────────

/** Shape returned by GET /organization/:orgId/members (populated) */
export interface WorkspaceMember {
  id: string;           // mapped from _id
  userId: string;       // member.user._id
  workspaceId: string;  // member.organization
  name: string;         // member.user.name
  email: string;        // member.user.email
  username?: string;
  avatarUrl?: string;
  role: OrgRole;
  roleName?: string;
  roleDescription?: string;
  joinedAt: string;
  status: 'active' | 'pending' | 'inactive';
}

export interface InviteMemberFormData {
  email: string;
  role: OrgRole;
  /** Optional team to add the member to once backend supports team invites */
  teamId?: string;
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export type SubscriptionPlan = string;

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface Plan {
  id: SubscriptionPlan;
  code?: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  description: string;
  features: PlanFeature[];
  highlighted?: boolean;
  badge?: string;
  status?: 'active' | 'inactive';
  currency?: string;
  limits?: {
    users: number;
    projects: number;
    storage: number;
    apiCalls: number;
  };
}

export interface BillingInfo {
  plan: SubscriptionPlan;
  status: 'active' | 'trialing' | 'trial' | 'past_due' | 'canceled' | 'suspended';
  currentPeriodEnd: string;
  seats: number;
  usedSeats: number;
  cardLast4?: string;
  cardBrand?: string;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface WorkspaceSettings {
  name: string;
  description?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  timezone: string;
  language: string;
  defaultLayout: 'kanban' | 'list' | 'calendar' | 'timeline';
}
 
export type TaskType = 'task' | 'bug' | 'epic' | 'story' | 'subtask' | 'improvement';
export type TaskStatus = string;

export interface IChecklistItem {
  _id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ITaskData {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  type: TaskType;
  priority: 'low' | 'medium' | 'high';
  project: string; // project ID
  organization: string; // org ID
  taskKey: string; // e.g. "TASK-1"
  sequence: number;
  estimatedTime?: number;
  dueDate?: string;
  sprintId?: string | null;
  storyPoints?: number;
  watchers?: string[]; // User IDs
  labels?: string[] | Array<{ _id: string; name: string; color: string }>; // Label IDs or populated
  checklist?: IChecklistItem[];
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IProjectData {
  _id: string;
  name: string;
  key: string;
  description?: string;
  logo?: string;
  projectType: string;
  visibility: string;
  isArchived: boolean;
  status: 'active' | 'on-hold' | 'completed';
  organization: string;
  owner: string;
  taskCount: number;
  defaultLayout: 'kanban' | 'list' | 'calendar' | 'timeline';
  createdAt: string;
  updatedAt: string;
}

export interface ISprintData {
  _id: string;
  projectId: string;
  orgId: string;
  name: string;
  goal?: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  velocity?: number;
  totalPoints?: number;
  completedPoints?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
