// FILE: src/lib/validators.ts
import { z } from "zod";

/* -----------------------------
 * Shared regex & small helpers
 * ----------------------------*/
export const sortCodeRegex = /^\d{2}-\d{2}-\d{2}$/;
export const accountNumberRegex = /^\d{8}$/;

/* -----------------------------
 * Existing (unchanged)
 * ----------------------------*/
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

/* -----------------------------
 * New (additive)
 * ----------------------------*/
export const vendorPaymentInitSchema = z.object({
  kind: z.literal("EXTERNAL_VENDOR"),
  fromAccountId: z.string().min(1),
  amountPence: z.number().int().positive(),
  description: z.string().optional(),
  vendor: z.enum(["PAYPAL", "WISE", "REVOLUT"]).default("PAYPAL"),
  vendorHandle: z.string().min(3), // PayPal email or vendor username
});

/* ---------------------------------------------------
 * Optional convenience: single union for all methods
 * - INTERNAL         => internal account-to-account
 * - EXTERNAL_BANK    => external via bank payee
 * - EXTERNAL_VENDOR  => external via vendor (PayPal/Wise/Revolut)
 * --------------------------------------------------- */
export const internalPaymentInitSchema = z.object({
  kind: z.literal("INTERNAL"),
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amountPence: z.number().int().positive(),
  description: z.string().optional(),
});

export const externalBankPaymentInitSchema = z.object({
  kind: z.literal("EXTERNAL_BANK"),
  fromAccountId: z.string().min(1),
  payeeId: z.string().min(1),
  amountPence: z.number().int().positive(),
  description: z.string().optional(),
});

export const paymentInitSchema = z.discriminatedUnion("kind", [
  internalPaymentInitSchema,
  externalBankPaymentInitSchema,
  vendorPaymentInitSchema,
]);

/* -----------------------------
 * Exported Types
 * ----------------------------*/
export type PayeeInput = z.infer<typeof payeeSchema>;
export type InternalTransferInput = z.infer<typeof internalTransferSchema>;
export type ExternalPaymentInitInput = z.infer<
  typeof externalPaymentInitSchema
>;
export type VendorPaymentInitInput = z.infer<typeof vendorPaymentInitSchema>;
export type PaymentInitInput = z.infer<typeof paymentInitSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
