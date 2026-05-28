const express = require('express');
const { assertUuid, parseLimit, makeError } = require('../utils/http');
const { createNotificationService } = require('../services/notifications');

function parseOffset(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function normalizePlatform(value) {
  const platform = String(value || '').trim().toLowerCase();
  return platform || null;
}

async function createUpcomingTripReminders(supabaseAdmin, createNotification, userId) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);

  if (membershipError) {
    console.warn('[notifications] failed to load trip memberships', { userId, error: membershipError.message });
    return;
  }

  const groupIds = Array.from(new Set((memberships || []).map((row) => row.group_id).filter(Boolean)));
  if (groupIds.length === 0) return;

  const { data: groups, error: groupsError } = await supabaseAdmin
    .from('groups')
    .select('id, name, start_date, destination_place_id')
    .in('id', groupIds)
    .gte('start_date', today)
    .lte('start_date', soon);

  if (groupsError) {
    console.warn('[notifications] failed to load upcoming trips', { userId, error: groupsError.message });
    return;
  }

  const placeIds = Array.from(new Set((groups || []).map((group) => group.destination_place_id).filter(Boolean)));
  const { data: places } = placeIds.length > 0
    ? await supabaseAdmin.from('places').select('id, name, city, country').in('id', placeIds)
    : { data: [] };
  const placeById = new Map((places || []).map((place) => [place.id, place]));

  await Promise.all((groups || []).map((group) => {
    const place = placeById.get(group.destination_place_id);
    const destination = place?.name || place?.city || group.name || 'your trip';
    return createNotification({
      userId,
      type: 'trip_deadline',
      title: 'Trip coming up',
      body: `Your trip to ${destination} starts soon.`,
      relatedEntityType: 'trip_deadline',
      relatedEntityId: group.id,
      push: false,
    });
  }));
}

module.exports = function notificationsRoutes(supabaseAdmin) {
  const router = express.Router();
  const { createNotification } = createNotificationService(supabaseAdmin);

  router.get('/', async (req, res, next) => {
    try {
      const userId = String(req.query.userId || '').trim();
      const limit = parseLimit(req.query.limit, 50, 200);
      const offset = parseOffset(req.query.offset);

      assertUuid(userId, 'userId');
      await createUpcomingTripReminders(supabaseAdmin, createNotification, userId);

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('id, user_id, type, content, title, body, related_entity_type, related_entity_id, is_read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw makeError(error.message || 'Failed to load notifications.', 502, 'UPSTREAM_ERROR');
      return res.json({ notifications: data || [] });
    } catch (error) {
      return next(error);
    }
  });



  router.post('/', async (req, res, next) => {
    try {
      const userId = String(req.body?.userId || req.body?.user_id || '').trim();
      const type = String(req.body?.type || '').trim();
      const title = String(req.body?.title || '').trim();
      const body = String(req.body?.body || '').trim();
      const relatedEntityType = req.body?.relatedEntityType ?? req.body?.related_entity_type ?? null;
      const relatedEntityId = req.body?.relatedEntityId ?? req.body?.related_entity_id ?? null;

      assertUuid(userId, 'userId');
      if (!type) return res.status(400).json({ error: 'type is required.' });
      if (!title) return res.status(400).json({ error: 'title is required.' });
      if (relatedEntityId) assertUuid(String(relatedEntityId), 'relatedEntityId');

      const notification = await createNotification({
        userId,
        type,
        title,
        body,
        relatedEntityType: relatedEntityType ? String(relatedEntityType) : null,
        relatedEntityId: relatedEntityId ? String(relatedEntityId) : null,
      });

      return res.status(201).json(notification);
    } catch (error) {
      return next(error);
    }
  });

  router.post('/push-token', async (req, res, next) => {
    try {
      const userId = String(req.body?.userId || req.body?.user_id || '').trim();
      const token = String(req.body?.token || '').trim();
      const platform = normalizePlatform(req.body?.platform);

      assertUuid(userId, 'userId');
      if (!token) return res.status(400).json({ error: 'token is required.' });

      const { data, error } = await supabaseAdmin
        .from('push_tokens')
        .upsert({ user_id: userId, token, platform, updated_at: new Date().toISOString() }, { onConflict: 'token' })
        .select('id, user_id, token, platform, created_at, updated_at')
        .single();

      if (error) throw makeError(error.message || 'Failed to register push token.', 502, 'UPSTREAM_ERROR');
      return res.status(201).json(data);
    } catch (error) {
      return next(error);
    }
  });

  router.delete('/push-token', async (req, res, next) => {
    try {
      const userId = String(req.query.userId || req.body?.userId || req.body?.user_id || '').trim();
      const token = String(req.query.token || req.body?.token || '').trim();

      assertUuid(userId, 'userId');
      if (!token) return res.status(400).json({ error: 'token is required.' });

      const { error } = await supabaseAdmin
        .from('push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token);

      if (error) throw makeError(error.message || 'Failed to delete push token.', 502, 'UPSTREAM_ERROR');
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  router.patch('/:notificationId/read', async (req, res, next) => {
    try {
      const notificationId = String(req.params.notificationId || '').trim();
      const userId = String(req.body?.userId || '').trim();

      assertUuid(notificationId, 'notificationId');
      assertUuid(userId, 'userId');

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select('id, user_id, type, content, title, body, related_entity_type, related_entity_id, is_read, created_at')
        .single();

      if (error) throw makeError(error.message || 'Failed to mark notification as read.', 502, 'UPSTREAM_ERROR');
      return res.json(data);
    } catch (error) {
      return next(error);
    }
  });

  router.patch('/read-all', async (req, res, next) => {
    try {
      const userId = String(req.body?.userId || '').trim();
      assertUuid(userId, 'userId');

      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw makeError(error.message || 'Failed to mark notifications as read.', 502, 'UPSTREAM_ERROR');
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  router.delete('/:notificationId', async (req, res, next) => {
    try {
      const notificationId = String(req.params.notificationId || '').trim();
      const userId = String(req.query.userId || req.body?.userId || '').trim();

      assertUuid(notificationId, 'notificationId');
      assertUuid(userId, 'userId');

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select('id');

      if (error) throw makeError(error.message || 'Failed to delete notification.', 502, 'UPSTREAM_ERROR');
      if (!data || data.length === 0) return res.status(404).json({ error: 'Notification not found.' });
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  router.delete('/', async (req, res, next) => {
    try {
      const userId = String(req.query.userId || req.body?.userId || '').trim();
      assertUuid(userId, 'userId');

      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw makeError(error.message || 'Failed to clear notifications.', 502, 'UPSTREAM_ERROR');
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  return router;
};
