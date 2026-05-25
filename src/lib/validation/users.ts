import { z } from "zod";

export const profileImageSchema = z.object({
  imageUrl: z.union([z.string().url("Must be a valid URL"), z.literal("")]),
});

export const banUserSchema = z.object({
  userId: z.string().min(1),
});

export const promoteUserSchema = z.object({
  userId: z.string().min(1),
  role: z.enum([
    "ADMIN",
    "MODERATOR",
    "CONTENT_REVIEWER",
    "STUDENT",
    "EMPLOYER",
    "JOB_SEEKER",
    "RECRUITER",
  ]),
});

export const adminUserActionSchema = z
  .discriminatedUnion("action", [
    z.object({ action: z.literal("suspend"), userId: z.string().min(1) }),
    z.object({ action: z.literal("unsuspend"), userId: z.string().min(1) }),
    z.object({ action: z.literal("shadow"), userId: z.string().min(1) }),
    z.object({ action: z.literal("unshadow"), userId: z.string().min(1) }),
    z.object({
      action: z.literal("assignRole"),
      userId: z.string().min(1),
      role: z.enum([
        "ADMIN",
        "MODERATOR",
        "CONTENT_REVIEWER",
        "STUDENT",
        "EMPLOYER",
        "JOB_SEEKER",
        "RECRUITER",
      ]),
    }),
    z.object({
      action: z.literal("resetContact"),
      userId: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().min(7).optional(),
    }),
  ])
  .refine(
    (v) => !(v.action === "resetContact") || !!(v as { email?: string; phone?: string }).email || !!(v as { email?: string; phone?: string }).phone,
    { message: "resetContact requires email or phone" },
  );
