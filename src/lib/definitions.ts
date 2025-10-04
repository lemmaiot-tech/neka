
import { z } from 'zod';

export const projectTypes = [
  'POS & Inventory System',
  'Local Marketplace/Shop',
  'Appointment/Booking System',
  'Food/Product Delivery Platform',
  'Business Directory/Listing',
  'Payment Gateway Integration',
  'Logistics & Tracking System',
  'Online Learning Platform',
  'Static Website/Blogs/Pages',
  'Other',
] as const;

export const hasProjectFilesOptions = [
    'Yes, I have my project files ready',
    'No, I need a new project built'
] as const;

export const requestStatuses = [
    'Pending',
    'In Progress',
    'New Update',
    'Active',
    'Completed',
    'Rejected'
] as const;

export const ServiceRequestSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  whatsapp: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  projectName: z.string().min(2, { message: 'Project name must be at least 2 characters.' }),
  projectType: z.enum(projectTypes, {
    errorMap: () => ({ message: "Please select a project type." }),
  }),
  subdomain: z.string().min(3, { message: 'Subdomain must be at least 3 characters.' })
    .regex(/^[a-z0-9-]+$/, { message: 'Only lowercase letters, numbers, and hyphens are allowed.' }),
  otherProjectTypeDescription: z.string().optional(),
  hasProjectFiles: z.enum(hasProjectFilesOptions, {
      errorMap: () => ({ message: 'Please select an option.' }),
  }),
  projectLink: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  newProjectDescription: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.projectType === 'Other' && (!data.otherProjectTypeDescription || data.otherProjectTypeDescription.length < 10)) {
        ctx.addIssue({
            code: 'custom',
            path: ['otherProjectTypeDescription'],
            message: 'Description must be at least 10 characters.',
        });
    }
    if (data.hasProjectFiles === 'Yes, I have my project files ready' && !data.projectLink) {
        ctx.addIssue({
            code: 'custom',
            path: ['projectLink'],
            message: 'Please provide a link to your project files (e.g., GitHub, Google Drive).',
        });
    }
    if (data.hasProjectFiles === 'No, I need a new project built' && (!data.newProjectDescription || data.newProjectDescription.length < 20)) {
        ctx.addIssue({
            code: 'custom',
            path: ['newProjectDescription'],
            message: 'Please describe your project in at least 20 characters.',
        });
    }
});


export type ServiceRequest = z.infer<typeof ServiceRequestSchema>;


export interface ServiceRequestRecord extends ServiceRequest {
    id: string;
    userId: string;
    status: (typeof requestStatuses)[number];
    createdAt: { seconds: number, nanoseconds: number };
    updatedAt?: { seconds: number, nanoseconds: number };
    lastViewedByClient?: { seconds: number, nanoseconds: number };
    comments?: Array<{
      author: string;
      authorId: string;
      text: string;
      createdAt: { seconds: number, nanoseconds: number };
    }>
}

export const UserProfileSchema = z.object({
    website: z.string().url().optional(),
    github: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
    
