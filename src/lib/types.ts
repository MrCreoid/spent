export const CATEGORIES = [
  "food",
  "transport",
  "college",
  "tech",
  "shopping",
  "entertainment",
  "health",
  "gifts",
  "misc",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  /** Local calendar date, yyyy-MM-dd */
  date: string;
  /** Local time, HH:mm — captured automatically */
  time: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export type DebtType = "lent" | "borrowed";
export type DebtStatus = "pending" | "settled";

export interface Debt {
  id: string;
  person: string;
  amount: number;
  type: DebtType;
  reason?: string;
  /** Local calendar date, yyyy-MM-dd */
  date: string;
  /** Optional due date, yyyy-MM-dd */
  dueDate?: string;
  status: DebtStatus;
  createdAt: number;
  updatedAt: number;
}

export type Theme = "system" | "light" | "dark";

export interface Settings {
  theme: Theme;
  currency: string;
  lastCategory: Category;
}
