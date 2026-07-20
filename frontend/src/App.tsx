import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';

// Layouts
import ProtectedLayout from '@/app/(protected)/layout';
import DashboardLayout from '@/app/(protected)/dashboard/layout';
import WorkspaceLayout from '@/app/(protected)/workspace/layout';
import ProjectLayout from '@/app/(protected)/projects/[projectKey]/layout';
import ClientDashboardLayout from '@/app/(protected)/client-dashboard/layout';
import OnboardingLayout from '@/app/onboarding/layout';

// Auth Pages
import LoginPage from '@/app/login/page';
import RegisterPage from '@/app/register/page';
import ForgotPasswordPage from '@/app/forgot-password/page';
import ResetPasswordPage from '@/app/reset-password/[token]/page';
import TwoFactorPage from '@/app/2fa/page';
import VerifyEmailPage from '@/app/verify-email/[token]/page';
import VerifyEmailPageSimple from '@/app/verify-email/page';
import VerifyEmailSentPage from '@/app/verify-email-sent/page';
import VerifyEmailChangePage from '@/app/verify-email-change/[token]/page';
import AcceptInvitePage from '@/app/accept-invite/[token]/page';

// Protected Pages
import OnboardingPage from '@/app/onboarding/page';
import OnboardingNoOrgPage from '@/app/onboarding/no-org/page';
import OnboardingSelectOrgPage from '@/app/onboarding/select-org/page';
import OnboardingCreateOrgPage from '@/app/onboarding/create-org/page';
import OnboardingJoinOrgPage from '@/app/onboarding/join-org/page';
import OnboardingInviteTeamPage from '@/app/onboarding/invite-team/page';
import SuperAdminDashboard from '@/app/superadmin/page';
import CheckoutPage from '@/app/(protected)/checkout/[planCode]/page';
import ProfilePage from '@/app/(protected)/profile/page';

// Dashboard views (Admin/Owner)
import DashboardPage from '@/app/(protected)/dashboard/page';
import AllTasksPage from '@/app/(protected)/dashboard/all-tasks/page';
import AnalyticsPage from '@/app/(protected)/dashboard/analytics/page';
import BillingPage from '@/app/(protected)/dashboard/billing/page';
import MembersPage from '@/app/(protected)/dashboard/members/page';
import ProjectFilesPage from '@/app/(protected)/dashboard/project-files/page';
import ProjectsPage from '@/app/(protected)/dashboard/projects/page';
import ProjectDetailPage from '@/app/(protected)/dashboard/projects/[projectKey]/page';
import OrgAdminIssuePage from '@/app/(protected)/dashboard/projects/[projectKey]/issues/[issueKey]/page';
import TeamsPage from '@/app/(protected)/dashboard/teams/page';
import DashboardTeamDetailPage from '@/app/(protected)/dashboard/teams/[teamId]/page';
import UserSettingsPage from '@/app/(protected)/dashboard/user-settings/page';
import WorkspaceSettingsPage from '@/app/(protected)/dashboard/workspace-settings/page';
import WorkspaceCreatePage from '@/app/(protected)/dashboard/workspace/create/page';

// Workspace views
import WorkspaceOverviewPage from '@/app/(protected)/workspace/page';
import WorkspaceBillingPage from '@/app/(protected)/workspace/billing/page';
import WorkspaceCreatePageOutside from '@/app/(protected)/workspace/create/page';
import WorkspaceDepartmentsPage from '@/app/(protected)/workspace/departments/page';
import WorkspaceMembersPage from '@/app/(protected)/workspace/members/page';
import WorkspaceSettingsPageOutside from '@/app/(protected)/workspace/settings/page';
import WorkspaceTeamsPage from '@/app/(protected)/workspace/teams/page';
import WorkspaceTeamDetailPage from '@/app/(protected)/workspace/teams/[teamId]/page';

// Projects views
import ProjectOverviewPage from '@/app/(protected)/projects/[projectKey]/page';
import ProjectBoardPage from '@/app/(protected)/projects/[projectKey]/board/page';
import ProjectBacklogPage from '@/app/(protected)/projects/[projectKey]/backlog/page';
import ProjectFilesPageOutside from '@/app/(protected)/projects/[projectKey]/files/page';
import ProjectRecurringPage from '@/app/(protected)/projects/[projectKey]/recurring/page';
import ProjectSettingsPage from '@/app/(protected)/projects/[projectKey]/settings/page';
import ProjectReportsPage from '@/app/(protected)/projects/[projectKey]/reports/page';
import ProjectIssuePage from '@/app/(protected)/projects/[projectKey]/issues/[issueKey]/page';

// Client Dashboard views
import ClientDashboardPage from '@/app/(protected)/client-dashboard/page';
import ClientDocumentsPage from '@/app/(protected)/client-dashboard/documents/page';
import ClientTasksPage from '@/app/(protected)/client-dashboard/tasks/page';
import ClientProfilePage from '@/app/(protected)/client-dashboard/profile/page';
import ClientSettingsPage from '@/app/(protected)/client-dashboard/settings/page';
import ClientContactUsPage from '@/app/(protected)/client-dashboard/contact-us/page';

// Helper Higher-Order Component to adapt react-router-dom useParams into Next.js async Promise params
function withParams(Component: React.ComponentType<any>) {
  return function WrappedComponent(props: any) {
    const params = useParams();
    const paramsPromise = Promise.resolve(params);
    return <Component {...props} params={paramsPromise} />;
  };
}

