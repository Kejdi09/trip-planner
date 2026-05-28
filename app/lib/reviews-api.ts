import { decode as decodeBase64 } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { API_BASE_URL, APP_ENV, REVIEW_PHOTO_BUCKET, USE_REVIEWS_BACKEND } from './app-config';
import { supabase } from './supabase';

type SelectResult<T> = T | null;

type PlaceRecord = {
  id: string;
  name: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  image_url?: string | null;
  image_source?: string | null;
  image_author?: string | null;
  image_author_url?: string | null;
  image_fetched_at?: string | null;
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
  if (USE_REVIEWS_BACKEND) {
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const response = await fetch(`${base}/reviews-api/places/${encodeURIComponent(placeId)}`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'x-app-env': APP_ENV,
      },
    });
    if (response.status === 404) return null;
    const payload = (await response.json().catch(() => ({}))) as PlaceRecord & { error?: string };
    if (!response.ok) throw new Error(payload.error ?? 'Failed to load place.');
    return payload as PlaceRecord;
  }

  const { data, error } = await supabase
    .from('places')
    .select('id, name, description, city, country, image_url, image_source, image_author, image_author_url, image_fetched_at, created_at')
    .eq('id', placeId)
    .maybeSingle();

  if (error) throw error;
  return data as SelectResult<PlaceRecord>;
}

export async function fetchFirstPlace(): Promise<PlaceRecord | null> {
  if (USE_REVIEWS_BACKEND) {
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const response = await fetch(`${base}/reviews-api/places?limit=1`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'x-app-env': APP_ENV,
      },
    });
    const payload = (await response.json().catch(() => ({}))) as { places?: PlaceRecord[]; error?: string };
    if (!response.ok) throw new Error(payload.error ?? 'Failed to load places.');
    return payload.places?.[0] ?? null;
  }

  const { data, error } = await supabase
    .from('places')
    .select('id, name, description, city, country, image_url, image_source, image_author, image_author_url, image_fetched_at, created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data?.[0] as SelectResult<PlaceRecord>) ?? null;
}

export async function fetchReviewsByPlace(placeId: string): Promise<ReviewRecord[]> {
  if (USE_REVIEWS_BACKEND) {
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const response = await fetch(`${base}/reviews-api/reviews?placeId=${encodeURIComponent(placeId)}&limit=300`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'x-app-env': APP_ENV,
      },
    });
    const payload = (await response.json().catch(() => ({}))) as { reviews?: ReviewRecord[]; error?: string };
    if (!response.ok) throw new Error(payload.error ?? 'Failed to load reviews.');
    return payload.reviews ?? [];
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('id, user_id, place_id, rating, review, created_at')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ReviewRecord[]) ?? [];
}

export async function fetchReviewsByUser(userId: string): Promise<ReviewRecord[]> {
  if (USE_REVIEWS_BACKEND) {
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const response = await fetch(`${base}/reviews-api/reviews?userId=${encodeURIComponent(userId)}&limit=300`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'x-app-env': APP_ENV,
      },
    });
    const payload = (await response.json().catch(() => ({}))) as { reviews?: ReviewRecord[]; error?: string };
    if (!response.ok) throw new Error(payload.error ?? 'Failed to load reviews.');
    return payload.reviews ?? [];
  }

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

