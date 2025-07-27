import z from "zod";
import { IsActive, UserRole } from "./user.interface";

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name must not exceed 50 characters" }),
  email: z
    .string()
    .email({ message: "Invalid email format" })
    .max(100, { message: "Email must not exceed 100 characters" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, {
      message: "Password must contain at least one number",
    })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
  phone: z
    .string()
    .regex(/^(?:\+880|880|0)(1[3-9])[0-9]{8}$/, {
      message: `Phone number must be a valid Bangladeshi mobile number (e.g., +8801XXXXXXXXX, 8801XXXXXXXXX, or 01XXXXXXXXX) `,
    })
    .optional(),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name must not exceed 50 characters" })
    .optional(),
  role: z
    .enum(Object.values(UserRole), {
      message: `Role must be one of the following: ${Object.values(UserRole).join(", ")}`,
    })
    .optional(),
  phone: z
    .string()
    .regex(/^(?:\+880|880|0)(1[3-9])[0-9]{8}$/, {
      message: `Phone number must be a valid Bangladeshi mobile number (e.g., +8801XXXXXXXXX, 8801XXXXXXXXX, or 01XXXXXXXXX) `,
    })
    .optional(),
  address: z.string().max(255, { message: "Address must not exceed 255 characters" }).optional(),
  isDeleted: z.boolean().optional(),
  isActive: z.enum(Object.values(IsActive)).optional(),
  isVerified: z.boolean().optional(),
});
