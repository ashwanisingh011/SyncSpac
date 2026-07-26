"use client";

import { Flag } from 'lucide-react';
import clsx from 'clsx';

interface PriorityIconProps {
  priority: string;
  className?: string;
}

export const PriorityIcon = ({ priority, className }: PriorityIconProps): React.JSX.Element => {
  const normalizedPriority = priority?.toLowerCase();
  
  switch (normalizedPriority) {
    case 'highest':
    case 'high':
      return <Flag className={clsx("w-3.5 h-3.5 text-danger fill-red-500", className)} />;
    case 'medium':
      return <Flag className={clsx("w-3.5 h-3.5 text-orange-500 fill-orange-500", className)} />;
    case 'low':
    case 'lowest':
      return <Flag className={clsx("w-3.5 h-3.5 text-green-500 fill-green-500", className)} />;
    case 'info':
    case 'optional':
      return <Flag className={clsx("w-3.5 h-3.5 text-primary fill-blue-500", className)} />;
    default:
      return <Flag className={clsx("w-3.5 h-3.5 text-content-tertiary fill-content-tertiary", className)} />;
  }
};
