import { z } from 'zod';
export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
});
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});
export const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});
export const createHoldSchema = z.object({
    seats: z
        .array(z.string().regex(/^[A-Z]-\d+-\d+$/, 'Invalid seat format'))
        .min(1, 'At least one seat is required')
        .max(10, 'Maximum 10 seats per hold'),
    ttlSeconds: z.number().min(60).max(3600).optional(),
});
export const createEventSchema = z.object({
    venueId: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().min(1),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    genre: z.string().optional(),
    posterPath: z.string().url().optional(),
});
export const createVenueSchema = z.object({
    name: z.string().min(1).max(200),
    address: z.string().min(1),
    capacity: z.number().int().positive(),
});
export const createSeatSchema = z.object({
    section: z.string().min(1),
    row: z.string().min(1),
    number: z.string().min(1),
    price: z.number().positive(),
});
export const paginationSchema = z.object({
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
    offset: z.string().transform(Number).pipe(z.number().int().nonnegative()).optional(),
});
