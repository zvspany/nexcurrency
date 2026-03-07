import { z } from "zod";

export const amountSchema = z
  .string()
  .trim()
  .min(1, "Enter an amount")
  .refine((value) => !Number.isNaN(Number(value)), "Enter a valid number")
  .transform((value) => Number(value))
  .refine((value) => Number.isFinite(value), "Enter a valid number")
  .refine((value) => value > 0, "Amount must be greater than zero")
  .refine((value) => value <= 1_000_000_000_000, "Amount is too large");

export function validateAmount(amount: string):
  | { ok: true; value: number }
  | { ok: false; error: string } {
  const result = amountSchema.safeParse(amount);

  if (result.success) {
    return { ok: true, value: result.data };
  }

  return {
    ok: false,
    error: result.error.issues[0]?.message ?? "Invalid amount"
  };
}
