
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ServiceRequest } from "@/lib/definitions";
import { ServiceRequestSchema, projectTypes, hasProjectFilesOptions } from "@/lib/definitions";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CheckCircle2,
  XCircle,
  PartyPopper,
  ShoppingCart,
  Store,
  Calendar,
  Truck,
  Book,
  CreditCard,
  Map,
  BookOpen,
  MoreHorizontal,
  Loader2,
  FileText,
  ExternalLink,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { improveDescription, suggestFeatures } from "@/ai/flows/project-suggester-flow";
import type { FeatureSuggestion } from "@/ai/flows/project-suggester-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const projectTypeIcons: Record<typeof projectTypes[number], React.ElementType> = {
  'POS & Inventory System': ShoppingCart,
  'Local Marketplace/Shop': Store,
  'Appointment/Booking System': Calendar,
  'Food/Product Delivery Platform': Truck,
  'Business Directory/Listing': Book,
  'Payment Gateway Integration': CreditCard,
  'Logistics & Tracking System': Map,
  'Online Learning Platform': BookOpen,
  'Static Website/Blogs/Pages': FileText,
  'Other': MoreHorizontal,
};

const unavailableSubdomains = ["admin", "root", "test", "blog", "api", "shop", "neka", "www"];

export function HostingForm() {
  const { toast } = useToast();
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "success">("idle");
  const [submittedData, setSubmittedData] = useState<ServiceRequest | null>(null);
  const [availability, setAvailability] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<FeatureSuggestion | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const form = useForm<ServiceRequest>({
    resolver: zodResolver(ServiceRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      whatsapp: "",
      projectName: "",
      subdomain: "",
      otherProjectTypeDescription: "",
      projectLink: "",
      newProjectDescription: "",
    },
  });
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        form.setValue("name", user.displayName || "");
        form.setValue("email", user.email || "");
      }
    });
    return () => unsubscribe();
  }, [form]);

  const watchedSubdomain = form.watch("subdomain");
  const watchedProjectType = form.watch("projectType");
  const watchedHasProjectFiles = form.watch("hasProjectFiles");
  const watchedNewProjectDescription = form.watch("newProjectDescription");

  const checkAvailability = useCallback(async (subdomain: string) => {
    if (subdomain.length < 3) {
      setAvailability("idle");
      return;
    }
    setAvailability("checking");

    if (unavailableSubdomains.includes(subdomain)) {
        setAvailability("unavailable");
        return;
    }

    try {
        const requestsRef = collection(db, "serviceRequests");
        const q = query(requestsRef, where("subdomain", "==", subdomain));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setAvailability("available");
        } else {
            setAvailability("unavailable");
        }
    } catch (error) {
        console.error("Error checking subdomain:", error);
        setAvailability("idle"); 
        toast({
            variant: "destructive",
            title: "Could not check subdomain.",
            description: "Please check your connection or Firebase security rules."
        })
    }
  }, [toast]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (watchedSubdomain) {
        checkAvailability(watchedSubdomain);
      } else {
        setAvailability("idle");
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [watchedSubdomain, checkAvailability]);

  async function onSubmit(data: ServiceRequest) {
    setIsSubmitting(true);

    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Required",
            description: ( <p>You must be logged in to submit a request. Please <Link href="/login" className="underline">log in</Link>.</p> ),
        });
        setIsSubmitting(false);
        return;
    }
    
    // Final check for availability before submitting
    const q = query(collection(db, "serviceRequests"), where("subdomain", "==", data.subdomain));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty || unavailableSubdomains.includes(data.subdomain)) {
        setAvailability("unavailable");
        toast({
            variant: "destructive",
            title: "Subdomain not available",
            description: "Please choose a different subdomain.",
        });
        setIsSubmitting(false);
        return;
    } else {
        setAvailability("available")
    }

    try {
      await addDoc(collection(db, "serviceRequests"), {
        ...data,
        userId: user.uid,
        status: 'Pending',
        createdAt: new Date(),
      });
      setSubmittedData(data);
      setSubmissionStatus("success");
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: "There was a problem with your request. Please try again.",
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleEnhanceDescription = async () => {
    const currentDescription = form.getValues("newProjectDescription");
    if (!currentDescription || currentDescription.trim().length < 20) {
        toast({
            variant: 'destructive',
            title: 'Description too short',
            description: 'Please provide a description of at least 20 characters before enhancing.',
        });
        return;
    }
    setIsEnhancing(true);
    try {
        const enhancedDescription = await improveDescription(currentDescription);
        form.setValue("newProjectDescription", enhancedDescription, { shouldValidate: true });
        toast({
            title: 'Description Enhanced!',
            description: 'Your project description has been improved by AI.',
        });
    } catch (error) {
        console.error("Error enhancing description:", error);
        toast({
            variant: 'destructive',
            title: 'AI Enhancement Failed',
            description: 'Could not improve the description at this time.',
        });
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleSuggestFeatures = async () => {
      const currentDescription = form.getValues("newProjectDescription");
      if (!currentDescription || currentDescription.trim().length < 20) {
          toast({
              variant: 'destructive',
              title: 'Description too short',
              description: 'Please provide a detailed description before suggesting features.',
          });
          return;
      }
      setIsSuggesting(true);
      setSuggestions(null);
      try {
          const featureSuggestions = await suggestFeatures(currentDescription);
          setSuggestions(featureSuggestions);
      } catch (error) {
          console.error("Error suggesting features:", error);
          toast({
              variant: 'destructive',
              title: 'AI Suggestion Failed',
              description: 'Could not generate feature suggestions at this time.',
          });
      } finally {
          setIsSuggesting(false);
      }
  };


  if (submissionStatus === "success") {
    const needsNewProject = submittedData?.hasProjectFiles === 'No, I need a new project built';
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-secondary/50">
        <PartyPopper className="h-16 w-16 text-accent mb-4" />
        <h3 className="text-2xl font-bold font-headline mb-2">Request Submitted!</h3>
        <p className="text-muted-foreground mb-6">
          Thank you! We've received your request and will get back to you shortly.
        </p>

        {needsNewProject && (
            <div className="bg-background/80 p-4 rounded-lg border border-dashed text-center mb-6">
                <p className="text-sm font-semibold mb-2">Need Professional Help?</p>
                <p className="text-xs text-muted-foreground mb-3">
                    For custom development, you can make a request for our professional services.
                </p>
                <Button size="sm" variant="outline" asChild>
                    <a href="https://lemmaiot.com.ng/request" target="_blank" rel="noopener noreferrer">
                        Request a Quote <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                </Button>
            </div>
        )}
        
        <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
        </Button>
      </div>
    );
  }
  
  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-secondary/50 space-y-4">
            <h3 className="text-xl font-bold font-headline">Please sign in to continue</h3>
            <p className="text-muted-foreground">
                You need to have an account to submit a service request.
            </p>
            <div className="flex gap-4">
                <Button asChild>
                    <Link href="/login">Log In</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/signup">Sign Up</Link>
                </Button>
            </div>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Ada Lovelace" {...field} readOnly disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="ada@example.com" {...field} readOnly disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="projectName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input placeholder="Lovelace Logistics" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp Number</FormLabel>
                <FormControl>
                  <Input placeholder="+2348012345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="projectType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What are you building?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projectTypes.map((type) => {
                    const Icon = projectTypeIcons[type];
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                           <Icon className="h-4 w-4" />
                           <span>{type}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedProjectType === 'Other' && (
            <FormField
              control={form.control}
              name="otherProjectTypeDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Please describe your project</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit about your project"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

        <FormField
          control={form.control}
          name="hasProjectFiles"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Do you have your project files ready?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  {hasProjectFilesOptions.map((option) => (
                    <FormItem key={option} className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                            <RadioGroupItem value={option} />
                        </FormControl>
                        <FormLabel className="font-normal">{option}</FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedHasProjectFiles === 'Yes, I have my project files ready' && (
             <FormField
                control={form.control}
                name="projectLink"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Link to Project Files</FormLabel>
                    <FormControl>
                        <Input placeholder="https://github.com/your-repo" {...field} />
                    </FormControl>
                    <FormDescription>
                        Provide a link to your code (e.g., GitHub, GitLab, Google Drive). File upload will be handled later.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}

        {watchedHasProjectFiles === 'No, I need a new project built' && (
             <div className="space-y-4">
              <FormField
                  control={form.control}
                  name="newProjectDescription"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Describe the project you need</FormLabel>
                      <FormControl>
                      <Textarea
                          placeholder="e.g., I need a website for my bakery that allows customers to see my menu and place orders online."
                          className="resize-none"
                          rows={5}
                          {...field}
                      />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleEnhanceDescription} disabled={isEnhancing || !watchedNewProjectDescription}>
                      {isEnhancing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                      Enhance with AI
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleSuggestFeatures} disabled={isSuggesting || !watchedNewProjectDescription}>
                      {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Lightbulb className="mr-2 h-4 w-4"/>}
                      Suggest Features
                  </Button>
              </div>

              {isSuggesting && (
                  <div className="flex items-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                      Generating creative ideas...
                  </div>
              )}

              {suggestions && (
                  <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertTitle>AI-Powered Feature Suggestions</AlertTitle>
                      <AlertDescription>
                          <div className="space-y-4 mt-2">
                              <div>
                                  <h4 className="font-semibold text-foreground">Unique Selling Proposition (USP)</h4>
                                  <p className="text-xs">{suggestions.uniqueSellingProposition}</p>
                              </div>
                              <div>
                                  <h4 className="font-semibold text-foreground">Core Features</h4>
                                  <ul className="list-disc pl-5 text-xs space-y-1">
                                      {suggestions.coreFeatures.map((feature, i) => <li key={`core-${i}`}>{feature}</li>)}
                                  </ul>
                              </div>
                              <div>
                                  <h4 className="font-semibold text-foreground">Growth Features</h4>
                                  <ul className="list-disc pl-5 text-xs space-y-1">
                                      {suggestions.growthFeatures.map((feature, i) => <li key={`growth-${i}`}>{feature}</li>)}
                                  </ul>
                              </div>
                          </div>
                      </AlertDescription>
                  </Alert>
              )}
            </div>
        )}
        
        <FormField
          control={form.control}
          name="subdomain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Choose your subdomain</FormLabel>
              <div className="flex items-center">
                <FormControl>
                  <Input 
                    placeholder="your-project" 
                    {...field}
                    className="rounded-r-none focus-within:z-10 relative"
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <span className="bg-muted px-4 py-2 border border-l-0 rounded-r-md h-10 flex items-center text-sm text-muted-foreground">
                  .neka.ng
                </span>
              </div>
              <FormMessage />
              <FormDescription>
                 <div className="flex items-center space-x-2 h-4 mt-1">
                  {watchedSubdomain.length > 2 && (
                    <>
                      {availability === "checking" && <><Loader2 className="h-4 w-4 animate-spin" /><span>Checking availability...</span></>}
                      {availability === "available" && <><CheckCircle2 className="h-4 w-4 text-green-600" /> <span className="text-green-600">Available!</span></>}
                      {availability === "unavailable" && <><XCircle className="h-4 w-4 text-destructive" /> <span className="text-destructive">This subdomain is taken.</span></>}
                    </>
                  )}
                  {watchedSubdomain.length > 0 && watchedSubdomain.length < 3 && (
                     <span>Minimum 3 characters required.</span>
                  )}
                </div>
              </FormDescription>
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isSubmitting || availability !== 'available'} 
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          size="lg"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Request
        </Button>
      </form>
    </Form>
  );
}
