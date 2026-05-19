const express = require('express');
const { assertUuid, parseLimit, makeError } = require('../utils/http');

module.exports = function notificationsRoutes(supabaseAdmin) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      const userId = String(req.query.userId || '').trim();
      const limit = parseLimit(req.query.limit, 50, 200);
      const offset = Math.max(0, Number(req.query.offset) || 0);

      assertUuid(userId, 'userId');

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('id, user_id, type, content, is_read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw makeError(error.message || 'Failed to load notifications.', 502, 'UPSTREAM_ERROR');
      return res.json({ notifications: data || [] });
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
        .select('id, user_id, type, content, is_read, created_at')
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

  return router;
};
