import { averageRating, DEFAULT_PLACE_IMAGE, formatPlaceRegion } from './reviews-utils';
import { supabase } from './supabase';

export type DiscoverPlace = {
  id: string;
  title: string;
  region: string;
  visited: string;
  rating: number;
  image: string;
  country?: string | null;
};

type PlaceRow = {
  id: string;
  name: string | null;
  city: string | null;
  country: string | null;
  created_at: string | null;
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


export async function fetchDiscoverPlaces(): Promise<DiscoverPlace[]> {
  const { data, error } = await supabase
    .from('places')
    .select('id, name, city, country, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const placeRows = (data as PlaceRow[]) ?? [];
  if (placeRows.length === 0) return [];

  const placeIds = placeRows.map((place) => place.id).filter(Boolean);

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

  const summaries = placeRows.map((place) => {
    const placeReviews = reviewsByPlaceId[place.id] ?? [];
    const uniqueUsers = new Set(
      placeReviews.map((review) => review.user_id).filter(Boolean) as string[],
    );

    const rating = averageRating(placeReviews);
    const visitCount = uniqueUsers.size;

    return {
      id: place.id,
      title: place.name?.trim() || 'Untitled destination',
      region: formatPlaceRegion(place.city, place.country),
      visited: formatVisitedLabel(visitCount),
      rating,
      image: imageByPlaceId.get(place.id) ?? DEFAULT_PLACE_IMAGE,
      country: place.country?.trim() || null,
    };
  });

  return summaries.sort((a, b) => b.rating - a.rating);
}
