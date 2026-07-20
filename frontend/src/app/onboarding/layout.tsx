import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import OnboardingLayoutClient from './OnboardingLayoutClient';

export default function OnboardingLayout({ children }: { children?: ReactNode }) {
  return <OnboardingLayoutClient>{children || <Outlet />}</OnboardingLayoutClient>;
}

