const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value: string): Date | null {
  if (!DATE_ONLY_RE.test(String(value || ''))) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function addDaysToDateOnly(value: string, days: number): string | null {
  const date = parseDateOnly(value);
  if (!date) return null;
  date.setDate(date.getDate() + days);
  return formatDateOnly(date);
}

export function dateOnlyDiff(startDate: string, endDate: string): number | null {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

export function startOfTodayDateOnly(): string {
  return formatDateOnly(new Date());
}

export function compareDateOnly(a: string, b: string): number | null {
  if (!parseDateOnly(a) || !parseDateOnly(b)) return null;
  return a.localeCompare(b);
}

export function isBeforeDateOnly(a: string, b: string): boolean {
  const cmp = compareDateOnly(a, b);
  return cmp !== null && cmp < 0;
}

export function isAfterDateOnly(a: string, b: string): boolean {
  const cmp = compareDateOnly(a, b);
  return cmp !== null && cmp > 0;
}
