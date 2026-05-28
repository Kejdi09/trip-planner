import { API_BASE_URL, APP_ENV } from './app-config';
import type { DiscoverPlace } from './discover-api';
import { averageRating, DEFAULT_PLACE_IMAGE, formatPlaceRegion } from './reviews-utils';
import { supabase } from './supabase';

type PlaceRow = {
  id: string;
  name: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  image_url: string | null;
  imageUrl?: string | null;
  created_at: string | null;
};

type WishlistEntry = {
  id: string;
  user_id: string | null;
  place_id: string | null;
  created_at: string | null;
  places?: PlaceRow | PlaceRow[] | null;
};

type WishlistPayload = {
  items?: WishlistEntry[];
  error?: string;
};

type ErrorPayload = {
  error?: string;
};

type ReviewRow = {
  id: string;
  place_id: string | null;
  user_id: string | null;
  rating: number | null;
};

type ReviewPhotoRow = {
  review_id: string | null;
  image_url: string | null;
};

const formatVisitedLabel = (count: number) => {
  if (count <= 0) return 'No friends visited yet';
  if (count === 1) return '1 friend visited';
  return `${count} friends visited`;
};

const getApiBaseUrl = () =>
  API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

const resolvePlaceRow = (entry: WishlistEntry): PlaceRow | null => {
  const placeData = entry.places;
  if (!placeData) return null;
  if (Array.isArray(placeData)) {
    return placeData[0] ?? null;
  }
  return placeData;
};

export async function fetchWishlistEntries(
  userId: string,
  includePlace = false,
): Promise<WishlistEntry[]> {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams({ userId });
  if (includePlace) params.set('includePlace', 'true');
  const url = `${baseUrl}/wishlists?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'x-app-env': APP_ENV,
    },
  });

  let payload: WishlistPayload = {};
  try {
    payload = (await response.json()) as WishlistPayload;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error ?? 'Unable to load wishlist right now.');
  }

  return payload.items ?? [];
}

export async function fetchWishlistPlaceIds(userId: string): Promise<string[]> {
  const entries = await fetchWishlistEntries(userId, false);
  return entries
    .map((entry) => entry.place_id)
    .filter((placeId): placeId is string => Boolean(placeId));
}

export async function addWishlistPlace(userId: string, placeId: string): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/wishlists`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-app-env': APP_ENV,
    },
    body: JSON.stringify({ userId, placeId }),
  });

  let payload: ErrorPayload = {};
  try {
    payload = (await response.json()) as ErrorPayload;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error ?? 'Unable to save this place right now.');
  }
}

export async function removeWishlistPlace(userId: string, placeId: string): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams({ userId, placeId });
  const url = `${baseUrl}/wishlists?${params.toString()}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
      'x-app-env': APP_ENV,
    },
  });

  let payload: ErrorPayload = {};
  try {
    payload = (await response.json()) as ErrorPayload;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error ?? 'Unable to remove this place right now.');
  }
}

export async function fetchWishlistPlaces(userId: string): Promise<DiscoverPlace[]> {
  const entries = await fetchWishlistEntries(userId, true);
  const placeRows = entries
    .map((entry) => resolvePlaceRow(entry))
    .filter((place): place is PlaceRow => Boolean(place));

  if (placeRows.length === 0) return [];

  const placeIds = Array.from(
    new Set(placeRows.map((place) => place.id).filter(Boolean)),
  );

  if (placeIds.length === 0) return [];

  const { data: reviewData, error: reviewError } = await supabase
    .from('reviews')
    .select('id, place_id, user_id, rating')
    .in('place_id', placeIds);

  if (reviewError) throw reviewError;

  const reviewRows = (reviewData as ReviewRow[]) ?? [];
  const reviewIds = reviewRows.map((review) => review.id).filter(Boolean);

  let photoRows: ReviewPhotoRow[] = [];

  if (reviewIds.length > 0) {
    const { data: photoData, error: photoError } = await supabase
      .from('review_photos')
      .select('review_id, image_url')
      .in('review_id', reviewIds);

    if (photoError) throw photoError;
    photoRows = (photoData as ReviewPhotoRow[]) ?? [];
  }

  const reviewsByPlaceId = reviewRows.reduce<Record<string, ReviewRow[]>>((acc, review) => {
    if (!review.place_id) return acc;
    if (!acc[review.place_id]) {
      acc[review.place_id] = [];
    }
    acc[review.place_id].push(review);
    return acc;
  }, {});

  const reviewIdToPlaceId = new Map<string, string>();
  for (const review of reviewRows) {
    if (review.id && review.place_id) {
      reviewIdToPlaceId.set(review.id, review.place_id);
    }
  }

  const imageByPlaceId = new Map<string, string>();
  for (const photo of photoRows) {
    const placeId = photo.review_id ? reviewIdToPlaceId.get(photo.review_id) : undefined;
    if (placeId && photo.image_url && !imageByPlaceId.has(placeId)) {
      imageByPlaceId.set(placeId, photo.image_url);
    }
  }

  return placeRows.map((place) => {
    const placeReviews = reviewsByPlaceId[place.id] ?? [];
    const uniqueUsers = new Set(
      placeReviews.map((review) => review.user_id).filter(Boolean) as string[],
    );

    return {
      id: place.id,
      title: place.name?.trim() || 'Untitled destination',
      region: formatPlaceRegion(place.city, place.country),
      country: place.country?.trim() || null,
      visited: formatVisitedLabel(uniqueUsers.size),
      rating: averageRating(placeReviews),
      image: place.image_url?.trim() || place.imageUrl?.trim() || imageByPlaceId.get(place.id) || DEFAULT_PLACE_IMAGE,
    };
  });
}
