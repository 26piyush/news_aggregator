import { z } from 'zod';

export const NewsCategoryEnum = z.enum([
  'all',
  'technology',
  'business',
  'science',
  'health',
  'politics',
  'sports',
  'world'
]);

export const NewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: NewsCategoryEnum.optional().default('all'),
  sourceId: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
  minReadability: z.coerce.number().min(0).max(100).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  biasLevel: z.enum(['minimal', 'low', 'moderate', 'elevated']).optional(),
  sortBy: z.enum(['publishedAt', 'readability', 'quality', 'title']).default('publishedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type NewsQuery = z.infer<typeof NewsQuerySchema>;

export const BookmarkCreateSchema = z.object({
  articleId: z.string().min(1, 'Article ID is required'),
});

export const UserPreferenceSchema = z.object({
  preferredCategories: z.array(z.string()).default([]),
  preferredSources: z.array(z.string()).default([]),
});

export const IngestionTriggerSchema = z.object({
  providers: z.array(z.string()).optional(),
  category: z.string().optional(),
});

export const AuthRegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(1, 'Name is required').max(50).optional(),
});

export const AuthLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const GuestLoginSchema = z.object({
  guestId: z.string().optional(),
});
