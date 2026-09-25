import { z } from "zod";

export const connectionUserSchema = z.object({
  userId: z.string().min(1),
});
