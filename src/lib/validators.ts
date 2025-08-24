import { z } from "zod";

export const sortCodeRegex = /^\d{2}-\d{2}-\d{2}$/;
export const accountNumberRegex = /^\d{8}$/;

export const payeeSchema = z.object({
  name: z.string().min(2),
  sortCode: z.string().regex(sortCodeRegex, "Use format 12-34-56"),
  accountNumber: z.string().regex(accountNumberRegex, "8 digits"),
  reference: z.string().optional(),
});

export const internalTransferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amountPence: z.number().int().positive(),
  description: z.string().optional(),
});

export const externalPaymentInitSchema = z.object({
  fromAccountId: z.string().min(1),
  payeeId: z.string().min(1),
  amountPence: z.number().int().positive(),
  description: z.string().optional(),
});

export const otpSchema = z.object({
  paymentId: z.string().min(1),
  code: z.string().length(6),
});
