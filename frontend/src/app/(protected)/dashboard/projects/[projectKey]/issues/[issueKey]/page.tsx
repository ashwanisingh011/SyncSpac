'use client';

/**
 * /dashboard/projects/[projectKey]/issues/[issueKey]
 * Issue detail page for org-admins.
 * Wraps IssuePageContent with ProjectDataProvider and a back link
 * that returns to the org-admin project view.
 */

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ProjectDataProvider } from '@/context/projectDataContext';
import { IssuePageContent } from '@/app/(protected)/projects/[projectKey]/issues/[issueKey]/page';

interface OrgIssuePageProps {
  params: Promise<{ projectKey: string; issueKey: string }>;
}

export default function OrgAdminIssuePage({ params }: OrgIssuePageProps) {
  const { projectKey, issueKey } = use(params);
  const router = useRouter();

  return (
    <ProjectDataProvider projectKey={projectKey}>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Back navigation bar */}
        <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={() => router.push(`/dashboard/projects/${projectKey}`)}
            className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Back to {projectKey}</span>
          </button>
          <span className="text-xs text-slate-400 dark:text-slate-500">/</span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{issueKey}</span>
        </div>

        {/* Issue page content — shares the same component used by member project pages */}
        <div className="flex-1 overflow-auto">
          <IssuePageContent projectKey={projectKey} issueKey={issueKey} />
        </div>
      </div>
    </ProjectDataProvider>
  );
}
