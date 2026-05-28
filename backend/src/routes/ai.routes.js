const express = require('express');
const { ensureGroupDestinationPlace } = require('../services/destinations');
const { callDeepSeekChat } = require('../services/deepseek');
const { dateOnlyDiff, daysInclusive, isDateOnly } = require('../utils/date-only');

const ALLOWED_INTERESTS = new Set([
  'History',
  'Food',
  'Nature',
  'Beaches',
  'Museums',
  'Nightlife',
  'Shopping',
  'Architecture',
  'Local culture',
  'Adventure',
  'Relaxation',
  'Family friendly',
  'Budget friendly',
]);

function sanitizeInterests(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || '').trim()).filter((item) => ALLOWED_INTERESTS.has(item)))].slice(0, 8);
}


function compactExistingItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => String(item?.title || item?.name || '').trim())
    .filter(Boolean)
    .slice(0, 30);
}

function buildCompactPromptContext(tripContext, interests, totalDays) {
  const destination = tripContext.destination || {};
  return {
    destination: {
      city: destination.city || tripContext.city || tripContext.groupName || null,
      country: destination.country || tripContext.country || null,
    },
    dates: {
      startDate: tripContext.dates?.startDate || null,
      endDate: tripContext.dates?.endDate || null,
      totalDays,
    },
    budget: {
      minBudget: tripContext.budget?.minBudget ?? null,
      maxBudget: tripContext.budget?.maxBudget ?? null,
      currency: tripContext.budget?.currency || 'EUR',
    },
    interests,
    existingPlaceNames: compactExistingItems(tripContext.existingItems),
  };
}

function extractJsonObject(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  if (raw.startsWith('{') && raw.endsWith('}')) return raw;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const cleaned = fenced[1].trim();
    if (cleaned.startsWith('{') && cleaned.endsWith('}')) return cleaned;
  }
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) return raw.slice(start, end + 1);
  return raw;
}

function buildItineraryPrompts({ city, country, totalDays, interests, compactContext }) {
  const destinationLabel = `${city}${country ? `, ${country}` : ''}`;
  const interestsLine = interests.length
    ? `Prioritize these interests without ignoring must-see places: ${interests.join(', ')}.`
    : 'No interests were selected, so create a balanced first-time visitor plan.';

  const systemPrompt = [
    'You are a fast travel itinerary JSON generator.',
    'Return only valid minified JSON.',
    'Do not include markdown, comments, explanation, or prose outside JSON.',
  ].join(' ');

  const userPrompt = [
    `Create a ${totalDays}-day itinerary for ${destinationLabel}.`,
    interestsLine,
    'Use real, well-known places in or very near the destination.',
    'Avoid duplicate places and avoid places already listed in existingPlaceNames.',
    'Each day must have exactly 2 places: one morning and one afternoon.',
    'Keep descriptions under 12 words each.',
    'Use this exact shape:',
    '{"destination":"City, Country","summary":"short summary","days":[{"day":1,"title":"short title","places":[{"name":"place name","timeBlock":"morning","startTime":"09:00","endTime":"11:00","description":"short text"},{"name":"place name","timeBlock":"afternoon","startTime":"14:00","endTime":"16:00","description":"short text"}]}]}',
    `Context JSON: ${JSON.stringify(compactContext)}`,
  ].join('\n');

  return { systemPrompt, userPrompt };
}

