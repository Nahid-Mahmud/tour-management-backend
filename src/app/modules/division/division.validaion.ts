import z from "zod";

export const createDivisionSchema = z.object({
  name: z.string().min(1, "Division name is required"),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
});
