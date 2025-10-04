

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, Timestamp, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import type { ServiceRequestRecord } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Shield, User as UserIcon, Loader2, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

function formatTimestamp(timestamp: Timestamp | undefined) {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
}

export default function ProjectDetailsPage() {
    const [request, setRequest] = useState<ServiceRequestRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [newComment, setNewComment] = useState('');

    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (!user) {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);
    
    useEffect(() => {
        if (user && id) {
          const docRef = doc(db, 'serviceRequests', id as string);
          
          const fetchAndMarkAsViewed = async () => {
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as ServiceRequestRecord;
                    if (data.userId === user.uid) {
                        setRequest({ ...data, id: docSnap.id });
                        // Mark as viewed if there are updates
                        const hasUnread = !data.lastViewedByClient || (data.updatedAt && data.updatedAt.seconds > data.lastViewedByClient.seconds);
                        if(hasUnread) {
                            await updateDoc(docRef, { lastViewedByClient: new Date() });
                        }
                    } else {
                        setError('You are not authorized to view this project.');
                    }
                } else {
                    setError('Project not found.');
                }
            } catch (err) {
                console.error('Error fetching document:', err);
                setError('Failed to fetch project details.');
            } finally {
                setLoading(false);
            }
          }

          fetchAndMarkAsViewed();

        } else if (!user) {
            // Wait for user auth state to be determined
        } else {
            setLoading(false);
            setError("Invalid project ID.")
        }
      }, [id, user]);

      const handlePostComment = async () => {
        if (!id || !newComment.trim() || !user || !request) return;
        setIsPostingComment(true);
        const docRef = doc(db, 'serviceRequests', id as string);

        const commentPayload = {
            author: user.displayName || 'User',
            authorId: user.uid,
            text: newComment.trim(),
            createdAt: new Date(),
        };

        const currentStatus = request.status;
        const newStatus = (currentStatus === 'Active' || currentStatus === 'Completed') ? 'New Update' : currentStatus;

        try {
            await updateDoc(docRef, {
                comments: arrayUnion(commentPayload),
                status: newStatus,
                updatedAt: serverTimestamp(),
            });

            setRequest(prev => prev ? {
                ...prev,
                status: newStatus,
                comments: [...(prev.comments || []), { ...commentPayload, createdAt: { seconds: Date.now()/1000, nanoseconds: 0 }}]
            } : null);
            
            setNewComment('');
            toast({
                title: 'Message Sent',
                description: 'Your message has been sent to the admin.',
            });
        } catch (error) {
            console.error("Error posting comment:", error);
            toast({
                variant: 'destructive',
                title: 'Message Failed',
                description: 'Could not send your message. Please try again.',
            });
        } finally {
            setIsPostingComment(false);
        }
      }

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

      const isCommentFromAdmin = (comment: NonNullable<ServiceRequestRecord['comments']>[0]) => {
        return comment.authorId !== user?.uid;
      }


    if (loading) {
        return (
            <div className="p-4 md:p-8 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="grid gap-6">
                       <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-6 w-1/2" />
                       </div>
                       <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-6 w-1/2" />
                       </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
                    <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                 </Card>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="p-4 md:p-8">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
                </Button>
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

    if (!request) {
        return null; // Should be covered by error state
    }

    return (
        <main className="flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Project Details
                </h1>
            </div>
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{request.projectName}</CardTitle>
                            <CardDescription>
                                Submitted on {formatTimestamp(request.createdAt as unknown as Timestamp)}
                            </CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(request.status)} className="text-base">
                            {request.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-6 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <h3 className="font-semibold">Your Domain</h3>
                            {request.status === 'Completed' || request.status === 'Active' ? (
                                <a 
                                    href={`http://${request.subdomain}.neka.ng`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1"
                                >
                                    {request.subdomain}.neka.ng <ExternalLink className="h-3 w-3"/>
                                </a>
                            ) : (
                                <p>{request.subdomain}.neka.ng</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <h3 className="font-semibold">Project Type</h3>
                            <p>{request.projectType}</p>
                        </div>
                    </div>
                    {request.projectType === 'Other' && request.otherProjectTypeDescription && (
                         <div className="grid gap-2">
                            <h3 className="font-semibold">Custom Project Type</h3>
                            <p className="text-muted-foreground">{request.otherProjectTypeDescription}</p>
                        </div>
                    )}
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <h3 className="font-semibold">Contact Name</h3>
                            <p>{request.name}</p>
                        </div>
                        <div className="grid gap-2">
                            <h3 className="font-semibold">WhatsApp Number</h3>
                            <p>{request.whatsapp}</p>
                        </div>
                    </div>
                     <Separator />
                     <div className="grid gap-2">
                        <h3 className="font-semibold">Project Source</h3>
                        <p>{request.hasProjectFiles}</p>
                     </div>
                     {request.hasProjectFiles === 'Yes, I have my project files ready' && request.projectLink && (
                        <div className="grid gap-2">
                            <h3 className="font-semibold">Project Link</h3>
                             <a 
                                href={request.projectLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                            >
                                {request.projectLink} <ExternalLink className="h-3 w-3"/>
                            </a>
                        </div>
                     )}
                    {request.hasProjectFiles === 'No, I need a new project built' && request.newProjectDescription && (
                        <div className="grid gap-2">
                            <h3 className="font-semibold">New Project Description</h3>
                            <p className="text-muted-foreground">{request.newProjectDescription}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <MessageSquare className="h-5 w-5" /> Communication Log
                    </CardTitle>
                    <CardDescription>Request changes or ask questions here. All messages are visible to the admin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {request.comments && request.comments.length > 0 ? (
                         <div className="space-y-6">
                            {request.comments.sort((a,b) => a.createdAt.seconds - b.createdAt.seconds).map((comment, index) => (
                                <div key={index} className={cn(
                                    "flex items-start gap-3",
                                    !isCommentFromAdmin(comment) && "justify-end"
                                )}>
                                    {isCommentFromAdmin(comment) && (
                                        <Avatar className="h-9 w-9 border">
                                            <AvatarFallback><Shield className="h-5 w-5" /></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "grid gap-1.5 max-w-[75%] rounded-lg p-3",
                                        !isCommentFromAdmin(comment) 
                                            ? 'bg-primary text-primary-foreground' 
                                            : 'bg-muted'
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <div className="font-semibold text-sm">{comment.author}</div>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                                        <div className={cn(
                                            "text-xs mt-1",
                                            !isCommentFromAdmin(comment) ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                        )}>
                                            {formatTimestamp(comment.createdAt as unknown as Timestamp)}
                                        </div>
                                    </div>
                                    {!isCommentFromAdmin(comment) && (
                                        <Avatar className="h-9 w-9 border">
                                            <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Start the conversation!</p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
                     <Textarea 
                        placeholder="Type your message here..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-24"
                     />
                     <Button onClick={handlePostComment} disabled={isPostingComment || newComment.trim().length === 0}>
                        {isPostingComment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Message
                     </Button>
                </CardFooter>
            </Card>
        </main>
    );
}

    