function normalizeGeneratedItinerary(itinerary, totalDays) {
  if (!Array.isArray(itinerary?.days)) return itinerary;
  const seenPlaces = new Set();
  const normalizedDays = [];
  for (let index = 0; index < itinerary.days.length; index += 1) {
    const rawDay = itinerary.days[index] || {};
    const dayNumber = Math.min(totalDays, Math.max(1, Number(rawDay.day || index + 1) || index + 1));
    const rawPlaces = Array.isArray(rawDay.places) ? rawDay.places : [];
    const places = [];
    for (const rawPlace of rawPlaces) {
      const name = String(rawPlace?.name || rawPlace?.place || rawPlace?.title || '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seenPlaces.has(key)) continue;
      seenPlaces.add(key);
      places.push({
        name,
        timeBlock: rawPlace.timeBlock || rawPlace.period || 'unscheduled',
        startTime: rawPlace.startTime || rawPlace.time || null,
        endTime: rawPlace.endTime || null,
        description: rawPlace.description || rawPlace.notes || '',
      });
      if (places.length >= 2) break;
    }
    normalizedDays.push({
      day: dayNumber,
      title: rawDay.title || `Day ${dayNumber}`,
      places,
    });
  }
  return { ...itinerary, days: normalizedDays.filter((day) => day.day >= 1 && day.day <= totalDays) };
}

module.exports = function aiRoutes(supabaseAdmin) {
  const router = express.Router();

  router.get('/place-image', (req, res) => {
    res.json({ imageUrl: null, source: null });
  });

  async function buildItineraryTripContext(groupId, userId) {
    const { data: membership } = userId ? await supabaseAdmin.from('group_members').select('group_id').eq('group_id', groupId).eq('user_id', userId).maybeSingle() : { data: { group_id: groupId } };
    if (userId && !membership) return { error: { code: 'FORBIDDEN', message: 'Only group members can generate itinerary.' } };
    const { data: group } = await supabaseAdmin.from('groups').select('id,name,destination_place_id,start_date,end_date,min_budget,max_budget,status').eq('id', groupId).maybeSingle();
    if (!group) return null;

    const place = await ensureGroupDestinationPlace(supabaseAdmin, group);

    const { data: dateOptions = [] } = await supabaseAdmin.from('date_options').select('id,start_date,end_date').eq('group_id', groupId).order('start_date', { ascending: true });
    const dateIds = dateOptions.map((d) => d.id);
    const { data: dateVotes = [] } = dateIds.length ? await supabaseAdmin.from('date_votes').select('date_option_id').in('date_option_id', dateIds) : { data: [] };
    const dateCount = new Map();
    dateVotes.forEach((v) => dateCount.set(v.date_option_id, (dateCount.get(v.date_option_id) || 0) + 1));
    const winningDate = [...dateOptions].sort((a, b) => (dateCount.get(b.id) || 0) - (dateCount.get(a.id) || 0))[0] || null;
    const startDate = winningDate?.start_date || group.start_date || null;
    const endDate = winningDate?.end_date || group.end_date || null;

    const { data: budgetOptions = [] } = await supabaseAdmin.from('budget_options').select('id,min_budget,max_budget').eq('group_id', groupId).order('id', { ascending: true });
    const budgetIds = budgetOptions.map((b) => b.id);
    const { data: budgetVotes = [] } = budgetIds.length ? await supabaseAdmin.from('budget_votes').select('budget_option_id').in('budget_option_id', budgetIds) : { data: [] };
    const budgetCount = new Map();
    budgetVotes.forEach((v) => budgetCount.set(v.budget_option_id, (budgetCount.get(v.budget_option_id) || 0) + 1));
    const winningBudget = [...budgetOptions].sort((a, b) => (budgetCount.get(b.id) || 0) - (budgetCount.get(a.id) || 0))[0] || null;

    const { data: existingItems = [] } = await supabaseAdmin.from('itinerary_items').select('id,title,date,time,created_by').eq('group_id', groupId).order('date', { ascending: true });

    return {
      groupId,
      groupName: group.name,
      destination: {
        name: place?.name || group.name,
        city: place?.city || group.name,
        country: place?.country || null,
      },
      dates: {
        startDate,
        endDate,
        totalDays: daysInclusive(startDate, endDate),
      },
      budget: {
        minBudget: winningBudget?.min_budget ?? group.min_budget ?? (budgetOptions.length ? budgetOptions.reduce((sum, row) => sum + (Number(row.min_budget) || 0), 0) : null),
        maxBudget: winningBudget?.max_budget ?? group.max_budget ?? (budgetOptions.length ? budgetOptions.reduce((sum, row) => sum + (Number(row.max_budget) || 0), 0) : null),
        currency: 'EUR',
      },
      existingItems,
    };
  }


  router.get('/itinerary-context', async (req, res, next) => {
    try {
      const groupId = String(req.query?.groupId || '').trim();
      const userId = String(req.query?.userId || '').trim();
      if (!groupId) return res.status(400).json({ error: { code: 'MISSING_GROUP_ID', message: 'groupId is required' } });
      if (!userId) return res.status(400).json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } });
      const tripContext = await buildItineraryTripContext(groupId, userId);
      if (!tripContext) return res.status(404).json({ error: { code: 'GROUP_NOT_FOUND', message: 'Group not found' } });
      if (tripContext.error) return res.status(403).json({ error: tripContext.error });
      if (!tripContext.dates.startDate || !tripContext.dates.endDate) return res.status(400).json({ error: { code: 'MISSING_DATE_RANGE', message: 'Trip needs a selected date range before generating itinerary.' } });
      if (!isDateOnly(tripContext.dates.startDate) || !isDateOnly(tripContext.dates.endDate) || dateOnlyDiff(tripContext.dates.startDate, tripContext.dates.endDate) < 0) {
        return res.status(400).json({ error: { code: 'INVALID_DATE_RANGE', message: 'Trip dates are invalid.' } });
      }
      return res.json(tripContext);
    } catch (error) { return next(error); }
  });

  router.post('/generate-itinerary', async (req, res, next) => {
    try {

      const groupId = String(req.body?.groupId || '').trim();
      if (!groupId) return res.status(400).json({ error: { code: 'MISSING_GROUP_ID', message: 'groupId is required' } });

      let tripContext = null;
      if (groupId) {
        tripContext = await buildItineraryTripContext(groupId, String(req.body?.userId || '').trim());
        if (!tripContext) return res.status(404).json({ error: { code: 'GROUP_NOT_FOUND', message: 'Group not found' } });
        if (tripContext.error) return res.status(403).json({ error: tripContext.error });
        if (!tripContext.dates.startDate || !tripContext.dates.endDate) return res.status(400).json({ error: { code: 'MISSING_DATE_RANGE', message: 'Trip needs a selected date range before generating itinerary.' } });
        if (!isDateOnly(tripContext.dates.startDate) || !isDateOnly(tripContext.dates.endDate) || dateOnlyDiff(tripContext.dates.startDate, tripContext.dates.endDate) < 0) {
          return res.status(400).json({ error: { code: 'INVALID_DATE_RANGE', message: 'Trip dates are invalid.' } });
        }
      } else {
        tripContext = req.body;
      }

      const totalDays = Number(tripContext.dates?.totalDays || tripContext.days || tripContext.totalDays || 1);
      if (!Number.isFinite(totalDays) || totalDays < 1) {
        return res.status(400).json({ error: { code: 'INVALID_DATE_RANGE', message: 'Trip date range must include at least one day.' } });
      }
      const city = tripContext.destination?.city || tripContext.city || tripContext.groupName || 'the destination';
      const country = tripContext.destination?.country || tripContext.country || '';
      const interests = sanitizeInterests(req.body?.interests);
      tripContext = { ...tripContext, interests };

      const compactContext = buildCompactPromptContext(tripContext, interests, totalDays);
      const { systemPrompt, userPrompt } = buildItineraryPrompts({ city, country, totalDays, interests, compactContext });

      let content;
      try {
        content = await callDeepSeekChat({
          purpose: 'generate-itinerary',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          responseFormat: { type: 'json_object' },
          temperature: 0.25,
          maxTokens: Math.max(6000, Math.min(12000, totalDays * 1200)),
          timeoutMs: 90000,
        });
      } catch (error) {
        if (error?.code === 'MISSING_DEEPSEEK_KEY') {
          return res.status(500).json({ error: { code: 'MISSING_DEEPSEEK_KEY', message: 'Missing DEEPSEEK_API_KEY' } });
        }
        if (error?.code === 'DEEPSEEK_TIMEOUT') {
          return res.status(504).json({ error: { code: 'DEEPSEEK_TIMEOUT', message: 'AI itinerary generation took too long. Please try again.' } });
        }
        if (error?.code === 'DEEPSEEK_EMPTY') {
          return res.status(502).json({ error: { code: 'DEEPSEEK_EMPTY', message: 'DeepSeek returned empty content' } });
        }
        return res.status(502).json({ error: { code: 'DEEPSEEK_FAILED', message: error?.message || 'DeepSeek request failed' } });
      }

      if (!content) {
        return res.status(500).json({ error: { code: 'DEEPSEEK_EMPTY', message: 'DeepSeek returned no content' } });
      }

      let itinerary;
      try {
        itinerary = JSON.parse(extractJsonObject(content));
      } catch (error) {
        console.error('[ai/generate-itinerary] invalid json from deepseek', { content });
        return res.status(500).json({ error: { code: 'DEEPSEEK_INVALID_JSON', message: 'DeepSeek returned invalid JSON' } });
      }

      if (!Array.isArray(itinerary?.days)) {
        return res.status(500).json({ error: { code: 'DEEPSEEK_INVALID_SHAPE', message: 'DeepSeek returned invalid itinerary shape' } });
      }

      const normalizedItinerary = normalizeGeneratedItinerary(itinerary, totalDays);
      if (!Array.isArray(normalizedItinerary.days) || normalizedItinerary.days.length === 0) {
        return res.status(500).json({ error: { code: 'DEEPSEEK_INVALID_SHAPE', message: 'DeepSeek returned no usable itinerary days' } });
      }

      return res.json(normalizedItinerary);
    } catch (error) { return next(error); }
  });

  return router;
};
