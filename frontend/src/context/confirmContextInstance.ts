"use client";

import { createContext } from 'react';
import type { ConfirmContextValue } from './useConfirm';

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export default ConfirmContext;
