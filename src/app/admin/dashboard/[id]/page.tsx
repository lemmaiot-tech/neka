

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, Timestamp, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import type { ServiceRequestRecord } from '@/lib/definitions';
import { requestStatuses, projectTypes } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Loader2, MessageSquare, User as UserIcon, Shield, Edit, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';


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

export default function AdminProjectDetailsPage() {
    const [request, setRequest] = useState<ServiceRequestRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<ServiceRequestRecord['status'] | undefined>();
    const [newComment, setNewComment] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editableData, setEditableData] = useState<{projectName: string; subdomain: string; projectType: string;}>({
        projectName: '',
        subdomain: '',
        projectType: '',
    });


    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => setUser(user));
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (id) {
          const docRef = doc(db, 'serviceRequests', id as string);
          getDoc(docRef)
            .then((docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data() as ServiceRequestRecord;
                setRequest({ ...data, id: docSnap.id });
                setCurrentStatus(data.status);
                setEditableData({
                    projectName: data.projectName,
                    subdomain: data.subdomain,
                    projectType: data.projectType,
                })
              } else {
                setError('Project not found.');
              }
            })
            .catch((err) => {
              console.error('Error fetching document:', err);
              setError('Failed to fetch project details.');
            })
            .finally(() => {
              setLoading(false);
            });
        }
      }, [id]);

      const handleStatusUpdate = async () => {
        if (!id || !currentStatus) return;
        setIsUpdating(true);
        const docRef = doc(db, 'serviceRequests', id as string);
        try {
            await updateDoc(docRef, { 
                status: currentStatus,
                updatedAt: serverTimestamp(),
             });
            setRequest(prev => prev ? { ...prev, status: currentStatus } : null);
            toast({
                title: "Status Updated",
                description: `Project status has been changed to "${currentStatus}".`,
            });
        } catch (err) {
            console.error("Error updating status:", err);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the project status.'
            });
        } finally {
            setIsUpdating(false);
        }
      }

      const handleDetailsUpdate = async () => {
        if (!id) return;
        setIsUpdating(true);
        const docRef = doc(db, 'serviceRequests', id as string);
        try {
            await updateDoc(docRef, {
                projectName: editableData.projectName,
                subdomain: editableData.subdomain,
                projectType: editableData.projectType,
                updatedAt: serverTimestamp(),
            });
            setRequest(prev => prev ? {
                 ...prev,
                 projectName: editableData.projectName,
                 subdomain: editableData.subdomain,
                 projectType: editableData.projectType,
            } : null);
            toast({
                title: "Project Details Updated",
                description: "The project details have been successfully saved.",
            });
            setIsEditing(false);
        } catch (err) {
            console.error("Error updating details:", err);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the project details.'
            });
        } finally {
            setIsUpdating(false);
        }
      }

      const handlePostComment = async () => {
        if (!id || !newComment.trim() || !user) return;
        setIsPostingComment(true);
        const docRef = doc(db, 'serviceRequests', id as string);

        const commentPayload = {
            author: user.displayName || 'Admin',
            authorId: user.uid,
            text: newComment.trim(),
            createdAt: new Date(),
        };

        try {
            await updateDoc(docRef, {
                comments: arrayUnion(commentPayload),
                updatedAt: serverTimestamp(),
            });

            // Optimistically update UI
            setRequest(prev => prev ? {
                ...prev,
                comments: [...(prev.comments || []), { ...commentPayload, createdAt: { seconds: Date.now()/1000, nanoseconds: 0 }}]
            } : null);
            
            setNewComment('');
            toast({
                title: 'Comment Posted',
                description: 'Your comment has been added to the project.',
            });
        } catch (error) {
            console.error("Error posting comment:", error);
            toast({
                variant: 'destructive',
                title: 'Comment Failed',
                description: 'Could not post your comment. Please try again.',
            });
        } finally {
            setIsPostingComment(false);
        }
      }

      const getStatusVariant = (status?: ServiceRequestRecord['status']) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Active': return 'default';
            case 'New Update': return 'destructive';
            case 'In Progress': return 'secondary';
            case 'Rejected': return 'destructive';
            default: return 'outline';
        }
      }

      const handleCancelEdit = () => {
        if (!request) return;
        setEditableData({
            projectName: request.projectName,
            subdomain: request.subdomain,
            projectType: request.projectType,
        });
        setIsEditing(false);
      }

    if (loading) {
        return (
            <div className="p-4 md:p-8 space-y-4">
                <Skeleton className="h-8 w-48 mb-4" />
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
                    <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                    <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                    <CardFooter><Skeleton className="h-10 w-24" /></CardFooter>
                </Card>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="p-4 md:p-8">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/admin/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard</Link>
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
        return null;
    }

    const isCommentFromAdmin = (comment: NonNullable<ServiceRequestRecord['comments']>[0]) => {
        // Using author name as a fallback for old comments
        return comment.authorId === user?.uid || comment.author === 'Admin';
    }

    return (
        <main className="flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.push('/admin/dashboard')}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Manage Project
                </h1>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                            <Button onClick={handleDetailsUpdate} disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                Save
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                    )}
                </div>
            </div>
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                             {isEditing ? (
                                <Input 
                                    value={editableData.projectName}
                                    onChange={(e) => setEditableData({...editableData, projectName: e.target.value})}
                                    className="text-2xl font-bold h-auto p-0 border-0 shadow-none focus-visible:ring-0"
                                />
                            ) : (
                                <CardTitle className="text-2xl">{request.projectName}</CardTitle>
                            )}
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
                            <h3 className="font-semibold">Domain</h3>
                             {isEditing ? (
                                <div className="flex items-center">
                                    <Input 
                                        value={editableData.subdomain}
                                        onChange={(e) => setEditableData({...editableData, subdomain: e.target.value})}
                                        className="rounded-r-none focus-within:z-10 relative h-9"
                                    />
                                    <span className="bg-muted px-3 border border-l-0 rounded-r-md h-9 flex items-center text-sm text-muted-foreground">
                                    .neka.ng
                                    </span>
                                </div>
                            ) : (
                                <p>{request.subdomain}.neka.ng</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <h3 className="font-semibold">Project Type</h3>
                            {isEditing ? (
                                 <Select onValueChange={(value) => setEditableData({...editableData, projectType: value})} defaultValue={editableData.projectType}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Change type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projectTypes.map(type => (
                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <p>{request.projectType}</p>
                            )}
                        </div>
                    </div>
                    {request.projectType === 'Other' && request.otherProjectTypeDescription && !isEditing && (
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
                     <div className="grid gap-2">
                            <h3 className="font-semibold">Contact Email</h3>
                            <p>{request.email}</p>
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
                                {request.projectLink} <ExternalLink className="h-3 w-3" />
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
                <CardFooter className="border-t pt-6">
                    <div className="flex items-center gap-4">
                        <h3 className="font-semibold">Update Status</h3>
                        <Select onValueChange={(value) => setCurrentStatus(value as ServiceRequestRecord['status'])} defaultValue={currentStatus}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Change status" />
                            </SelectTrigger>
                            <SelectContent>
                                {requestStatuses.map(status => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleStatusUpdate} disabled={isUpdating || currentStatus === request.status}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Status
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Communication Log</CardTitle>
                    <CardDescription>Post updates or view messages from the user.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {request.comments && request.comments.length > 0 ? (
                         <div className="space-y-6">
                            {request.comments.sort((a,b) => a.createdAt.seconds - b.createdAt.seconds).map((comment, index) => (
                                <div key={index} className={cn(
                                    "flex items-start gap-3",
                                    isCommentFromAdmin(comment) && "justify-end"
                                )}>
                                   {!isCommentFromAdmin(comment) && (
                                     <Avatar className="h-9 w-9 border">
                                         <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                                     </Avatar>
                                   )}
                                    <div className={cn(
                                        "grid gap-1.5 max-w-[75%] rounded-lg p-3",
                                        isCommentFromAdmin(comment) 
                                            ? 'bg-primary text-primary-foreground' 
                                            : 'bg-muted'
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <div className="font-semibold text-sm">{comment.author}</div>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                                        <div className={cn(
                                            "text-xs mt-1",
                                            isCommentFromAdmin(comment) ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                        )}>
                                            {formatTimestamp(comment.createdAt as unknown as Timestamp)}
                                        </div>
                                    </div>
                                    {isCommentFromAdmin(comment) && (
                                     <Avatar className="h-9 w-9 border">
                                         <AvatarFallback><Shield className="h-5 w-5" /></AvatarFallback>
                                     </Avatar>
                                   )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No comments have been posted yet.</p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
                     <Textarea 
                        placeholder="Type your comment here..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-24"
                     />
                     <Button onClick={handlePostComment} disabled={isPostingComment || newComment.trim().length === 0}>
                        {isPostingComment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Post Comment
                     </Button>
                </CardFooter>
            </Card>
        </main>
    );
}

    

    