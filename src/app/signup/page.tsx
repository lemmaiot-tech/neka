import { SignupForm } from "@/components/signup-form";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 text-sm font-medium hover:underline">
        &larr; Back to Home
      </Link>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-headline font-bold">Create an Account</h1>
          <p className="text-muted-foreground mt-2">
            Get started by creating an account to host your project.
          </p>
        </div>
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
