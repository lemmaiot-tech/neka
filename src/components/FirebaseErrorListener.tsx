
'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * A client component that listens for Firestore permission errors and throws them
 * to be caught by the Next.js error overlay in development. This provides
 * rich, contextual error messages for debugging security rules.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (permissionError: FirestorePermissionError) => {
      // Throw the error to be caught by the Next.js error boundary
      setError(() => { throw permissionError; });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // This component doesn't render anything itself.
  return null;
}
