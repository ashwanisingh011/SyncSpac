'use client';

import { use } from 'react';
import TeamDetailPageContent from './TeamDetailPageContent';

interface TeamDetailPageProps {
  params: Promise<{ teamId: string }>;
  onBack?: () => void;
}

export default function TeamDetailPage({ params, onBack }: TeamDetailPageProps) {
  const unwrappedParams = use(params);
  return <TeamDetailPageContent teamId={unwrappedParams.teamId} onBack={onBack} />;
}