export async function deleteReviewById(reviewId: string): Promise<void> {
  const { error: photoError } = await supabase
    .from('review_photos')
    .delete()
    .eq('review_id', reviewId);

  if (photoError) throw photoError;

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
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

export async function fetchTagNamesByReviewIds(
  reviewIds: string[],
): Promise<Record<string, string[]>> {
  if (reviewIds.length === 0) return {};

  const { data: tagLinks, error: tagLinkError } = await supabase
    .from('review_tags')
    .select('review_id, tag_id')
    .in('review_id', reviewIds);

  if (tagLinkError) throw tagLinkError;

  const links = (tagLinks ?? []).filter((row) => row.review_id && row.tag_id) as {
    review_id: string;
    tag_id: string;
  }[];

  if (links.length === 0) return {};

  const tagIds = Array.from(new Set(links.map((row) => row.tag_id)));

  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('id, name')
    .in('id', tagIds);

  if (tagsError) throw tagsError;

  const tagMap = (tags ?? []).reduce<Record<string, string>>((acc, tag) => {
    if (tag.id && tag.name) {
      acc[tag.id] = tag.name;
    }
    return acc;
  }, {});

  return links.reduce<Record<string, string[]>>((acc, link) => {
    const name = tagMap[link.tag_id];
    if (!name) return acc;
    const label = `#${name}`;
    const existing = acc[link.review_id] ?? [];
    if (!existing.includes(label)) {
      acc[link.review_id] = [...existing, label];
    }
    return acc;
  }, {});
}

type CreateReviewInput = {
  userId: string;
  placeId: string;
  rating: number;
  review: string;
  tagNames?: string[];
  photoUris?: string[];
};

const getFileExtension = (uri: string): string => {
  const cleanUri = uri.split('?')[0] ?? uri;
  const extension = cleanUri.split('.').pop();
  return extension && extension.length <= 5 ? extension.toLowerCase() : 'jpg';
};

const getContentType = (extension: string): string => {
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
};

async function uploadReviewPhotos(
  reviewId: string,
  userId: string,
  photoUris: string[],
): Promise<string[]> {
  if (photoUris.length === 0) return [];

  const uploadedUrls: string[] = [];

  for (let index = 0; index < photoUris.length; index += 1) {
    const uri = photoUris[index];
    const extension = getFileExtension(uri);
    const fileName = `${Date.now()}-${index}.${extension}`;
    const filePath = `${userId}/${reviewId}/${fileName}`;

    // Use FileSystem for Android content:// URIs to avoid fetch failures.
    const fileBase64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const fileBuffer = decodeBase64(fileBase64);

    const { error: uploadError } = await supabase.storage
      .from(REVIEW_PHOTO_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: getContentType(extension),
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage
      .from(REVIEW_PHOTO_BUCKET)
      .getPublicUrl(filePath);

    if (!publicData?.publicUrl) {
      throw new Error('Unable to resolve uploaded photo URL.');
    }

    uploadedUrls.push(publicData.publicUrl);
  }

  return uploadedUrls;
}

export async function createReviewWithTags({
  userId,
  placeId,
  rating,
  review,
  tagNames = [],
  photoUris = [],
}: CreateReviewInput): Promise<string> {
  if (USE_REVIEWS_BACKEND) {
    const uploadedUrls = await uploadReviewPhotos('temp-review', userId, photoUris);
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const response = await fetch(`${base}/reviews-api/reviews`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-app-env': APP_ENV,
      },
      body: JSON.stringify({ userId, placeId, rating, review, tagNames, photoUrls: uploadedUrls }),
    });

    const payload = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!response.ok) throw new Error(payload.error ?? 'Failed to create review.');
    if (!payload.id) throw new Error('Review creation did not return an id.');
    return payload.id;
  }

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

  if (photoUris.length > 0) {
    const uploadedUrls = await uploadReviewPhotos(reviewId, userId, photoUris);
    if (uploadedUrls.length > 0) {
      const { error: photoInsertError } = await supabase
        .from('review_photos')
        .insert(
          uploadedUrls.map((url) => ({
            review_id: reviewId,
            image_url: url,
          })),
        );

      if (photoInsertError) throw photoInsertError;
    }
  }

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

  const tagUpserts = normalizedNames.map((name) => ({ name }));
  const { error: upsertError } = await supabase
    .from('tags')
    .upsert(tagUpserts, { onConflict: 'name' });

  if (upsertError) throw upsertError;

  const { data: tagRows, error: tagError } = await supabase
    .from('tags')
    .select('id, name')
    .in('name', normalizedNames);

  if (tagError) throw tagError;

  const tagIds = (tagRows ?? [])
    .map((row) => row.id)
    .filter(Boolean) as string[];

  if (tagIds.length === 0) return reviewId;

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
