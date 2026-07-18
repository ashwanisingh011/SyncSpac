export interface TimelinePhase {
  id: string;
  title: string;
  date: string;
  status: 'completed' | 'in-progress' | 'upcoming';
}

export interface DeliverableItem {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  fileCount: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  size: string;
  type: 'pdf' | 'doc';
}

export const TIMELINE_PHASES: TimelinePhase[] = [
  { id: '1', title: 'Requirement Gathering', date: '01 Jun 2026', status: 'completed' },
  { id: '2', title: 'UI/UX Design', date: '10 Jun 2026', status: 'completed' },
  { id: '3', title: 'Development Phase 1', date: '15 Jun 2026', status: 'completed' },
  { id: '4', title: 'Development Phase 2', date: '20 Jun 2026', status: 'in-progress' },
  { id: '5', title: 'Testing', date: '15 Jul 2026', status: 'upcoming' },
  { id: '6', title: 'Deployment', date: '30 Jul 2026', status: 'upcoming' },
];

export const DELIVERABLES: DeliverableItem[] = [
  { id: '1', title: 'UI/UX Design', status: 'completed', fileCount: 12 },
  { id: '2', title: 'Admin Panel', status: 'in-progress', fileCount: 8 },
  { id: '3', title: 'Customer Portal', status: 'in-progress', fileCount: 5 },
  { id: '4', title: 'Mobile App', status: 'upcoming', fileCount: 0 },
];

export const DOCUMENTS: DocumentItem[] = [
  { id: '1', title: 'Requirement Document', size: '2.4 MB', type: 'pdf' },
  { id: '2', title: 'SRS Document', size: '1.8 MB', type: 'pdf' },
  { id: '3', title: 'UI/UX Design', size: '5.2 MB', type: 'pdf' },
];

export const EXPECTED_DELIVERY_LABEL = '30 Jul 2026';
