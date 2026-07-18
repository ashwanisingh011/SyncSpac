import type { ReactNode } from 'react';
import OnboardingLayoutClient from './OnboardingLayoutClient';

export const metadata = {
  title: 'Get started – TaskBridge',
  description: 'Set up your organization to start using TaskBridge.',
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <OnboardingLayoutClient>{children}</OnboardingLayoutClient>;
}
