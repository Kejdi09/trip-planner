import { formatPlaceRegion } from './reviews-utils';
import { API_BASE_URL, APP_ENV } from './app-config';

export type DiscoverPlace = {
  id: string;
  title: string;
  city: string | null;
  country: string | null;
  countryCode: string | null;
  region: string;
  description: string | null;
  image: string;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
  source: string | null;
  visited: string;
  rating: number;
  reviewCount: number;
};

type SearchPlaceRow = {
  id: string;
  title?: string | null;
  city?: string | null;
  country?: string | null;
  countryCode?: string | null;
  continent?: string | null;
  description?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  population?: number | null;
  source?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
};

function toDiscoverPlace(row: SearchPlaceRow): DiscoverPlace {
  const image = row.imageUrl || row.image || '';
  const rating = Number(row.rating ?? 0);
  const reviewCount = Number(row.reviewCount ?? 0);
  return {
    id: row.id,
    title: row.title?.trim() || row.city?.trim() || 'Untitled destination',
    city: row.city?.trim() || null,
    country: row.country?.trim() || null,
    countryCode: row.countryCode?.trim() || null,
    region: formatPlaceRegion(row.city ?? null, row.country ?? null),
    description: row.description?.trim() || null,
    image,
    imageUrl: row.imageUrl?.trim() || row.image?.trim() || null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    population: row.population ?? null,
    source: row.source ?? null,
    visited: 'No friends visited yet',
    rating: Number.isFinite(rating) ? rating : 0,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
  };
}

export async function fetchDiscoverPlaces(params?: {
  query?: string;
  limit?: number;
  offset?: number;
  continent?: string | null;
  minPopulation?: number | null;
  sort?: 'relevance' | 'population' | 'name';
}): Promise<DiscoverPlace[]> {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const query = params?.query?.trim() ?? '';
  const limit = Number.isFinite(params?.limit) ? Math.max(1, Math.floor(params!.limit!)) : 20;
  const offset = Number.isFinite(params?.offset) ? Math.max(0, Math.floor(params!.offset!)) : 0;

  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (query) qs.set('q', query);
  if (params?.continent) qs.set('continent', params.continent);
  if (Number.isFinite(params?.minPopulation as number) && (params?.minPopulation as number) >= 0) qs.set('minPopulation', String(Math.floor(params!.minPopulation!)));
  if (params?.sort) qs.set('sort', params.sort);

  const response = await fetch(`${base}/reviews-api/places/search?${qs.toString()}`, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'x-app-env': APP_ENV,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    places?: SearchPlaceRow[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to load discover places.');
  }

  return (payload.places ?? []).map(toDiscoverPlace);
}
