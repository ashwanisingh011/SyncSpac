'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { Task } from '@/types/tasks';
import TaskDetailsDialog from './TaskDetailsDialog';

interface ClientCalendarViewProps {
  tasks: Task[];
  orgId: string;
  projectId: string;
  onRefresh: () => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ClientCalendarView({
  tasks,
  orgId,
  projectId,
  onRefresh,
}: ClientCalendarViewProps): React.JSX.Element {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar grid cells (including padding from prev/next months)
  const calendarCells = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const daysInCurrMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const cells = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      cells.push({ date, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      cells.push({ date, isCurrentMonth: true });
    }

    // Next month padding (pad to fill whole grid rows - e.g., 42 cells)
    const totalCellsNeeded = cells.length > 35 ? 42 : 35;
    const nextMonthDays = totalCellsNeeded - cells.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(currentYear, currentMonth + 1, i);
      cells.push({ date, isCurrentMonth: false });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Tasks grouped by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
        if (!map[key]) {
          map[key] = [];
        }
        map[key].push(task);
      }
    });
    return map;
  }, [tasks]);

  // Upcoming deadlines list
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return tasks
      .filter((t) => t.dueDate && new Date(t.dueDate) >= now && t.status !== 'done')
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
  }, [tasks]);

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100/60';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/60';
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/60';
      default:
        return 'bg-slate-50 text-slate-650 border-slate-100 hover:bg-slate-100/60';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
      {/* Calendar Grid - takes 3 columns */}
      <div className="xl:col-span-3 bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToday}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-lg border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {day}
            </div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map(({ date, isCurrentMonth }, idx) => {
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
              2,
              '0'
            )}-${String(date.getDate()).padStart(2, '0')}`;
            const dayTasks = tasksByDate[dateKey] || [];
            const cellIsToday = isToday(date);

            return (
              <div
                key={idx}
                className={`min-h-[90px] border border-slate-100 p-1.5 rounded-lg flex flex-col justify-between transition-all ${
                  isCurrentMonth ? 'bg-white' : 'bg-slate-50/40 text-slate-400'
                } ${cellIsToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
              >
                {/* Date number */}
                <span
                  className={`self-end text-xs font-bold ${
                    cellIsToday
                      ? 'bg-blue-600 text-white rounded-full h-5 w-5 flex items-center justify-center shrink-0'
                      : 'text-slate-800'
                  }`}
                >
                  {date.getDate()}
                </span>

                {/* Day Tasks List */}
                <div className="mt-1.5 flex-1 flex flex-col gap-1 overflow-y-auto max-h-[60px] scrollbar-thin">
                  {/* For Desktop/Tablet (md and up): show full task badges */}
                  <div className="hidden md:flex flex-col gap-1 w-full">
                    {dayTasks.map((task) => (
                      <button
                        key={task._id}
                        type="button"
                        onClick={() => setSelectedTaskId(task._id)}
                        className={`w-full border rounded text-[9px] font-bold px-1.5 py-0.5 truncate text-left transition-all shrink-0 ${getPriorityColor(
                          task.priority
                        )} ${task.status === 'done' ? 'line-through opacity-60' : ''}`}
                        title={task.title}
                      >
                        {task.taskKey}: {task.title}
                      </button>
                    ))}
                  </div>
                  {/* For Mobile (under md): show simple dots */}
                  <div className="flex md:hidden flex-wrap gap-1 items-center justify-center w-full">
                    {dayTasks.map((task) => {
                      let dotColor = 'bg-slate-400';
                      if (task.priority?.toLowerCase() === 'high') dotColor = 'bg-red-500';
                      else if (task.priority?.toLowerCase() === 'medium') dotColor = 'bg-amber-500';
                      else if (task.priority?.toLowerCase() === 'low') dotColor = 'bg-blue-500';
                      return (
                        <button
                          key={task._id}
                          type="button"
                          onClick={() => setSelectedTaskId(task._id)}
                          className={`w-2 h-2 rounded-full ${dotColor} ${task.status === 'done' ? 'opacity-40' : ''}`}
                          title={`${task.taskKey}: ${task.title}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar - takes 1 column */}
      <div className="space-y-4">
        {/* Deadlines List */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Upcoming Deadlines
          </h3>

          {upcomingDeadlines.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No upcoming deadlines.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingDeadlines.map((task) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                return (
                  <li
                    key={task._id}
                    className="flex flex-col gap-1 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedTaskId(task._id)}
                      className="text-left text-xs font-semibold text-slate-800 hover:text-blue-600 hover:underline truncate"
                    >
                      {task.taskKey}: {task.title}
                    </button>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(task.dueDate!).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                      {isOverdue && (
                        <span className="flex items-center gap-0.5 font-bold text-red-600">
                          <AlertCircle className="h-3 w-3" /> Overdue
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Task Details Dialog popup */}
      {selectedTaskId && (
        <TaskDetailsDialog
          taskId={selectedTaskId}
          isOpen={true}
          onClose={() => {
            setSelectedTaskId(null);
            onRefresh();
          }}
          onTaskUpdated={onRefresh}
          orgId={orgId}
        />
      )}
    </div>
  );
}
