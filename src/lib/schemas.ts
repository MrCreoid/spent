import { z } from "zod";
import { CATEGORIES } from "./types";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

const money = z
  .number({ invalid_type_error: "Enter an amount" })
  .positive("Enter an amount")
  .max(99_999_999, "That's too large");

export const expenseSchema = z.object({
  amount: money,
  category: z.enum(CATEGORIES),
  date: isoDate,
  time: z.string().regex(/^\d{2}:\d{2}$/),
  note: z.string().trim().max(140, "Keep notes under 140 characters").optional(),
});

export const entrySchema = z.object({
  person: z
    .string()
    .trim()
    .min(1, "Who is this with?")
    .max(60, "Keep the name shorter"),
  amount: money,
  kind: z.enum(["lent", "borrowed"]),
  reason: z.string().trim().max(140, "Keep it under 140 characters").optional(),
  date: isoDate,
  note: z.string().trim().max(140, "Keep notes under 140 characters").optional(),
});

export type EntryFormValues = z.infer<typeof entrySchema>;

export const settleSchema = z.object({
  amount: money,
  date: isoDate,
});
