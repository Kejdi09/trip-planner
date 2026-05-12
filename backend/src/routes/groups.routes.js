const express = require('express');
const { assertUuid, makeError } = require('../utils/http');

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return UUID_REGEX.test(String(value || '').trim());
}

function parseLimit(value, fallback = 30, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(max, Math.floor(parsed));
}

module.exports = function groupsRoutes(supabaseAdmin) {
  const router = express.Router();

  async function createNotification(userId, type, content) {
    const { error } = await supabaseAdmin.from('notifications').insert({ user_id: userId, type, content });
    if (error) {
      const wrapped = makeError(error.message || 'Failed to create notification.', 502, 'UPSTREAM_ERROR');
      throw wrapped;
    }
  }

  async function getGroup(groupId) {
    const { data, error } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .maybeSingle();

    if (error) {
      const wrapped = new Error(error.message || 'Failed to load group.');
      wrapped.status = 502;
      throw wrapped;
    }

    return data;
  }

  async function requireGroup(groupId) {
    const group = await getGroup(groupId);
    if (!group) {
      const wrapped = new Error('Group not found.');
      wrapped.status = 404;
      throw wrapped;
    }
    return group;
  }

  async function requireMember(groupId, userId) {
    const { data, error } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      const wrapped = new Error(error.message || 'Failed to check membership.');
      wrapped.status = 502;
      throw wrapped;
    }

    if (!data) {
      const wrapped = new Error('Only group members can access this resource.');
      wrapped.status = 403;
      throw wrapped;
    }
  }

  async function requireCreator(groupId, userId) {
    const group = await requireGroup(groupId);
    if (group.created_by !== userId) {
      const wrapped = new Error('Only the group creator can perform this action.');
      wrapped.status = 403;
      throw wrapped;
    }
    return group;
  }

  router.get('/', async (req, res, next) => {
    try {
      const userId = String(req.query.userId || '').trim();
      assertUuid(userId, 'userId');

      const { data: memberships, error: membershipError } = await supabaseAdmin
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (membershipError) {
        const wrapped = new Error(membershipError.message || 'Failed to list group memberships.');
        wrapped.status = 502;
        throw wrapped;
      }

      const groupIds = (memberships || []).map((row) => row.group_id).filter(Boolean);
      if (groupIds.length === 0) return res.json({ groups: [] });

      const { data: groups, error: groupsError } = await supabaseAdmin
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupsError) {
        const wrapped = new Error(groupsError.message || 'Failed to load groups.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.json({ groups: groups || [] });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const name = String(req.body?.name || '').trim();
      const description = String(req.body?.description || '').trim() || null;
      const createdBy = String(req.body?.createdBy || req.body?.created_by || '').trim();

      if (!name || name.length < 3) {
        return res.status(400).json({ error: 'Group name must be at least 3 characters.' });
      }
      if (!createdBy) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CREATED_BY',
            message: 'createdBy is required.',
          },
        });
      }
      assertUuid(createdBy, 'createdBy');

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', createdBy)
        .maybeSingle();

      if (profileError) {
        const wrapped = makeError(profileError.message || 'Failed to verify profile.', 502, 'UPSTREAM_ERROR');
        throw wrapped;
      }

      if (!profile) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PROFILE',
            message: 'createdBy must be an existing profiles.id',
          },
        });
      }

      const { data: group, error: groupError } = await supabaseAdmin
        .from('groups')
        .insert({
          name,
          description,
          created_by: createdBy,
          status: 'planning',
        })
        .select('*')
        .single();

      if (groupError) {
        const wrapped = new Error(groupError.message || 'Failed to create group.');
        wrapped.status = 502;
        throw wrapped;
      }

      const { error: memberError } = await supabaseAdmin
        .from('group_members')
        .insert({ group_id: group.id, user_id: createdBy });

      if (memberError) {
        const wrapped = new Error(memberError.message || 'Failed to create creator membership.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.status(201).json(group);
    } catch (error) {
      return next(error);
    }
  });


  router.delete('/:groupId', async (req, res, next) => {
    try {
      const groupId = String(req.params.groupId || '').trim();
      const userId = String(req.body?.userId || req.query.userId || '').trim();
      assertUuid(groupId, 'groupId');
      assertUuid(userId, 'userId');

      await requireCreator(groupId, userId);

      const { error } = await supabaseAdmin.from('groups').delete().eq('id', groupId);
      if (error) {
        const wrapped = new Error(error.message || 'Failed to delete group.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.json({ success: true });
    } catch (error) {
      return next(error);
    }
  });

  router.patch('/:groupId', async (req, res, next) => {
    try {
      const groupId = String(req.params.groupId || '').trim();
      const userId = String(req.body?.userId || '').trim();
      assertUuid(groupId, 'groupId');
      assertUuid(userId, 'userId');

      const group = await requireCreator(groupId, userId);

      const nextStatus = req.body?.status;
      const allowedStatuses = new Set(['planning', 'active', 'completed']);
      if (nextStatus && !allowedStatuses.has(nextStatus)) {
        return res.status(400).json({ error: 'Invalid status transition.' });
      }

      const patch = {
        name: typeof req.body?.name === 'string' ? req.body.name.trim() : group.name,
        description:
          typeof req.body?.description === 'string'
            ? req.body.description.trim()
            : group.description,
        status: nextStatus || group.status,
        voting_deadline: req.body?.votingDeadline ?? group.voting_deadline,
        start_date: req.body?.startDate ?? group.start_date,
        end_date: req.body?.endDate ?? group.end_date,
        min_budget: req.body?.minBudget ?? group.min_budget,
        max_budget: req.body?.maxBudget ?? group.max_budget,
      };

      if (patch.start_date && patch.end_date && new Date(patch.start_date) > new Date(patch.end_date)) {
        return res.status(400).json({ error: 'startDate must be before or equal to endDate.' });
      }

      const { data, error } = await supabaseAdmin
        .from('groups')
        .update(patch)
        .eq('id', groupId)
        .select('*')
        .single();

      if (error) {
        const wrapped = new Error(error.message || 'Failed to update group.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.json(data);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/:groupId/members', async (req, res, next) => {
    try {
      const groupId = String(req.params.groupId || '').trim();
      const userId = String(req.query.userId || '').trim();
      assertUuid(groupId, 'groupId');
      assertUuid(userId, 'userId');

      await requireMember(groupId, userId);

      const { data, error } = await supabaseAdmin
        .from('group_members')
        .select('id, group_id, user_id, joined_at')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (error) {
        const wrapped = new Error(error.message || 'Failed to list members.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.json({ members: data || [] });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/:groupId/members', async (req, res, next) => {
    try {
      const groupId = String(req.params.groupId || '').trim();
      const actorId = String(req.body?.actorId || '').trim();
      const newUserId = String(req.body?.userId || '').trim();

      assertUuid(groupId, 'groupId');
      assertUuid(actorId, 'actorId');
      assertUuid(newUserId, 'userId');

      await requireCreator(groupId, actorId);

      const { data: existing, error: existingError } = await supabaseAdmin
        .from('group_members')
        .select('id, group_id, user_id, joined_at')
        .eq('group_id', groupId)
        .eq('user_id', newUserId)
        .maybeSingle();

      if (existingError) {
        const wrapped = new Error(existingError.message || 'Failed to check member existence.');
        wrapped.status = 502;
        throw wrapped;
      }

      if (existing) {
        return res.status(200).json(existing);
      }

      const { data, error } = await supabaseAdmin
        .from('group_members')
        .insert({ group_id: groupId, user_id: newUserId })
        .select('id, group_id, user_id, joined_at')
        .single();

      if (error) {
        const wrapped = new Error(error.message || 'Failed to add member.');
        wrapped.status = 502;
        throw wrapped;
      }

      await createNotification(newUserId, 'group_invite', JSON.stringify({ deepLink: `/group-chat?groupId=${groupId}`, groupId, actorId }));
      await createNotification(actorId, 'group_join', JSON.stringify({ deepLink: `/group-chat?groupId=${groupId}`, groupId, userId: newUserId }));

      return res.status(201).json(data);
    } catch (error) {
      return next(error);
    }
  });

  router.delete('/:groupId/members/:memberUserId', async (req, res, next) => {
    try {
      const groupId = String(req.params.groupId || '').trim();
      const memberUserId = String(req.params.memberUserId || '').trim();
      const actorId = String(req.query.actorId || req.body?.actorId || '').trim();

      assertUuid(groupId, 'groupId');
      assertUuid(actorId, 'actorId');
      assertUuid(memberUserId, 'memberUserId');

      const group = await requireGroup(groupId);
      const isSelfLeave = actorId === memberUserId;
      if (!isSelfLeave && group.created_by !== actorId) {
        return res.status(403).json({ error: 'Only the group creator can remove other members.' });
      }

      const { data, error } = await supabaseAdmin
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', memberUserId)
        .select('id');

      if (error) {
        const wrapped = new Error(error.message || 'Failed to remove member.');
        wrapped.status = 502;
        throw wrapped;
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Member not found in group.' });
      }

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  router.get('/:groupId/messages', async (req, res, next) => {
    try {
      const groupId = String(req.params.groupId || '').trim();
      const userId = String(req.query.userId || '').trim();
      const limit = parseLimit(req.query.limit, 50, 200);
      const offset = Math.max(0, Number(req.query.offset) || 0);

      assertUuid(groupId, 'groupId');
      assertUuid(userId, 'userId');

      await requireMember(groupId, userId);

      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('id, group_id, sender_id, content, created_at')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        const wrapped = new Error(error.message || 'Failed to load messages.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.json({ messages: data || [] });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/:groupId/messages', async (req, res, next) => {
    try {
      const groupId = String(req.params.groupId || '').trim();
      const userId = String(req.body?.userId || '').trim();
      const content = String(req.body?.content || '').trim();

      assertUuid(groupId, 'groupId');
      assertUuid(userId, 'userId');

      if (!content) {
        return res.status(400).json({ error: 'Message content is required.' });
      }

      await requireMember(groupId, userId);

      const { data, error } = await supabaseAdmin
        .from('messages')
        .insert({ group_id: groupId, sender_id: userId, content })
        .select('id, group_id, sender_id, content, created_at')
        .single();

      if (error) {
        const wrapped = new Error(error.message || 'Failed to send message.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.status(201).json(data);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/:groupId/itinerary', async (req, res, next) => {
    try {
      const groupId = String(req.params.groupId || '').trim();
      const userId = String(req.query.userId || '').trim();

      assertUuid(groupId, 'groupId');
      assertUuid(userId, 'userId');

      await requireMember(groupId, userId);

      const { data, error } = await supabaseAdmin
        .from('itinerary_items')
        .select('id, group_id, title, date, time, created_by, created_at')
        .eq('group_id', groupId)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        const wrapped = new Error(error.message || 'Failed to load itinerary.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.json({ items: data || [] });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/:groupId/itinerary', async (req, res, next) => {
    try {
      const groupId = String(req.params.groupId || '').trim();
      const userId = String(req.body?.userId || '').trim();
      const title = String(req.body?.title || '').trim();
      const date = String(req.body?.date || '').trim();
      const time = String(req.body?.time || '').trim() || null;

      assertUuid(groupId, 'groupId');
      assertUuid(userId, 'userId');
      if (!title || !date) {
        return res.status(400).json({ error: 'title and date are required.' });
      }

      await requireMember(groupId, userId);
      const group = await requireGroup(groupId);

      if (group.start_date && new Date(date) < new Date(group.start_date)) {
        return res.status(400).json({ error: 'Itinerary date cannot be before group start date.' });
      }
      if (group.end_date && new Date(date) > new Date(group.end_date)) {
        return res.status(400).json({ error: 'Itinerary date cannot be after group end date.' });
      }

      const { data, error } = await supabaseAdmin
        .from('itinerary_items')
        .insert({ group_id: groupId, title, date, time, created_by: userId })
        .select('id, group_id, title, date, time, created_by, created_at')
        .single();

      if (error) {
        const wrapped = new Error(error.message || 'Failed to create itinerary item.');
        wrapped.status = 502;
        throw wrapped;
      }

      const { data: members } = await supabaseAdmin
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);
      const recipients = (members || []).map((m) => m.user_id).filter(Boolean);
      await Promise.all(recipients.map((recipientId) =>
        createNotification(recipientId, 'itinerary_update', JSON.stringify({ deepLink: `/itinerary?groupId=${groupId}`, groupId, itemId: data.id })),
      ));

      return res.status(201).json(data);
    } catch (error) {
      return next(error);
    }
  });

  router.patch('/:groupId/itinerary/:itemId', async (req, res, next) => {
    try {
      const groupId = String(req.params.groupId || '').trim();
      const itemId = String(req.params.itemId || '').trim();
      const userId = String(req.body?.userId || '').trim();

      if (!isValidUuid(groupId) || !isValidUuid(itemId) || !isValidUuid(userId)) {
        return res.status(400).json({ error: 'groupId, itemId, and userId must be valid UUIDs.' });
      }

      await requireMember(groupId, userId);

      const patch = {};
      if (typeof req.body?.title === 'string') patch.title = req.body.title.trim();
      if (typeof req.body?.date === 'string') patch.date = req.body.date.trim();
      if (typeof req.body?.time === 'string') patch.time = req.body.time.trim();

      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ error: 'No updates provided.' });
      }

      const group = await requireGroup(groupId);
      if (patch.date && group.start_date && new Date(patch.date) < new Date(group.start_date)) {
        return res.status(400).json({ error: 'Itinerary date cannot be before group start date.' });
      }
      if (patch.date && group.end_date && new Date(patch.date) > new Date(group.end_date)) {
        return res.status(400).json({ error: 'Itinerary date cannot be after group end date.' });
      }

      const { data, error } = await supabaseAdmin
        .from('itinerary_items')
        .update(patch)
        .eq('id', itemId)
        .eq('group_id', groupId)
        .select('id, group_id, title, date, time, created_by, created_at')
        .single();

      if (error) {
        const wrapped = new Error(error.message || 'Failed to update itinerary item.');
        wrapped.status = 502;
        throw wrapped;
      }

      return res.json(data);
    } catch (error) {
      return next(error);
    }
  });

  router.delete('/:groupId/itinerary/:itemId', async (req, res, next) => {
    try {
      const groupId = String(req.params.groupId || '').trim();
      const itemId = String(req.params.itemId || '').trim();
      const userId = String(req.query.userId || req.body?.userId || '').trim();

      if (!isValidUuid(groupId) || !isValidUuid(itemId) || !isValidUuid(userId)) {
        return res.status(400).json({ error: 'groupId, itemId, and userId must be valid UUIDs.' });
      }

      await requireMember(groupId, userId);

      const { data, error } = await supabaseAdmin
        .from('itinerary_items')
        .delete()
        .eq('id', itemId)
        .eq('group_id', groupId)
        .select('id');

      if (error) {
        const wrapped = new Error(error.message || 'Failed to delete itinerary item.');
        wrapped.status = 502;
        throw wrapped;
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Itinerary item not found.' });
      }

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  return router;
};
