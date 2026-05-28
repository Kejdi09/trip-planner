const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDateOnly(value) {
  if (!DATE_ONLY_RE.test(String(value || ''))) return false;
  const [year, month, day] = String(value).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function todayDateOnly() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function compareDateOnly(a, b) {
  if (!isDateOnly(a) || !isDateOnly(b)) return null;
  return String(a).localeCompare(String(b));
}

function parseDateOnlyUtc(value) {
  if (!isDateOnly(value)) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDaysToDateOnly(value, days) {
  const date = parseDateOnlyUtc(value);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysInclusive(startDate, endDate) {
  const start = parseDateOnlyUtc(startDate);
  const end = parseDateOnlyUtc(endDate);
  if (!start || !end) return null;
  const diff = end.getTime() - start.getTime();
  return diff >= 0 ? Math.floor(diff / 86400000) + 1 : null;
}

function dateOnlyDiff(startDate, endDate) {
  const start = parseDateOnlyUtc(startDate);
  const end = parseDateOnlyUtc(endDate);
  if (!start || !end) return null;
  return Math.floor((end.getTime() - start.getTime()) / 86400000);
}

function validateFutureDateRange(startDate, endDate, { allowToday = true } = {}) {
  if (!isDateOnly(startDate) || !isDateOnly(endDate)) {
    return { ok: false, error: 'Dates must use YYYY-MM-DD format.' };
  }
  if (compareDateOnly(startDate, endDate) > 0) {
    return { ok: false, error: 'startDate must be before or equal to endDate.' };
  }
  const today = todayDateOnly();
  const cmpToday = compareDateOnly(startDate, today);
  if (cmpToday < 0 || (!allowToday && cmpToday === 0)) {
    return { ok: false, error: 'Trip dates cannot be before today.' };
  }
  return { ok: true };
}

module.exports = {
  addDaysToDateOnly,
  compareDateOnly,
  dateOnlyDiff,
  daysInclusive,
  isDateOnly,
  todayDateOnly,
  validateFutureDateRange,
};
