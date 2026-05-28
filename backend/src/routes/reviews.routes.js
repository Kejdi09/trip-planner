const express = require('express');
const { fetchPexelsImageForPlace, hasPexelsApiKey } = require('../lib/place-images');
const { deepseekApiKey } = require('../config');
const { callDeepSeekChat } = require('../services/deepseek');


const CONTINENT_COUNTRY_CODES = {
  AF: new Set(['DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','YT','MA','MZ','NA','NE','NG','RE','RW','SH','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','EH','ZM','ZW']),
  AS: new Set(['AF','AM','AZ','BH','BD','BT','BN','KH','CN','CY','GE','HK','IN','ID','IR','IQ','IL','JP','JO','KZ','KW','KG','LA','LB','MO','MY','MV','MN','MM','NP','KP','OM','PK','PS','PH','QA','SA','SG','KR','LK','SY','TW','TJ','TH','TL','TR','TM','AE','UZ','VN','YE']),
  EU: new Set(['AX','AL','AD','AT','BY','BE','BA','BG','HR','CZ','DK','EE','FO','FI','FR','DE','GI','GR','GG','VA','HU','IS','IE','IM','IT','JE','XK','LV','LI','LT','LU','MT','MD','MC','ME','NL','MK','NO','PL','PT','RO','RU','SM','RS','SK','SI','ES','SJ','SE','CH','UA','GB']),
  NA: new Set(['AI','AG','AW','BS','BB','BZ','BM','BQ','VG','CA','KY','CR','CU','CW','DM','DO','SV','GL','GD','GP','GT','HT','HN','JM','MQ','MX','MS','NI','PA','PR','BL','KN','LC','MF','PM','VC','SX','TT','TC','US','VI']),
  SA: new Set(['AR','BO','BR','CL','CO','EC','FK','GF','GY','PY','PE','SR','UY','VE']),
  OC: new Set(['AS','AU','CK','FJ','PF','GU','KI','MH','FM','NR','NC','NZ','NU','NF','MP','PW','PG','PN','WS','SB','TK','TO','TV','UM','VU','WF']),
  AN: new Set(['AQ','BV','TF','HM','GS']),
};

function parseContinent(value) {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized) return null;
  return CONTINENT_COUNTRY_CODES[normalized] ? normalized : null;
}

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

function parseSort(value, hasQuery) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'name' || normalized === 'population' || normalized === 'relevance') return normalized;
  return hasQuery ? 'relevance' : 'population';
}

function normalizePlaceRow(place) {
  const description = isValidPlaceDescription(place.description, place) ? place.description : null;
  return {
    id: place.id,
    title: place.name || place.city || 'Unknown place',
    city: place.city || null,
    country: place.country || null,
    countryCode: place.country_code || null,
    description,
    image: place.image_url || null,
    imageUrl: place.image_url || null,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    population: place.population ?? null,
    source: place.external_source || null,
  };
}

