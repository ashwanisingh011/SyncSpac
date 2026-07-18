"use client";

import { Zap, Book, CheckSquare, Bug } from 'lucide-react';
import clsx from 'clsx';

interface IssueTypeIconProps {
  type: string;
  className?: string;
}

export const IssueTypeIcon = ({ type, className }: IssueTypeIconProps): React.JSX.Element => {
  const normalizedType = type?.toLowerCase();
  switch (normalizedType) {
    case 'epic':
      return <div className={clsx("w-5 h-5 rounded-sm bg-purple-600 flex items-center justify-center", className)}><Zap className="w-3 h-3 text-white" /></div>;
    case 'story':
      return <div className={clsx("w-5 h-5 rounded-sm bg-green-500 flex items-center justify-center", className)}><Book className="w-3 h-3 text-white" /></div>;
    case 'bug':
      return <div className={clsx("w-5 h-5 rounded-sm bg-red-500 flex items-center justify-center", className)}><Bug className="w-3 h-3 text-white" /></div>;
    case 'subtask':
      return <div className={clsx("w-5 h-5 rounded-sm bg-indigo-500 flex items-center justify-center", className)}><CheckSquare className="w-3 h-3 text-white" /></div>;
    case 'improvement':
      return <div className={clsx("w-5 h-5 rounded-sm bg-teal-500 flex items-center justify-center", className)}><Zap className="w-3 h-3 text-white" /></div>;
    case 'task':
    default:
      return <div className={clsx("w-5 h-5 rounded-sm bg-blue-500 flex items-center justify-center", className)}><CheckSquare className="w-3 h-3 text-white" /></div>;
  }
};
