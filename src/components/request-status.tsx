
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ServiceRequestRecord } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function formatTimestamp(timestamp: Timestamp | undefined) {
  if (!timestamp) return "N/A";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function RequestStatus() {
  const [requests, setRequests] = useState<ServiceRequestRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user);
      if (user) {
        try {
          const requestsRef = collection(db, "serviceRequests");
          const q = query(requestsRef, where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            setRequests([]);
          } else {
            const requestsData = querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            })) as ServiceRequestRecord[];
            // Sort client-side
            requestsData.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
            setRequests(requestsData);
          }
        } catch (err: any) {
          console.error("Error fetching requests:", err);
          if (err.code === 'failed-precondition') {
             setError("The database query failed. This is likely because a composite index is required. Please create the index in your Firebase console and then refresh the page.");
          } else {
            setError("Failed to fetch your request information.");
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Not logged in
        setLoading(false);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const getStatusVariant = (status: ServiceRequestRecord['status']) => {
    switch (status) {
        case 'Completed': return 'default';
        case 'Active': return 'default';
        case 'New Update': return 'destructive';
        case 'In Progress': return 'secondary';
        case 'Rejected': return 'destructive';
        default: return 'outline';
    }
  }
  
  const hasUnreadUpdate = (request: ServiceRequestRecord) => {
    if (!request.updatedAt) return false;
    if (!request.lastViewedByClient) return true; // Never viewed, but has been updated
    return request.updatedAt.seconds > request.lastViewedByClient.seconds;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!user) {
      return null; // or a redirect component
  }
  
  if (!requests || requests.length === 0) {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                    You have no service requests
                </h3>
                <p className="text-sm text-muted-foreground">
                    You can start a new request from the homepage.
                </p>
                <Button className="mt-4" asChild>
                    <Link href="/">Create Request</Link>
                </Button>
            </div>
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Your Projects</CardTitle>
                <CardDescription>A list of all your service requests.</CardDescription>
            </div>
            <Button asChild>
                <Link href="/"><PlusCircle className="mr-2 h-4 w-4" /> New Request</Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
      <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Project Type</TableHead>
            <TableHead>Project Name</TableHead>
            <TableHead>Your Domain</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Status</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {requests.map((request) => (
                <TableRow key={request.id} onClick={() => router.push(`/dashboard/${request.id}`)} className="cursor-pointer">
                    <TableCell>{request.projectType}</TableCell>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                           {hasUnreadUpdate(request) && <span className="h-2 w-2 rounded-full bg-red-500"></span>}
                           <span>{request.projectName}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        {request.status === 'Completed' || request.status === 'Active' ? (
                            <a 
                                href={`http://${request.subdomain}.neka.ng`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {request.subdomain}.neka.ng
                            </a>
                        ) : (
                            <span>{request.subdomain}.neka.ng</span>
                        )}
                        
                    </TableCell>
                    <TableCell>{formatTimestamp(request.updatedAt ?? request.createdAt)}</TableCell>
                    <TableCell className="text-right">
                        <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
