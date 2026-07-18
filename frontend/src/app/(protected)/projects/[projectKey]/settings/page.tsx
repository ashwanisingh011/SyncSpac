'use client';

import { use } from 'react';
import ProjectSettingsPageContent from './ProjectSettingsPageContent';

interface ProjectSettingsPageProps {
  params: Promise<{ projectKey: string }>;
}

export default function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const unwrappedParams = use(params);
  return <ProjectSettingsPageContent projectKey={unwrappedParams.projectKey} />;
}
