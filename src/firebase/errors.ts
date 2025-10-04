
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

/**
 * A custom error class for Firestore permission errors.
 * It includes detailed context about the failed request, which is invaluable for debugging security rules.
 * This error, when thrown in development, will be caught by the Next.js error overlay
 * and display its contents, including the helpful JSON context.
 */
export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;
  
  constructor(context: SecurityRuleContext) {
    const jsonContext = JSON.stringify(
        {
            auth: {
                message: "User authentication details will be automatically injected here by the server environment when this error is processed. You do not need to provide them."
            },
            ...context
        }, 
        null, 
        2
    );

    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${jsonContext}`;
    
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to make the error message visible in the Next.js overlay
    this.stack = '';
  }
}
