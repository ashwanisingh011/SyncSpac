import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { ISprintData } from '@/types/workspace';

interface CreateSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  defaultName: string;
}

export const CreateSprintModal = ({ isOpen, onClose, onSubmit, defaultName }: CreateSprintModalProps) => {
  const [name, setName] = useState(defaultName);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onSubmit(name);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">Create Sprint</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none dark:hover:text-white">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Sprint Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-slate-700 border border-slate-300 dark:text-slate-200 rounded hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={loading || !name.trim()} className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface StartSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (startDate: string, endDate: string) => Promise<void>;
  sprint: ISprintData | null;
}

export const StartSprintModal = ({ isOpen, onClose, onSubmit, sprint }: StartSprintModalProps) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const defaultEnd = new Date();
  defaultEnd.setDate(defaultEnd.getDate() + 14);
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !sprint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setLoading(true);
    await onSubmit(startDate, endDate);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">Start Sprint: {sprint.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none dark:hover:text-white">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-slate-700 border border-slate-300 dark:text-slate-200 rounded hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={loading || !startDate || !endDate} className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CompleteSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  sprint: ISprintData | null;
}

export const CompleteSprintModal = ({ isOpen, onClose, onSubmit, sprint }: CompleteSprintModalProps) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !sprint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">Complete Sprint: {sprint.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none dark:hover:text-white">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to complete this sprint? Any incomplete issues will be moved to the backlog.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-slate-700 border border-slate-300 dark:text-slate-200 rounded hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center justify-center min-w-[80px] px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
