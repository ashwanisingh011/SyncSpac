import type { Metadata } from 'next';
import ForgotPasswordForm from './ForgotPasswordForm';
import PublicRoute from '@/components/PublicRoute';

export const metadata: Metadata = {
  title: 'Recover Password | TaskBridge',
  description:
    'Recover your TaskBridge account password. Enter your email and we will send you a secure password reset link.',
  openGraph: {
    title: 'Recover Password | TaskBridge',
    description:
      'Enter your email address to reset your TaskBridge password and regain access to your workspace.',
  },
};

export default function ForgotPasswordPage(): React.JSX.Element {
  return (
    <PublicRoute>
      <ForgotPasswordForm />
    </PublicRoute>
  );
}
