import { LoginForm } from "@/components/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
       <Link href="/" className="absolute top-8 left-8 text-sm font-medium hover:underline">
          &larr; Back to Home
        </Link>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-headline font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to track your project and manage your account.
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
