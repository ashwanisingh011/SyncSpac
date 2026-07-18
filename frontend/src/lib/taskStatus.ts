export const DEFAULT_TASK_STATUS_ORDER = ['todo', 'in-progress', 'done'] as const;
export const COMPLETED_TASK_STATUS = 'done';
export const PROJECT_STATUS_CHANGED_EVENT = 'taskbridge:project-statuses-changed';

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  'in-progress': 'In Process',
  review: 'Review',
  testing: 'Testing',
  qa: 'QA',
  deployment: 'Deployment',
  blocked: 'Blocked',
  done: 'Done',
};

const STATUS_COLORS = [
  'border-amber-500 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20',
  'border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20',
  'border-violet-500 text-violet-600 bg-violet-50/50 dark:bg-violet-950/20',
  'border-cyan-500 text-cyan-600 bg-cyan-50/50 dark:bg-cyan-950/20',
  'border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20',
  'border-rose-500 text-rose-600 bg-rose-50/50 dark:bg-rose-950/20',
  'border-slate-500 text-slate-600 bg-slate-50/80 dark:bg-slate-900/60',
];

type TaskLike = {
  status?: string | null;
};

export interface TaskStatusCount {
  status: string;
  label: string;
  count: number;
  color: string;
}

export function formatTaskStatusLabel(status: string): string {
  if (STATUS_LABELS[status]) return STATUS_LABELS[status];

  return status
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function isCompletedTaskStatus(status?: string | null): boolean {
  return status === COMPLETED_TASK_STATUS;
}

export function slugifyTaskStatus(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getProjectStatusStorageKey(projectKey: string): string {
  return `board_visible_statuses_${projectKey}`;
}

export function normalizeTaskStatusOrder(statuses: readonly string[] = DEFAULT_TASK_STATUS_ORDER): string[] {
  const uniqueStatuses = Array.from(
    new Set(
      statuses
        .map((status) => status.trim())
        .filter((status) => status && status !== 'backlog')
    )
  );
  const customStatuses = uniqueStatuses.filter(
    (status) => !(DEFAULT_TASK_STATUS_ORDER as readonly string[]).includes(status)
  );

  return ['todo', 'in-progress', ...customStatuses, COMPLETED_TASK_STATUS];
}

export function loadProjectStatusOrder(projectKey?: string | null): string[] {
  if (!projectKey || typeof window === 'undefined') {
    return [...DEFAULT_TASK_STATUS_ORDER];
  }

  try {
    const stored = window.localStorage.getItem(getProjectStatusStorageKey(projectKey));
    if (!stored) return [...DEFAULT_TASK_STATUS_ORDER];

    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.every((status) => typeof status === 'string')) {
      return normalizeTaskStatusOrder([...DEFAULT_TASK_STATUS_ORDER, ...parsed]);
    }
  } catch {
    // Ignore corrupt or unavailable localStorage data.
  }

  return [...DEFAULT_TASK_STATUS_ORDER];
}

export function saveProjectStatusOrder(projectKey: string, statuses: readonly string[]): string[] {
  const normalizedStatuses = normalizeTaskStatusOrder(statuses);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        getProjectStatusStorageKey(projectKey),
        JSON.stringify(normalizedStatuses)
      );
      window.dispatchEvent(
        new CustomEvent(PROJECT_STATUS_CHANGED_EVENT, {
          detail: { projectKey, statuses: normalizedStatuses },
        })
      );
    } catch {
      // Ignore storage errors (for example, private browsing quota).
    }
  }

  return normalizedStatuses;
}

export function getProjectTaskStatusOptions(
  projectKey?: string | null,
  tasks: TaskLike[] = [],
  includeBacklog = false
): TaskStatusCount[] {
  const statuses = getTaskStatusOrder(tasks, loadProjectStatusOrder(projectKey));
  const options = statuses.map((status, index) => ({
    status,
    label: formatTaskStatusLabel(status),
    count: 0,
    color: STATUS_COLORS[index % STATUS_COLORS.length],
  }));

  if (!includeBacklog) return options;

  return [
    {
      status: 'backlog',
      label: formatTaskStatusLabel('backlog'),
      count: 0,
      color: STATUS_COLORS[STATUS_COLORS.length - 1],
    },
    ...options,
  ];
}

export function getTaskStatusOrder(tasks: TaskLike[], defaults: readonly string[] = DEFAULT_TASK_STATUS_ORDER): string[] {
  const ordered = new Set(normalizeTaskStatusOrder(defaults));
  tasks.forEach((task) => {
    if (task.status && task.status !== 'backlog') ordered.add(task.status);
  });

  return normalizeTaskStatusOrder(Array.from(ordered));
}

export function getTaskStatusCounts(tasks: TaskLike[], defaults: readonly string[] = DEFAULT_TASK_STATUS_ORDER): TaskStatusCount[] {
  const counts = new Map<string, number>();
  getTaskStatusOrder(tasks, defaults).forEach((status) => counts.set(status, 0));

  tasks.forEach((task) => {
    if (!task.status || task.status === 'backlog') return;
    counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
  });

  return Array.from(counts.entries()).map(([status, count], index) => ({
    status,
    label: formatTaskStatusLabel(status),
    count,
    color: STATUS_COLORS[index % STATUS_COLORS.length],
  }));
}

export function getCompletedTaskCount(tasks: TaskLike[]): number {
  return tasks.filter((task) => isCompletedTaskStatus(task.status)).length;
}
