export const DEFAULT_PLACE_IMAGE =
  'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80';

export function formatPlaceRegion(city?: string | null, country?: string | null): string {
  const parts = [city, country].filter((value) => Boolean(value && String(value).trim().length > 0));
  return parts.length > 0 ? parts.join(', ') : 'Unknown region';
}

export function formatRelativeTime(isoDate?: string | null): string {
  if (!isoDate) return '';
  const normalized = isoDate.replace(/(\.\d{3})\d+/, '$1');
  const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(normalized);
  const date = new Date(hasTimezone ? normalized : `${normalized}Z`);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  const diffYr = Math.floor(diffMo / 12);
  return `${diffYr}y ago`;
}

export function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const cleaned = name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
  if (!cleaned) return 'U';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  const initials = `${first}${last}`.toUpperCase();
  return initials.slice(0, 2) || 'U';
}

export function averageRating(items: Array<{ rating?: number | null }>): number {
  const ratings = items
    .map((item) => (typeof item.rating === 'number' ? item.rating : null))
    .filter((value): value is number => value !== null);

  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((total, value) => total + value, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}
