
'use client';

import { useEffect, useState, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { ServiceRequestRecord } from '@/lib/definitions';
import { requestStatuses } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from 'lucide-react';


function formatTimestamp(timestamp: Timestamp | undefined) {
  if (!timestamp) return "N/A";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AdminDashboardPage() {
  const [requests, setRequests] = useState<ServiceRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user);
        // User state is handled by the layout
        if (user) {
            fetchRequests();
        }
    });

    const fetchRequests = async () => {
        setLoading(true);
        try {
          const requestsRef = collection(db, "serviceRequests");
          const q = query(requestsRef, orderBy("createdAt", "desc"));
          const querySnapshot = await getDocs(q);

          const requestsData = querySnapshot.docs.map(doc => ({
              ...doc.data(),
              id: doc.id
          })) as ServiceRequestRecord[];
          setRequests(requestsData);

        } catch (err: any) {
          console.error("Error fetching requests:", err);
           if (err.code === 'failed-precondition') {
             setError("The database query failed because a composite index is required. Please create the index in your Firebase console and then refresh the page.");
          } else {
            setError("Failed to fetch service requests. Check Firestore rules and connection.");
          }
        } finally {
          setLoading(false);
        }
    }

    return () => unsubscribe();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
        const matchesStatus = statusFilter ? request.status === statusFilter : true;
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        const matchesSearch = searchTerm ? 
            ((request.projectName || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (request.name || '').toLowerCase().includes(lowercasedSearchTerm) ||
            (request.subdomain || '').toLowerCase().includes(lowercasedSearchTerm))
            : true;
        return matchesStatus && matchesSearch;
    });
  }, [requests, searchTerm, statusFilter]);

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

  if (loading) {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
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
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card className="border-destructive">
                <CardHeader>
                <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                <p>{error}</p>
                </CardContent>
            </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                    <CardTitle>All Service Requests</CardTitle>
                    <CardDescription>A list of all projects submitted by users.</CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="search"
                            placeholder="Search projects..."
                            className="pl-8 sm:w-[200px] lg:w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {requestStatuses.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
        <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredRequests.map((request) => (
                    <TableRow key={request.id} onClick={() => router.push(`/admin/dashboard/${request.id}`)} className="cursor-pointer">
                        <TableCell className="font-medium">{request.name}</TableCell>
                        <TableCell>{request.projectName}</TableCell>
                        <TableCell>{request.subdomain}.neka.ng</TableCell>
                        <TableCell>{formatTimestamp(request.updatedAt ?? request.createdAt as unknown as Timestamp)}</TableCell>
                        <TableCell className="text-right">
                            <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            </Table>
            {filteredRequests.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    {requests.length > 0 ? "No requests match your search or filter." : "No service requests have been submitted yet."}
                </div>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
