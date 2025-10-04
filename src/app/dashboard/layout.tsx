import Link from "next/link";
import { UserNav } from "@/components/user-nav";

export default function DashboardLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
                <Link href="/dashboard">
                <h1 className="text-xl font-headline font-bold">
                    <span className="text-foreground">Neka</span><span className="text-accent">.ng</span>
                </h1>
                </Link>
                <UserNav />
            </header>
            <main className="flex-1">{children}</main>
        </div>
    )
  }
  