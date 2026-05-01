export const CATEGORIES = [
  "Meal",
  "Groceries",
  "Snacks",
  "Transport",
  "Entertainment",
] as const;

export const RANGE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "Last 1 Day", value: "1d" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
] as const;

export type Category = (typeof CATEGORIES)[number];
export type RangeValue = (typeof RANGE_OPTIONS)[number]["value"];

export const SESSION_STORAGE_KEY = "couple-tracker-session";
