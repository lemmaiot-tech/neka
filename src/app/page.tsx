
"use client";

import { HostingForm } from '@/components/hosting-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { UserNav } from '@/components/user-nav';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-between p-4 sm:p-6 md:p-8">
       <header className="w-full flex justify-between items-center p-4">
        <Link href="/">
          <h1 className="text-2xl font-headline font-bold">
            <span className="text-foreground">Neka</span><span className="text-accent">.ng</span>
          </h1>
        </Link>
        {!loading && (
          <>
            {user ? (
              <UserNav />
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </header>
      <div className="w-full max-w-2xl mt-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-headline font-bold tracking-tight">
            <span className="text-foreground">Neka</span><span className="text-accent">.ng</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg md:text-xl max-w-md mx-auto">
            Empowering Nigerian SMEs to Host Custom Projects
          </p>
        </div>
        <Card className="shadow-2xl rounded-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl md:text-3xl">Create Your Space</CardTitle>
            <CardDescription>Fill in the details below to request your new project space.</CardDescription>
          </CardHeader>
          <CardContent>
            <HostingForm />
          </CardContent>
        </Card>
      </div>
      <footer className="w-full text-center py-8 mt-auto">
        <p className="text-lg font-bold tracking-wider animate-pulse">
          <span role="img" aria-label="Nigerian flag">🇳🇬</span> Proudly Nigerian <span role="img" aria-label="Nigerian flag">🇳🇬</span>
        </p>
      </footer>
    </main>
  );
}
