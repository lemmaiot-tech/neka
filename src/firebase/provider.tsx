
'use client';

import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import React from 'react';

/**
 * Wraps the application and includes the FirebaseErrorListener.
 * This ensures that Firestore permission errors are caught and displayed
 * in the Next.js error overlay during development.
 */
export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FirebaseErrorListener />
    </>
  );
}
