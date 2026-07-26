'use client';

import { AlertTriangle, X } from 'lucide-react';
import { ACCESS_RESTRICTED_MESSAGE, ACCESS_RESTRICTED_TITLE } from '@/lib/accessErrors';

interface AccessRestrictedModalProps {
 isOpen: boolean;
 onClose: () => void;
 title?: string;
 message?: string;
}

export default function AccessRestrictedModal({
 isOpen,
 onClose,
 title = ACCESS_RESTRICTED_TITLE,
 message = ACCESS_RESTRICTED_MESSAGE,
}: AccessRestrictedModalProps) {
 if (!isOpen) return null;
 return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div
 role="alertdialog" aria-modal="true" aria-labelledby="access-restricted-title" aria-describedby="access-restricted-message" className="relative w-full max-w-md rounded-xl border border-warning/25 bg-surface p-6 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>

        <button
 type="button" onClick={onClose}
 className="absolute right-4 top-4 rounded-lg p-1.5 text-content-tertiary transition-colors hover:bg-surface-hover hover:text-content" aria-label="Close access restricted dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id="access-restricted-title" className="mt-4 text-lg font-bold text-content">
          {title}
        </h2>
        <p id="access-restricted-message" className="mt-2 text-sm leading-6 text-content-secondary">
          {message}
        </p>

        <button
 type="button" onClick={onClose}
 className="mt-6 inline-flex h-10 min-w-24 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-content transition-colors hover:bg-primary-hover"
        >
 OK
        </button>
      </div>
    </div>
  );
}
