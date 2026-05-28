const express = require('express');
const { fetchPexelsImageForPlace, hasPexelsApiKey } = require('../lib/place-images');

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return UUID_REGEX.test(String(value || '').trim());
}

function parseLimit(value, fallback = 20, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(max, Math.floor(parsed));
}

function parseOffset(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function normalizePlaceRow(place) {
  return {
    id: place.id,
    title: place.name || place.city || 'Unknown place',
    city: place.city || null,
    country: place.country || null,
    countryCode: place.country_code || null,
    description: place.description || null,
    image: place.image_url || null,
    imageUrl: place.image_url || null,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    population: place.population ?? null,
    source: place.external_source || null,
  };
}

async function enrichPlacesWithImages(supabaseAdmin, rows, maxFetches = 5) {
  if (!hasPexelsApiKey || rows.length === 0) return rows;
  const result = [...rows];
  let fetches = 0;

  for (let index = 0; index < result.length; index += 1) {
    const place = result[index];
    if (place.image_url) continue;
    if (place.image_fetched_at) continue;
    if (fetches >= maxFetches) break;

    try {
      const imageData = await fetchPexelsImageForPlace(place);
      fetches += 1;
      if (!imageData?.image_url) continue;

      const { data: updated, error } = await supabaseAdmin
        .from('places')
        .update({
          image_url: imageData.image_url,
          image_source: imageData.image_source,
          image_author: imageData.image_author,
          image_author_url: imageData.image_author_url,
          image_fetched_at: new Date().toISOString(),
        })
        .eq('id', place.id)
        .select('id, image_url, image_source, image_author, image_author_url, image_fetched_at')
        .maybeSingle();

      if (error) continue;
      if (updated?.image_url) {
        result[index] = {
          ...place,
          image_url: updated.image_url,
          image_source: updated.image_source,
          image_author: updated.image_author,
          image_author_url: updated.image_author_url,
          image_fetched_at: updated.image_fetched_at,
        };
      }
    } catch {
      // Continue without failing endpoint.
    }
  }

  return result;
}

module.exports = function reviewsRoutes(supabaseAdmin) {
  const router = express.Router();

  async function createNotification(userId, type, title, body, relatedEntityType = null, relatedEntityId = null) {
    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('related_entity_type', relatedEntityType)
      .eq('related_entity_id', relatedEntityId)
      .limit(1);
    if ((existing || []).length > 0) return;
    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
      content: JSON.stringify({ title, body }),
    });
    if (error) console.error('Notification insert failed:', error.message);
  }


  router.get('/places', async (req, res, next) => {
    try {
      const limit = parseLimit(req.query.limit, 100, 300);
      const offset = Math.max(0, Number(req.query.offset) || 0);

      const { data, error } = await supabaseAdmin
        .from('places')
        .select('id, name, description, city, country, created_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        const wrapped = new Error(error.message || 'Failed to load places.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.json({ places: data || [] });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/places/search', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      const limit = parseLimit(req.query.limit, 20, 50);
      const offset = parseOffset(req.query.offset, 0);

      if (!q) {
        const { data, error } = await supabaseAdmin
          .from('places')
          .select('id, name, description, city, country, country_code, latitude, longitude, population, image_url, image_source, image_author, image_author_url, image_fetched_at, external_source')
          .eq('external_source', 'geonames')
          .order('population', { ascending: false, nullsFirst: false })
          .range(offset, offset + limit - 1);

        if (error) {
          console.error('[places/search] default query failed', error);
          return res.status(500).json({ error: 'Failed to search places.' });
        }

        const hydrated = await enrichPlacesWithImages(supabaseAdmin, data || []);
        return res.json({ places: hydrated.map(normalizePlaceRow) });
      }

      const qLower = q.toLowerCase();
      const escaped = q.replace(/[%_]/g, '\\$&');

      const { data, error } = await supabaseAdmin
        .from('places')
        .select('id, name, description, city, country, country_code, latitude, longitude, population, image_url, image_source, image_author, image_author_url, image_fetched_at, external_source, search_text')
        .eq('external_source', 'geonames')
        .or(
          `name.ilike.%${escaped}%,city.ilike.%${escaped}%,country.ilike.%${escaped}%,country_code.ilike.%${escaped}%,search_text.ilike.%${escaped}%`,
        )
        .limit(300);

      if (error) {
        console.error('[places/search] text query failed', { q, error });
        return res.status(500).json({ error: 'Failed to search places.' });
      }

      const ranked = (data || [])
        .map((row) => {
          const name = String(row.name || '').toLowerCase();
          const city = String(row.city || '').toLowerCase();
          const country = String(row.country || '').toLowerCase();
          const countryCode = String(row.country_code || '').toLowerCase();
          let score = 0;

          if (city === qLower || name === qLower) score += 200;
          if (city.startsWith(qLower) || name.startsWith(qLower)) score += 120;
          if (country === qLower || countryCode === qLower) score += 80;
          if (country.startsWith(qLower) || countryCode.startsWith(qLower)) score += 40;
          if (name.includes(qLower) || city.includes(qLower)) score += 20;
          score += Math.min(Number(row.population || 0) / 1_000_000, 30);

          return { row, score };
        })
        .sort((a, b) => b.score - a.score || Number(b.row.population || 0) - Number(a.row.population || 0));

      const pageRows = ranked.slice(offset, offset + limit).map((item) => item.row);
      const hydrated = await enrichPlacesWithImages(supabaseAdmin, pageRows);
      return res.json({ places: hydrated.map(normalizePlaceRow) });
    } catch (error) {
      console.error('[places/search] unexpected error', error);
      return res.status(500).json({ error: 'Failed to search places.' });
    }
  });

  router.get('/places/:placeId', async (req, res, next) => {
    try {
      const placeId = String(req.params.placeId || '').trim();
      if (!isValidUuid(placeId)) {
        return res.status(400).json({ error: 'placeId must be a valid UUID.' });
      }

      const { data, error } = await supabaseAdmin
        .from('places')
        .select('id, name, description, city, country, created_at')
        .eq('id', placeId)
        .maybeSingle();

      if (error) {
        const wrapped = new Error(error.message || 'Failed to load place.');
        wrapped.status = 502;
        throw wrapped;
      }

      if (!data) return res.status(404).json({ error: 'Place not found.' });
      return res.json(data);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/reviews', async (req, res, next) => {
    try {
      const placeId = String(req.query.placeId || '').trim();
      const userId = String(req.query.userId || '').trim();
      const sort = String(req.query.sort || 'newest').trim().toLowerCase();
      const limit = parseLimit(req.query.limit, 50, 200);
      const offset = Math.max(0, Number(req.query.offset) || 0);

      let query = supabaseAdmin
        .from('reviews')
        .select('id, user_id, place_id, rating, review, created_at')
        .range(offset, offset + limit - 1);

      if (placeId) {
        if (!isValidUuid(placeId)) {
          return res.status(400).json({ error: 'placeId must be a valid UUID.' });
        }
        query = query.eq('place_id', placeId);
      }

      if (userId) {
        if (!isValidUuid(userId)) {
          return res.status(400).json({ error: 'userId must be a valid UUID.' });
        }
        query = query.eq('user_id', userId);
      }

      if (sort === 'rating') {
        query = query.order('rating', { ascending: false }).order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) {
        const wrapped = new Error(error.message || 'Failed to load reviews.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.json({ reviews: data || [] });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/reviews/:reviewId/details', async (req, res, next) => {
    try {
      const reviewId = String(req.params.reviewId || '').trim();
      if (!isValidUuid(reviewId)) {
        return res.status(400).json({ error: 'reviewId must be a valid UUID.' });
      }

      const { data: review, error: reviewError } = await supabaseAdmin
        .from('reviews')
        .select('id, user_id, place_id, rating, review, created_at')
        .eq('id', reviewId)
        .maybeSingle();

      if (reviewError) {
        const wrapped = new Error(reviewError.message || 'Failed to load review.');
        wrapped.status = 502;
        throw wrapped;
      }
      if (!review) return res.status(404).json({ error: 'Review not found.' });

      const [profileRes, photosRes, reviewTagsRes] = await Promise.all([
        supabaseAdmin
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .eq('id', review.user_id)
          .maybeSingle(),
        supabaseAdmin
          .from('review_photos')
          .select('id, review_id, image_url')
          .eq('review_id', reviewId),
        supabaseAdmin
          .from('review_tags')
          .select('tag_id')
          .eq('review_id', reviewId),
      ]);

      if (profileRes.error || photosRes.error || reviewTagsRes.error) {
        const err = profileRes.error || photosRes.error || reviewTagsRes.error;
        const wrapped = new Error(err.message || 'Failed to load review details.');
        wrapped.status = 502;
        throw wrapped;
      }

      const tagIds = (reviewTagsRes.data || []).map((row) => row.tag_id).filter(Boolean);
      const tagsRes = tagIds.length
        ? await supabaseAdmin.from('tags').select('id, name').in('id', tagIds)
        : { data: [], error: null };

      if (tagsRes.error) {
        const wrapped = new Error(tagsRes.error.message || 'Failed to load tags.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.json({
        review,
        profile: profileRes.data || null,
        photos: photosRes.data || [],
        tags: tagsRes.data || [],
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/reviews', async (req, res, next) => {
    try {
      const userId = String(req.body?.userId || '').trim();
      const placeId = String(req.body?.placeId || '').trim();
      const rating = Number(req.body?.rating);
      const reviewText = String(req.body?.review || '').trim();
      const photoUrls = Array.isArray(req.body?.photoUrls) ? req.body.photoUrls : [];
      const tagNames = Array.isArray(req.body?.tagNames) ? req.body.tagNames : [];

      if (!isValidUuid(userId) || !isValidUuid(placeId)) {
        return res.status(400).json({ error: 'userId and placeId must be valid UUIDs.' });
      }
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'rating must be between 1 and 5.' });
      }

      const { data: review, error: insertError } = await supabaseAdmin
        .from('reviews')
        .insert({ user_id: userId, place_id: placeId, rating, review: reviewText })
        .select('id, user_id, place_id, rating, review, created_at')
        .single();

      if (insertError) {
        const wrapped = new Error(insertError.message || 'Failed to create review.');
        wrapped.status = 502;
        throw wrapped;
      }

      const cleanedPhotoUrls = photoUrls
        .map((url) => String(url || '').trim())
        .filter(Boolean);

      if (cleanedPhotoUrls.length > 0) {
        const { error: photoError } = await supabaseAdmin
          .from('review_photos')
          .insert(cleanedPhotoUrls.map((url) => ({ review_id: review.id, image_url: url })));

        if (photoError) {
          const wrapped = new Error(photoError.message || 'Failed to save review photos metadata.');
          wrapped.status = 502;
          throw wrapped;
        }
      }

      const normalizedTagNames = Array.from(
        new Set(
          tagNames
            .map((name) => String(name || '').replace(/^#/, '').trim().toLowerCase())
            .filter(Boolean),
        ),
      );

      if (normalizedTagNames.length > 0) {
        const { error: upsertError } = await supabaseAdmin
          .from('tags')
          .upsert(normalizedTagNames.map((name) => ({ name })), { onConflict: 'name' });

        if (upsertError) {
          const wrapped = new Error(upsertError.message || 'Failed to upsert tags.');
          wrapped.status = 502;
          throw wrapped;
        }

        const { data: tags, error: tagsError } = await supabaseAdmin
          .from('tags')
          .select('id, name')
          .in('name', normalizedTagNames);

        if (tagsError) {
          const wrapped = new Error(tagsError.message || 'Failed to load tag IDs.');
          wrapped.status = 502;
          throw wrapped;
        }

        const reviewTags = (tags || []).map((tag) => ({ review_id: review.id, tag_id: tag.id }));
        if (reviewTags.length > 0) {
          const { error: reviewTagsError } = await supabaseAdmin.from('review_tags').insert(reviewTags);
          if (reviewTagsError) {
            const wrapped = new Error(reviewTagsError.message || 'Failed to attach tags.');
            wrapped.status = 502;
            throw wrapped;
          }
        }
      }


      try {
        const [{ data: reviewerProfile }, { data: place }, { data: friendships }] = await Promise.all([
          supabaseAdmin.from('profiles').select('full_name, username').eq('id', userId).maybeSingle(),
          supabaseAdmin.from('places').select('name, city, country').eq('id', placeId).maybeSingle(),
          supabaseAdmin.from('friendships').select('requester_id, receiver_id').eq('status', 'accepted').or(`requester_id.eq.${userId},receiver_id.eq.${userId}`),
        ]);

        const reviewerName = reviewerProfile?.full_name || reviewerProfile?.username || 'Unknown user';
        const placeName = place?.name || [place?.city, place?.country].filter(Boolean).join(', ') || 'a place';

        const recipients = new Set();
        for (const row of friendships || []) {
          const other = row.requester_id === userId ? row.receiver_id : row.requester_id;
          if (other && other !== userId) recipients.add(other);
        }

        for (const recipientId of recipients) {
          await createNotification(recipientId, 'review', `New review from ${reviewerName}`, `${reviewerName} reviewed ${placeName}`, 'review', review.id);
        }
      } catch (notifyError) {
        console.error('Review notification fanout failed:', notifyError?.message || notifyError);
      }

      return res.status(201).json(review);
    } catch (error) {
      return next(error);
    }
  });

  router.patch('/reviews/:reviewId', async (req, res, next) => {
    try {
      const reviewId = String(req.params.reviewId || '').trim();
      const userId = String(req.body?.userId || '').trim();
      if (!isValidUuid(reviewId) || !isValidUuid(userId)) {
        return res.status(400).json({ error: 'reviewId and userId must be valid UUIDs.' });
      }

      const { data: existing, error: existingError } = await supabaseAdmin
        .from('reviews')
        .select('id, user_id')
        .eq('id', reviewId)
        .maybeSingle();

      if (existingError) {
        const wrapped = new Error(existingError.message || 'Failed to load existing review.');
        wrapped.status = 502;
        throw wrapped;
      }
      if (!existing) return res.status(404).json({ error: 'Review not found.' });
      if (existing.user_id !== userId) return res.status(403).json({ error: 'Only review owner can update.' });

      const patch = {};
      if (typeof req.body?.review === 'string') patch.review = req.body.review.trim();
      if (req.body?.rating !== undefined) {
        const rating = Number(req.body.rating);
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
          return res.status(400).json({ error: 'rating must be between 1 and 5.' });
        }
        patch.rating = rating;
      }

      const { data, error } = await supabaseAdmin
        .from('reviews')
        .update(patch)
        .eq('id', reviewId)
        .select('id, user_id, place_id, rating, review, created_at')
        .single();

      if (error) {
        const wrapped = new Error(error.message || 'Failed to update review.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.json(data);
    } catch (error) {
      return next(error);
    }
  });

  router.delete('/reviews/:reviewId', async (req, res, next) => {
    try {
      const reviewId = String(req.params.reviewId || '').trim();
      const userId = String(req.query.userId || req.body?.userId || '').trim();
      if (!isValidUuid(reviewId) || !isValidUuid(userId)) {
        return res.status(400).json({ error: 'reviewId and userId must be valid UUIDs.' });
      }

      const { data: existing, error: existingError } = await supabaseAdmin
        .from('reviews')
        .select('id, user_id')
        .eq('id', reviewId)
        .maybeSingle();

      if (existingError) {
        const wrapped = new Error(existingError.message || 'Failed to load existing review.');
        wrapped.status = 502;
        throw wrapped;
      }
      if (!existing) return res.status(404).json({ error: 'Review not found.' });
      if (existing.user_id !== userId) return res.status(403).json({ error: 'Only review owner can delete.' });

      const { error } = await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        const wrapped = new Error(error.message || 'Failed to delete review.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  router.post('/reviews/:reviewId/tags', async (req, res, next) => {
    try {
      const reviewId = String(req.params.reviewId || '').trim();
      const userId = String(req.body?.userId || '').trim();
      const tagNames = Array.isArray(req.body?.tagNames) ? req.body.tagNames : [];

      if (!isValidUuid(reviewId) || !isValidUuid(userId)) {
        return res.status(400).json({ error: 'reviewId and userId must be valid UUIDs.' });
      }

      const { data: review, error: reviewError } = await supabaseAdmin
        .from('reviews')
        .select('id, user_id')
        .eq('id', reviewId)
        .maybeSingle();

      if (reviewError) {
        const wrapped = new Error(reviewError.message || 'Failed to load review.');
        wrapped.status = 502;
        throw wrapped;
      }
      if (!review) return res.status(404).json({ error: 'Review not found.' });
      if (review.user_id !== userId) return res.status(403).json({ error: 'Only review owner can modify tags.' });

      const normalized = Array.from(new Set(tagNames.map((tag) => String(tag || '').replace(/^#/, '').trim().toLowerCase()).filter(Boolean)));
      if (normalized.length === 0) return res.status(200).json({ tags: [] });

      const { error: upsertError } = await supabaseAdmin
        .from('tags')
        .upsert(normalized.map((name) => ({ name })), { onConflict: 'name' });

      if (upsertError) {
        const wrapped = new Error(upsertError.message || 'Failed to upsert tags.');
        wrapped.status = 502;
        throw wrapped;
      }

      const { data: tags, error: tagsError } = await supabaseAdmin.from('tags').select('id, name').in('name', normalized);
      if (tagsError) {
        const wrapped = new Error(tagsError.message || 'Failed to load tags.');
        wrapped.status = 502;
        throw wrapped;
      }

      const links = (tags || []).map((tag) => ({ review_id: reviewId, tag_id: tag.id }));
      if (links.length > 0) {
        const { error: linkError } = await supabaseAdmin
          .from('review_tags')
          .upsert(links, { onConflict: 'review_id,tag_id' });

        if (linkError) {
          const wrapped = new Error(linkError.message || 'Failed to attach tags.');
          wrapped.status = 502;
          throw wrapped;
        }
      }

      return res.status(200).json({ tags: tags || [] });
    } catch (error) {
      return next(error);
    }
  });

  router.delete('/reviews/:reviewId/tags/:tagId', async (req, res, next) => {
    try {
      const reviewId = String(req.params.reviewId || '').trim();
      const tagId = String(req.params.tagId || '').trim();
      const userId = String(req.query.userId || req.body?.userId || '').trim();

      if (!isValidUuid(reviewId) || !isValidUuid(tagId) || !isValidUuid(userId)) {
        return res.status(400).json({ error: 'reviewId, tagId, and userId must be valid UUIDs.' });
      }

      const { data: review, error: reviewError } = await supabaseAdmin
        .from('reviews')
        .select('id, user_id')
        .eq('id', reviewId)
        .maybeSingle();

      if (reviewError) {
        const wrapped = new Error(reviewError.message || 'Failed to load review.');
        wrapped.status = 502;
        throw wrapped;
      }
      if (!review) return res.status(404).json({ error: 'Review not found.' });
      if (review.user_id !== userId) return res.status(403).json({ error: 'Only review owner can remove tags.' });

      const { data, error } = await supabaseAdmin
        .from('review_tags')
        .delete()
        .eq('review_id', reviewId)
        .eq('tag_id', tagId)
        .select('id');

      if (error) {
        const wrapped = new Error(error.message || 'Failed to remove tag.');
        wrapped.status = 502;
        throw wrapped;
      }

      if (!data || data.length === 0) return res.status(404).json({ error: 'Review tag link not found.' });
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  router.post('/reviews/:reviewId/photos', async (req, res, next) => {
    try {
      const reviewId = String(req.params.reviewId || '').trim();
      const userId = String(req.body?.userId || '').trim();
      const imageUrl = String(req.body?.imageUrl || '').trim();

      if (!isValidUuid(reviewId) || !isValidUuid(userId)) {
        return res.status(400).json({ error: 'reviewId and userId must be valid UUIDs.' });
      }
      if (!imageUrl) {
        return res.status(400).json({ error: 'imageUrl is required.' });
      }

      const { data: review, error: reviewError } = await supabaseAdmin
        .from('reviews')
        .select('id, user_id')
        .eq('id', reviewId)
        .maybeSingle();

      if (reviewError) {
        const wrapped = new Error(reviewError.message || 'Failed to load review.');
        wrapped.status = 502;
        throw wrapped;
      }
      if (!review) return res.status(404).json({ error: 'Review not found.' });
      if (review.user_id !== userId) return res.status(403).json({ error: 'Only review owner can add photos.' });

      const { data, error } = await supabaseAdmin
        .from('review_photos')
        .insert({ review_id: reviewId, image_url: imageUrl })
        .select('id, review_id, image_url')
        .single();

      if (error) {
        const wrapped = new Error(error.message || 'Failed to add photo metadata.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.status(201).json(data);
    } catch (error) {
      return next(error);
    }
  });

  router.delete('/reviews/:reviewId/photos/:photoId', async (req, res, next) => {
    try {
      const reviewId = String(req.params.reviewId || '').trim();
      const photoId = String(req.params.photoId || '').trim();
      const userId = String(req.query.userId || req.body?.userId || '').trim();

      if (!isValidUuid(reviewId) || !isValidUuid(photoId) || !isValidUuid(userId)) {
        return res.status(400).json({ error: 'reviewId, photoId, and userId must be valid UUIDs.' });
      }

      const { data: review, error: reviewError } = await supabaseAdmin
        .from('reviews')
        .select('id, user_id')
        .eq('id', reviewId)
        .maybeSingle();

      if (reviewError) {
        const wrapped = new Error(reviewError.message || 'Failed to load review.');
        wrapped.status = 502;
        throw wrapped;
      }
      if (!review) return res.status(404).json({ error: 'Review not found.' });
      if (review.user_id !== userId) return res.status(403).json({ error: 'Only review owner can remove photos.' });

      const { data, error } = await supabaseAdmin
        .from('review_photos')
        .delete()
        .eq('id', photoId)
        .eq('review_id', reviewId)
        .select('id');

      if (error) {
        const wrapped = new Error(error.message || 'Failed to remove photo metadata.');
        wrapped.status = 502;
        throw wrapped;
      }

      if (!data || data.length === 0) return res.status(404).json({ error: 'Review photo not found.' });
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  return router;
};
