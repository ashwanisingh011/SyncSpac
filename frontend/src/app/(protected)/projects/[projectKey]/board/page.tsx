'use client';

import { use } from 'react';
import BoardPageContent from './BoardPageContent';

interface BoardPageProps {
  params: Promise<{ projectKey: string }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const unwrappedParams = use(params);
  return <BoardPageContent projectKey={unwrappedParams.projectKey} />;
}
