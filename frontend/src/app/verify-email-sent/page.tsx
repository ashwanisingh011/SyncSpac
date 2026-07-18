"use client";

import { Suspense } from 'react';
import VerifyEmailSentContent from './Content';

const VerifyEmailSentPage = () => {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyEmailSentContent />
    </Suspense>
  );
};

export default VerifyEmailSentPage;
