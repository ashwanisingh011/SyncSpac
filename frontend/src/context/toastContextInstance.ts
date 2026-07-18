"use client";

import { createContext } from 'react';
import type { ToastContextValue } from './useToast';

const ToastContext = createContext<ToastContextValue | null>(null);

export default ToastContext;