// Wrap all components that accept next.js page params as a Promise prop
const ProjectDetailPageWithParams = withParams(ProjectDetailPage);
const OrgAdminIssuePageWithParams = withParams(OrgAdminIssuePage);
const DashboardTeamDetailPageWithParams = withParams(DashboardTeamDetailPage);
const WorkspaceTeamDetailPageWithParams = withParams(WorkspaceTeamDetailPage);
const ProjectOverviewPageWithParams = withParams(ProjectOverviewPage);
const ProjectBoardPageWithParams = withParams(ProjectBoardPage);
const ProjectBacklogPageWithParams = withParams(ProjectBacklogPage);
const ProjectFilesPageOutsideWithParams = withParams(ProjectFilesPageOutside);
const ProjectRecurringPageWithParams = withParams(ProjectRecurringPage);
const ProjectSettingsPageWithParams = withParams(ProjectSettingsPage);
const ProjectReportsPageWithParams = withParams(ProjectReportsPage);
const ProjectIssuePageWithParams = withParams(ProjectIssuePage);

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
          Loading Application...
        </div>
      }
    >
      <Routes>
        {/* Root Redirect to Onboarding (which handles state-based routing) */}
        <Route path="/" element={<Navigate to="/onboarding" replace />} />
        <Route path="/org-dashboard" element={<Navigate to="/dashboard" replace />} />

        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/2fa" element={<TwoFactorPage />} />
        <Route path="/verify-email" element={<VerifyEmailPageSimple />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/verify-email-sent" element={<VerifyEmailSentPage />} />
        <Route path="/verify-email-change/:token" element={<VerifyEmailChangePage />} />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />

        {/* Onboarding flow (with OnboardingLayout wrapper) */}
        <Route element={<OnboardingLayout />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/onboarding/no-org" element={<OnboardingNoOrgPage />} />
          <Route path="/onboarding/select-org" element={<OnboardingSelectOrgPage />} />
          <Route path="/onboarding/create-org" element={<OnboardingCreateOrgPage />} />
          <Route path="/onboarding/join-org" element={<OnboardingJoinOrgPage />} />
          <Route path="/onboarding/invite-team" element={<OnboardingInviteTeamPage />} />
        </Route>

        {/* Global SuperAdmin Route */}
        <Route path="/superadmin" element={<SuperAdminDashboard />} />

        {/* Protected Core Layout routes */}
        <Route element={<ProtectedLayout />}>
          {/* User profile page */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* Checkout billing flow */}
          <Route path="/checkout/:planCode" element={<CheckoutPage />} />

          {/* Manager / Owner Dashboard flow */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/all-tasks" element={<AllTasksPage />} />
            <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
            <Route path="/dashboard/billing" element={<BillingPage />} />
            <Route path="/dashboard/members" element={<MembersPage />} />
            <Route path="/dashboard/project-files" element={<ProjectFilesPage />} />
            <Route path="/dashboard/projects" element={<ProjectsPage />} />
            <Route path="/dashboard/projects/:projectKey" element={<ProjectDetailPageWithParams />} />
            <Route path="/dashboard/projects/:projectKey/issues/:issueKey" element={<OrgAdminIssuePageWithParams />} />
            <Route path="/dashboard/teams" element={<TeamsPage />} />
            <Route path="/dashboard/teams/:teamId" element={<DashboardTeamDetailPageWithParams />} />
            <Route path="/dashboard/user-settings" element={<UserSettingsPage />} />
            <Route path="/dashboard/workspace-settings" element={<WorkspaceSettingsPage />} />
            <Route path="/dashboard/workspace/create" element={<WorkspaceCreatePage />} />
          </Route>

          {/* Client Dashboard flow */}
          <Route element={<ClientDashboardLayout />}>
            <Route path="/client-dashboard" element={<ClientDashboardPage />} />
            <Route path="/client-dashboard/documents" element={<ClientDocumentsPage />} />
            <Route path="/client-dashboard/tasks" element={<ClientTasksPage />} />
            <Route path="/client-dashboard/profile" element={<ClientProfilePage />} />
            <Route path="/client-dashboard/settings" element={<ClientSettingsPage />} />
            <Route path="/client-dashboard/contact-us" element={<ClientContactUsPage />} />
          </Route>

          {/* Workspace Settings / Admin pages */}
          <Route element={<WorkspaceLayout />}>
            <Route path="/workspace" element={<WorkspaceOverviewPage />} />
            <Route path="/workspace/billing" element={<WorkspaceBillingPage />} />
            <Route path="/workspace/create" element={<WorkspaceCreatePageOutside />} />
            <Route path="/workspace/departments" element={<WorkspaceDepartmentsPage />} />
            <Route path="/workspace/members" element={<WorkspaceMembersPage />} />
            <Route path="/workspace/settings" element={<WorkspaceSettingsPageOutside />} />
            <Route path="/workspace/teams" element={<WorkspaceTeamsPage />} />
            <Route path="/workspace/teams/:teamId" element={<WorkspaceTeamDetailPageWithParams />} />
          </Route>

          {/* Project Details / Backlog / Kanban Board views */}
          <Route element={<ProjectLayout />}>
            <Route path="/projects/:projectKey" element={<ProjectOverviewPageWithParams />} />
            <Route path="/projects/:projectKey/board" element={<ProjectBoardPageWithParams />} />
            <Route path="/projects/:projectKey/backlog" element={<ProjectBacklogPageWithParams />} />
            <Route path="/projects/:projectKey/files" element={<ProjectFilesPageOutsideWithParams />} />
            <Route path="/projects/:projectKey/recurring" element={<ProjectRecurringPageWithParams />} />
            <Route path="/projects/:projectKey/settings" element={<ProjectSettingsPageWithParams />} />
            <Route path="/projects/:projectKey/reports" element={<ProjectReportsPageWithParams />} />
            <Route path="/projects/:projectKey/issues/:issueKey" element={<ProjectIssuePageWithParams />} />
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    </Suspense>
  );
}
