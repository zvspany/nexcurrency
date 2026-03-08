import { z } from "zod";

function normalizeAmountInput(rawValue: string): string {
  const compact = rawValue.trim().replace(/\s+/g, "");

  if (compact.includes(",") && compact.includes(".")) {
    return compact;
  }

  return compact.replace(",", ".");
}

export const amountSchema = z
  .string()
  .min(1, "Enter an amount")
  .transform((value) => normalizeAmountInput(value))
  .refine(
    (value) => /^(?:\d+(\.\d+)?|\.\d+)$/.test(value),
    "Enter a valid number",
  )
  .transform((value) => Number(value))
  .refine((value) => Number.isFinite(value), "Enter a valid number")
  .refine((value) => value > 0, "Amount must be greater than zero")
  .refine((value) => value <= 1_000_000_000_000, "Amount is too large");

export function validateAmount(
  amount: string,
): { ok: true; value: number } | { ok: false; error: string } {
  const result = amountSchema.safeParse(amount);

  if (result.success) {
    return { ok: true, value: result.data };
  }

  return {
    ok: false,
    error: result.error.issues[0]?.message ?? "Invalid amount",
  };
}
