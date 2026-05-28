const express = require('express');
const { ensureGroupDestinationPlace } = require('../services/destinations');
const { callDeepSeekChat } = require('../services/deepseek');

function daysInclusive(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const ms = end.getTime() - start.getTime();
  return ms >= 0 ? Math.floor(ms / 86400000) + 1 : null;
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
      } else {
        tripContext = req.body;
      }

      const totalDays = Number(tripContext.dates?.totalDays || tripContext.days || tripContext.totalDays || 1);
      const city = tripContext.destination?.city || tripContext.city || tripContext.groupName || 'the destination';
      const country = tripContext.destination?.country || tripContext.country || '';

      const systemPrompt = `You are a travel itinerary planner.\nReturn only valid JSON.\nNo markdown.\nNo explanation.\nNo comments.`;
      const userPrompt = `Create a realistic travel itinerary as JSON.\n\nTrip data:\n${JSON.stringify(tripContext, null, 2)}\n\nRules:\n- Create exactly ${totalDays} days.\n- Each day must have exactly 2 places.\n- Use real, popular places in ${city}${country ? `, ${country}` : ''}.\n- Avoid repeating places.\n- Keep descriptions short.\n- Use morning and afternoon time blocks.\n- Budget ${tripContext.budget.minBudget != null && tripContext.budget.maxBudget != null ? `range is EUR ${tripContext.budget.minBudget}-${tripContext.budget.maxBudget}` : 'is unspecified'}.\n- Return JSON in this exact structure:\n\n{\n  "destination": "City, Country",\n  "summary": "short summary",\n  "days": [\n    {\n      "day": 1,\n      "title": "short day title",\n      "places": [\n        {\n          "name": "place name",\n          "timeBlock": "morning",\n          "startTime": "09:00",\n          "endTime": "11:00",\n          "description": "short description"\n        },\n        {\n          "name": "place name",\n          "timeBlock": "afternoon",\n          "startTime": "14:00",\n          "endTime": "16:00",\n          "description": "short description"\n        }\n      ]\n    }\n  ]\n}`;

      let content;
      try {
        content = await callDeepSeekChat({
          purpose: 'generate-itinerary',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          responseFormat: { type: 'json_object' },
          temperature: 0.4,
          maxTokens: 4000,
          timeoutMs: 15000,
        });
      } catch (error) {
        if (error?.code === 'MISSING_DEEPSEEK_KEY') {
          return res.status(500).json({ error: { code: 'MISSING_DEEPSEEK_KEY', message: 'Missing DEEPSEEK_API_KEY' } });
        }
        if (error?.code === 'DEEPSEEK_TIMEOUT') {
          return res.status(504).json({ error: { code: 'DEEPSEEK_TIMEOUT', message: 'DeepSeek request timed out' } });
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
        itinerary = JSON.parse(content);
      } catch (error) {
        console.error('[ai/generate-itinerary] invalid json from deepseek', { content });
        return res.status(500).json({ error: { code: 'DEEPSEEK_INVALID_JSON', message: 'DeepSeek returned invalid JSON' } });
      }

      if (!Array.isArray(itinerary?.days)) {
        return res.status(500).json({ error: { code: 'DEEPSEEK_INVALID_SHAPE', message: 'DeepSeek returned invalid itinerary shape' } });
      }

      return res.json(itinerary);
    } catch (error) { return next(error); }
  });

  return router;
};
