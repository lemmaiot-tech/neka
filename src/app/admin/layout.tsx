
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isAdmin } from '@/lib/admin';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { UserNav } from '@/components/user-nav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check if the user is an admin
        if (!isAdmin(currentUser.uid)) {
          // If not an admin, redirect to the user dashboard
          router.replace('/dashboard');
        } else {
          setLoading(false);
        }
      } else {
        // If no user is logged in, redirect to the login page
        router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col">
         <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
        </header>
        <main className="flex-1 p-4 md:p-8">
            <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  // If loading is false and user is an admin, render the layout
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
          <Link href="/admin/dashboard">
          <h1 className="text-xl font-headline font-bold">
              <span className="text-foreground">Admin</span><span className="text-accent">.ng</span>
          </h1>
          </Link>
          <UserNav />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
