'use client';

import { use } from 'react';
import BacklogPageContent from './BacklogPageContent';

interface BacklogPageProps {
  params: Promise<{ projectKey: string }>;
}

export default function BacklogPage({ params }: BacklogPageProps) {
  const unwrappedParams = use(params);
  return <BacklogPageContent projectKey={unwrappedParams.projectKey} />;
}
