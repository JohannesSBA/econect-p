import { z } from "zod";

export const chapaCheckoutSchema = z.object({
  jobId: z.string().min(1),
  amount: z.coerce.number().positive().optional(),
  currency: z.string().min(1).optional(),
  discountCode: z.string().optional(),
});

export const chapaConfirmSchema = z.object({
  paymentId: z.string().min(1),
});

export const paymentStatusSchema = z.object({
  paymentId: z.string().min(1),
});
