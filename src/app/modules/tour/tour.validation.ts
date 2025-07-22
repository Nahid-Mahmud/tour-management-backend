import z from "zod";

export const createTourZodSchema = z.object({
  title: z.string(),
  slug: z.string().min(1, "Slug is required").max(100, "Slug must be less than 100 characters").optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  location: z.string().optional(),
  constFrom: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  included: z.array(z.string()).optional(),
  excluded: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  tourPlan: z.array(z.string()).optional(),
  maxGuest: z.number().int().positive().optional(),
  minAge: z.number().int().nonnegative().optional(),
  division: z.string().optional(),
  tourType: z.string().optional(),
  departureLocation: z.string().optional(),
  arrivalLocation: z.string().optional(),
});

export const updateTourZodSchema = z.object({
  title: z.string().optional(),
  slug: z.string().min(1, "Slug is required").max(100, "Slug must be less than 100 characters").optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  location: z.string().optional(),
  constFrom: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  included: z.array(z.string()).optional(),
  excluded: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  tourPlan: z.array(z.string()).optional(),
  maxGuest: z.number().int().positive().optional(),
  minAge: z.number().int().nonnegative().optional(),
  division: z.string().optional(),
  tourType: z.string().optional(),
  departureLocation: z.string().optional(),
  arrivalLocation: z.string().optional(),
});

export const createTourTypeZodSchema = z.object({
  name: z.string(),
});

export const updateTourTypeZodSchema = z.object({
  name: z.string().optional(),
});
