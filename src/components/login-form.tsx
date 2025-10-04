
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";


const LoginSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignIn = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Signed in successfully!",
        description: "Redirecting you to your dashboard...",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error signing in: ", error);
      let description = "There was a problem signing you in. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Invalid email or password. Please check your credentials and try again.";
      }
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = form.getValues("email");
    if (!email) {
      form.trigger("email");
      toast({
        variant: "destructive",
        title: "Email is required",
        description: "Please enter your email address to reset your password.",
      });
      return;
    }
    
    // Validate email format
    const emailValidation = z.string().email().safeParse(email);
    if (!emailValidation.success) {
      form.trigger("email");
       toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsLoading(true);
    try {
        await sendPasswordResetEmail(auth, email);
        toast({
            title: "Password Reset Email Sent",
            description: "Please check your inbox (and spam folder) for a link to reset your password.",
        });
    } catch (error: any) {
        console.error("Password reset error:", error);
         let description = "We couldn't send a reset link. Please try again.";
        if (error.code === 'auth/user-not-found') {
            description = "No account found with this email address."
        }
        toast({
            variant: "destructive",
            title: "Password Reset Failed",
            description: description,
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  return (
    <div className="space-y-4">
      <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-4">
              <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                      <Input placeholder="ada@example.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                  <FormItem>
                     <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-xs"
                            onClick={handlePasswordReset}
                            disabled={isLoading}
                        >
                            Forgot password?
                        </Button>
                      </div>
                      <div className="relative">
                        <FormControl>
                            <Input 
                                type={showPassword ? 'text' : 'password'} 
                                placeholder="••••••••" 
                                {...field} 
                                disabled={isLoading} 
                                className="pr-10"
                            />
                        </FormControl>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                        >
                           {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                           <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                        </Button>
                      </div>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
              >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
              </Button>
          </form>
      </Form>
       <p className="px-8 text-center text-sm text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <a
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
          >
              Terms of Service
          </a>{" "}
          and{" "}
          <a
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
          >
              Privacy Policy
          </a>
          .
      </p>
    </div>
  );
}
