"use client";

import { useContext } from 'react';
import ConfirmContext from './confirmContextInstance';
import type { ConfirmVariant } from '@/components/ConfirmDialog';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
};

export type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

export const useConfirm = (): ConfirmContextValue => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
};