function isValidPlaceDescription(text, place) {
  const normalized = String(text || '').trim();
  if (!normalized) return false;
  if (!/[.!?]$/.test(normalized)) return false;
  if (/[*#`_]/.test(normalized)) return false;
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length < 25 || words.length > 90) return false;
  const lowered = normalized.toLowerCase();
  const sentenceParts = normalized.match(/[^.!?]+[.!?]+/g) || [];
  if (sentenceParts.length < 2 || sentenceParts.length > 4) return false;
  const badEndings = [
    'offering visitors', 'offering', 'featuring', 'including', 'with', 'known for', 'home to',
    'and', 'or', 'to', 'for',
  ];
  if (badEndings.some((ending) => lowered.endsWith(ending) || lowered.endsWith(`${ending}.`))) return false;
  const city = String(place.city || place.name || '').trim().toLowerCase();
  const country = String(place.country || '').trim().toLowerCase();
  if (city && !lowered.includes(city)) return false;
  if (country && words.length < 40 && !lowered.includes(country)) return false;
  return true;
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
      const imageCandidates = await fetchPexelsImageForPlace(place);
      fetches += 1;
      if (!Array.isArray(imageCandidates) || imageCandidates.length === 0) continue;

      let chosen = null;
      for (const candidate of imageCandidates) {
        if (!candidate?.image_url) continue;
        const { data: existing } = await supabaseAdmin
          .from('places')
          .select('id, city, country')
          .eq('image_url', candidate.image_url)
          .limit(1)
          .maybeSingle();
        if (!existing || existing.id === place.id) {
          chosen = candidate;
          break;
        }
      }
      if (!chosen?.image_url) continue;

      const { data: updated, error } = await supabaseAdmin
        .from('places')
        .update({
          image_url: chosen.image_url,
          image_source: chosen.image_source,
          image_author: chosen.image_author,
          image_author_url: chosen.image_author_url,
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

async function generatePlaceOverview(place) {
  const city = String(place.city || place.name || '').trim();
  const country = String(place.country || '').trim();
  if (!city || !country) return null;

  const systemPrompt = 'You write concise, factual travel overviews for a travel app. Return only the overview text.';
  const primaryUserPrompt = `Write a short 3-sentence travel overview for ${city}, ${country}. Mention ${city} and ${country} naturally. Keep it factual, inviting, and general. Maximum 70 words total. No markdown, no emojis, no hashtags.`;
  const fallbackUserPrompt = `Write 3 short factual sentences about ${city}, ${country} for a travel app. Return only the overview.`;

  try {
    const content = await callDeepSeekChat({
      purpose: 'place-overview',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: primaryUserPrompt }],
      temperature: 0.3,
      maxTokens: 600,
      timeoutMs: 15000,
    });
    const unquoted = String(content || '').replace(/^\s*["']+|["']+\s*$/g, '').trim();
    return unquoted.replace(/\s+/g, ' ');
  } catch (error) {
    if (error?.code !== 'DEEPSEEK_EMPTY') throw error;
    const shouldRetry = error?.details?.finishReason === 'length' || error?.details?.finishReason == null;
    if (!shouldRetry) throw error;
    console.warn('[place-description] empty content on primary prompt, retrying with simpler prompt', {
      placeId: place.id,
      city,
      country,
      diagnostics: error?.details || null,
    });
  }

  const retryContent = await callDeepSeekChat({
    purpose: 'place-overview-retry',
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: fallbackUserPrompt }],
    temperature: 0.3,
    maxTokens: 800,
    timeoutMs: 15000,
  });

  const retryUnquoted = String(retryContent || '').replace(/^\s*["']+|["']+\s*$/g, '').trim();
  return retryUnquoted.replace(/\s+/g, ' ');
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
      const continent = parseContinent(req.query.continent);
      const minPopulation = Number.isFinite(Number(req.query.minPopulation)) ? Math.max(0, Math.floor(Number(req.query.minPopulation))) : null;
      const sort = parseSort(req.query.sort, Boolean(q));

      if (!q) {
        let query = supabaseAdmin
          .from('places')
          .select('id, name, description, city, country, country_code, latitude, longitude, population, image_url, image_source, image_author, image_author_url, image_fetched_at, external_source')
          .eq('external_source', 'geonames');

        if (continent) query = query.in('country_code', Array.from(CONTINENT_COUNTRY_CODES[continent]));
        if (minPopulation !== null) query = query.gte('population', minPopulation);

        if (sort === 'name') {
          query = query.order('city', { ascending: true }).order('name', { ascending: true });
        } else {
          query = query.order('population', { ascending: false, nullsFirst: false });
        }

        const { data, error } = await query.range(offset, offset + limit - 1);

        if (error) {
          console.error('[places/search] default query failed', error);
          return res.status(500).json({ error: 'Failed to search places.' });
        }

        const hydrated = await enrichPlacesWithImages(supabaseAdmin, data || []);
        return res.json({ places: hydrated.map(normalizePlaceRow) });
      }

      const qLower = q.toLowerCase();
      const escaped = q.replace(/[%_]/g, '\\$&');
      const selectCols = 'id, name, description, city, country, country_code, latitude, longitude, population, image_url, image_source, image_author, image_author_url, image_fetched_at, external_source, search_text';
      const buildBaseQuery = () => {
        let query = supabaseAdmin.from('places').select(selectCols).eq('external_source', 'geonames');
        if (continent) query = query.in('country_code', Array.from(CONTINENT_COUNTRY_CODES[continent]));
        if (minPopulation !== null) query = query.gte('population', minPopulation);
        return query;
      };

      const [exactRes, prefixRes, containsRes] = await Promise.all([
        buildBaseQuery().or(`name.ilike.${escaped},city.ilike.${escaped}`).order('population', { ascending: false, nullsFirst: false }).limit(120),
        buildBaseQuery().or(`name.ilike.${escaped}%,city.ilike.${escaped}%`).order('population', { ascending: false, nullsFirst: false }).limit(200),
        buildBaseQuery().or(`name.ilike.%${escaped}%,city.ilike.%${escaped}%,search_text.ilike.%${escaped}%`).order('population', { ascending: false, nullsFirst: false }).limit(300),
      ]);

      if (exactRes.error || prefixRes.error || containsRes.error) {
        console.error('[places/search] staged query failed', { q, exact: exactRes.error, prefix: prefixRes.error, contains: containsRes.error });
        return res.status(500).json({ error: 'Failed to search places.' });
      }

      const byId = new Map();
      const pushRanked = (rows, tierBase) => {
        (rows || []).forEach((row) => {
          const name = String(row.name || '').toLowerCase();
          const city = String(row.city || '').toLowerCase();
          let score = tierBase + Math.min(Number(row.population || 0) / 1_000_000, 50);
          if (city === qLower || name === qLower) score += 60;
          if (city.startsWith(qLower) || name.startsWith(qLower)) score += 20;
          const existing = byId.get(row.id);
          if (!existing || score > existing.score) byId.set(row.id, { row, score });
        });
      };
      pushRanked(exactRes.data, 300);
      pushRanked(prefixRes.data, 200);
      pushRanked(containsRes.data, 100);

      const dedupedByCityCountry = new Map();
      Array.from(byId.values())
        .sort((a, b) => b.score - a.score || Number(b.row.population || 0) - Number(a.row.population || 0))
        .forEach((item) => {
          const key = `${String(item.row.city || item.row.name || '').trim().toLowerCase()}|${String(item.row.country || '').trim().toLowerCase()}`;
          if (!dedupedByCityCountry.has(key)) dedupedByCityCountry.set(key, item);
        });

      const ranked = Array.from(dedupedByCityCountry.values())
        .sort((a, b) => {
          if (sort === 'population') return Number(b.row.population || 0) - Number(a.row.population || 0);
          if (sort === 'name') return String(a.row.city || a.row.name || '').localeCompare(String(b.row.city || b.row.name || ''));
          return b.score - a.score || Number(b.row.population || 0) - Number(a.row.population || 0);
        });

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
        .select('id, name, description, city, country, image_url, image_source, image_author, image_author_url, image_fetched_at, created_at')
        .eq('id', placeId)
        .maybeSingle();

      if (error) {
        const wrapped = new Error(error.message || 'Failed to load place.');
        wrapped.status = 502;
        throw wrapped;
      }

      if (!data) return res.status(404).json({ error: 'Place not found.' });

      const existingDescription = String(data.description || '').trim();
      const hasCompleteDescription = isValidPlaceDescription(existingDescription, data);
      if (hasCompleteDescription) return res.json(data);
      console.log('[place-description] invalid cached description', { placeId, city: data.city, country: data.country });

      try {
        if (!deepseekApiKey) {
          console.log('[place-description] generation skipped because missing DeepSeek config', { placeId, city: data.city, country: data.country });
          return res.json({ ...data, description: null });
        }
        console.log('[place-description] attempting generation', { placeId, city: data.city, country: data.country });
        let overview = null;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const generated = await generatePlaceOverview(data);
          if (isValidPlaceDescription(generated, data)) {
            overview = generated;
            break;
          }
        }
        if (!overview) {
          console.log('[place-description] generation failed', { placeId, city: data.city, country: data.country, reason: 'invalid-ai-output' });
          return res.json({ ...data, description: null });
        }
        const { data: updated, error: updateError } = await supabaseAdmin
          .from('places')
          .update({ description: overview })
          .eq('id', placeId)
          .select('id, name, description, city, country, image_url, image_source, image_author, image_author_url, image_fetched_at, created_at')
          .maybeSingle();
        if (updateError || !updated) {
          console.log('[place-description] generation failed', { placeId, city: data.city, country: data.country, reason: updateError?.message || 'update-failed' });
          return res.json({ ...data, description: null });
        }
        console.log('[place-description] generation success', { placeId, city: updated.city, country: updated.country });
        return res.json(updated);
      } catch (aiError) {
        if (aiError?.code === 'DEEPSEEK_TIMEOUT') {
          console.log('[place-description] generation timed out', { placeId, city: data.city, country: data.country });
          return res.json({ ...data, description: null });
        }
        console.error('[place-description] generation failed', { placeId, city: data.city, country: data.country, error: aiError?.message || String(aiError) });
        return res.json({ ...data, description: null });
      }
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
