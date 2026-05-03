import { supabase } from './supabase';

type SelectResult<T> = T | null;

type PlaceRecord = {
  id: string;
  name: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  created_at: string | null;
};

type ReviewRecord = {
  id: string;
  user_id: string | null;
  place_id: string | null;
  rating: number | null;
  review: string | null;
  created_at: string | null;
};

type ProfileRecord = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type ReviewPhotoRecord = {
  id: string;
  review_id: string | null;
  image_url: string | null;
};

type TagRecord = {
  id: string;
  name: string | null;
};

export type { PlaceRecord, ReviewRecord, ProfileRecord, ReviewPhotoRecord, TagRecord };

export async function fetchPlaceById(placeId: string): Promise<PlaceRecord | null> {
  const { data, error } = await supabase
    .from('places')
    .select('id, name, description, city, country, created_at')
    .eq('id', placeId)
    .maybeSingle();

  if (error) throw error;
  return data as SelectResult<PlaceRecord>;
}

export async function fetchFirstPlace(): Promise<PlaceRecord | null> {
  const { data, error } = await supabase
    .from('places')
    .select('id, name, description, city, country, created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data?.[0] as SelectResult<PlaceRecord>) ?? null;
}

export async function fetchReviewsByPlace(placeId: string): Promise<ReviewRecord[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, user_id, place_id, rating, review, created_at')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ReviewRecord[]) ?? [];
}

export async function fetchReviewsByUser(userId: string): Promise<ReviewRecord[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, user_id, place_id, rating, review, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ReviewRecord[]) ?? [];
}

export async function fetchProfilesByIds(userIds: string[]): Promise<ProfileRecord[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .in('id', userIds);

  if (error) throw error;
  return (data as ProfileRecord[]) ?? [];
}

export async function fetchPlacesByIds(placeIds: string[]): Promise<PlaceRecord[]> {
  if (placeIds.length === 0) return [];
  const { data, error } = await supabase
    .from('places')
    .select('id, name, description, city, country, created_at')
    .in('id', placeIds);

  if (error) throw error;
  return (data as PlaceRecord[]) ?? [];
}

export async function fetchReviewPhotosByReviewIds(reviewIds: string[]): Promise<ReviewPhotoRecord[]> {
  if (reviewIds.length === 0) return [];
  const { data, error } = await supabase
    .from('review_photos')
    .select('id, review_id, image_url')
    .in('review_id', reviewIds);

  if (error) throw error;
  return (data as ReviewPhotoRecord[]) ?? [];
}

export async function fetchTagsByReviewIds(reviewIds: string[]): Promise<TagRecord[]> {
  if (reviewIds.length === 0) return [];

  const { data: tagLinks, error: tagLinkError } = await supabase
    .from('review_tags')
    .select('tag_id')
    .in('review_id', reviewIds);

  if (tagLinkError) throw tagLinkError;
  const tagIds = (tagLinks ?? []).map((row) => row.tag_id).filter(Boolean) as string[];
  if (tagIds.length === 0) return [];

  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('id, name')
    .in('id', tagIds);

  if (tagsError) throw tagsError;
  return (tags as TagRecord[]) ?? [];
}

type CreateReviewInput = {
  userId: string;
  placeId: string;
  rating: number;
  review: string;
  tagNames?: string[];
};

export async function createReviewWithTags({
  userId,
  placeId,
  rating,
  review,
  tagNames = [],
}: CreateReviewInput): Promise<string> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      user_id: userId,
      place_id: placeId,
      rating,
      review,
    })
    .select('id')
    .single();

  if (error) throw error;
  const reviewId = data.id as string;

  const normalizedNames = Array.from(
    new Set(
      tagNames
        .map((tag) => tag.replace(/^#/, '').trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  if (normalizedNames.length === 0) {
    return reviewId;
  }

  const { data: tagRows, error: tagError } = await supabase
    .from('tags')
    .select('id, name')
    .in('name', normalizedNames);

  if (tagError) throw tagError;

  const tagIds = (tagRows ?? [])
    .map((row) => row.id)
    .filter(Boolean) as string[];

  if (tagIds.length === 0) {
    return reviewId;
  }

  const reviewTagRows = tagIds.map((tagId) => ({
    review_id: reviewId,
    tag_id: tagId,
  }));

  const { error: reviewTagError } = await supabase
    .from('review_tags')
    .insert(reviewTagRows);

  if (reviewTagError) throw reviewTagError;

  return reviewId;
}
