const express = require('express');
const { assertUuid, makeError } = require('../utils/http');

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return UUID_REGEX.test(String(value || '').trim());
}

function isVotingLocked(group) {
  if (!group?.voting_deadline) return false;
  const deadlineMs = new Date(group.voting_deadline).getTime();
  if (Number.isNaN(deadlineMs)) return false;
  return Date.now() >= deadlineMs;
}

module.exports = function votingRoutes(supabaseAdmin) {
  const router = express.Router();

  async function createNotification(userId, type, content) {
    const { error } = await supabaseAdmin.from('notifications').insert({ user_id: userId, type, content });
    if (error) throw makeError(error.message || 'Failed to create notification.', 502, 'UPSTREAM_ERROR');
  }

  async function getGroupOrThrow(groupId) {
    const { data, error } = await supabaseAdmin
      .from('groups')
      .select('id, status, voting_deadline, destination_place_id, start_date, end_date, min_budget, max_budget')
      .eq('id', groupId)
      .maybeSingle();

    if (error) {
      const wrapped = new Error(error.message || 'Failed to load group.');
      wrapped.status = 502;
      throw wrapped;
    }

    if (!data) {
      const wrapped = new Error('Group not found.');
      wrapped.status = 404;
      throw wrapped;
    }

    return data;
  }

  async function assertMemberOrThrow(groupId, userId) {
    const { data, error } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      const wrapped = new Error(error.message || 'Failed to verify membership.');
      wrapped.status = 502;
      throw wrapped;
    }

    if (!data) {
      const wrapped = new Error('Only group members can vote.');
      wrapped.status = 403;
      throw wrapped;
    }
  }

  async function ensurePlanningAndOpenOrThrow(group) {
    if (group.status !== 'planning') {
      const wrapped = new Error('Voting is only allowed while group is in planning status.');
      wrapped.status = 409;
      throw wrapped;
    }

    if (isVotingLocked(group)) {
      const wrapped = new Error('Voting is locked because deadline has passed.');
      wrapped.status = 409;
      throw wrapped;
    }
  }

  async function getMemberCount(groupId) {
    const { count, error } = await supabaseAdmin
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId);

    if (error) {
      const wrapped = new Error(error.message || 'Failed to count group members.');
      wrapped.status = 502;
      throw wrapped;
    }

    return typeof count === 'number' ? count : 0;
  }

  router.get('/state', async (req, res, next) => {
    try {
      const groupId = String(req.query.groupId || '').trim();
      const userId = String(req.query.userId || '').trim();

      assertUuid(groupId, 'groupId');
      assertUuid(userId, 'userId');

      const group = await getGroupOrThrow(groupId);
      await assertMemberOrThrow(groupId, userId);

      const [memberCount, destinationOptionsRes, dateOptionsRes, budgetOptionsRes] = await Promise.all([
        getMemberCount(groupId),
        supabaseAdmin.from('destination_options').select('id, destination_id').eq('group_id', groupId),
        supabaseAdmin.from('date_options').select('id, start_date, end_date').eq('group_id', groupId),
        supabaseAdmin.from('budget_options').select('id, min_budget, max_budget').eq('group_id', groupId),
      ]);

      const errors = [destinationOptionsRes.error, dateOptionsRes.error, budgetOptionsRes.error].filter(Boolean);
      if (errors.length > 0) {
        const wrapped = new Error(errors[0].message || 'Failed to load vote options.');
        wrapped.status = 502;
        throw wrapped;
      }

      const destinationOptions = destinationOptionsRes.data || [];
      const dateOptions = dateOptionsRes.data || [];
      const budgetOptions = budgetOptionsRes.data || [];

      const destinationOptionIds = destinationOptions.map((o) => o.id);
      const dateOptionIds = dateOptions.map((o) => o.id);
      const budgetOptionIds = budgetOptions.map((o) => o.id);

      const [destinationVotesRes, dateVotesRes, budgetVotesRes, placesRes] = await Promise.all([
        destinationOptionIds.length > 0
          ? supabaseAdmin.from('destination_votes').select('destination_option_id, user_id').in('destination_option_id', destinationOptionIds)
          : { data: [], error: null },
        dateOptionIds.length > 0
          ? supabaseAdmin.from('date_votes').select('date_option_id, user_id').in('date_option_id', dateOptionIds)
          : { data: [], error: null },
        budgetOptionIds.length > 0
          ? supabaseAdmin.from('budget_votes').select('budget_option_id, user_id').in('budget_option_id', budgetOptionIds)
          : { data: [], error: null },
        destinationOptions.length > 0
          ? supabaseAdmin
              .from('places')
              .select('id, name, city, country')
              .in('id', destinationOptions.map((o) => o.destination_id).filter(Boolean))
          : { data: [], error: null },
      ]);

      const voteErrors = [destinationVotesRes.error, dateVotesRes.error, budgetVotesRes.error, placesRes.error].filter(Boolean);
      if (voteErrors.length > 0) {
        const wrapped = new Error(voteErrors[0].message || 'Failed to load vote tallies.');
        wrapped.status = 502;
        throw wrapped;
      }

      const destinationVotes = destinationVotesRes.data || [];
      const dateVotes = dateVotesRes.data || [];
      const budgetVotes = budgetVotesRes.data || [];
      const places = placesRes.data || [];
      const placeById = new Map(places.map((p) => [p.id, p]));

      const destinationDtos = destinationOptions.map((option) => {
        const votes = destinationVotes.filter((v) => v.destination_option_id === option.id);
        const place = placeById.get(option.destination_id) || null;
        return {
          id: option.id,
          destinationId: option.destination_id,
          city: place?.city || place?.name || 'Unknown city',
          country: place?.country || 'Unknown country',
          votedCount: votes.length,
          totalMembers: memberCount,
          voters: votes.map((v) => ({ id: v.user_id })),
          selected: votes.some((v) => v.user_id === userId),
        };
      });

      const dateDtos = dateOptions.map((option) => {
        const votes = dateVotes.filter((v) => v.date_option_id === option.id);
        return {
          id: option.id,
          label: `${option.start_date} to ${option.end_date}`,
          startDate: option.start_date,
          endDate: option.end_date,
          votedCount: votes.length,
          totalMembers: memberCount,
          voters: votes.map((v) => ({ id: v.user_id })),
          selected: votes.some((v) => v.user_id === userId),
        };
      });

      const budgetDtos = budgetOptions.map((option) => {
        const votes = budgetVotes.filter((v) => v.budget_option_id === option.id);
        return {
          id: option.id,
          label: `$${option.min_budget} - $${option.max_budget}`,
          min: option.min_budget,
          max: option.max_budget,
          votedCount: votes.length,
          totalMembers: memberCount,
          voters: votes.map((v) => ({ id: v.user_id })),
          selected: votes.some((v) => v.user_id === userId),
        };
      });

      const destinationMax = Math.max(0, ...destinationDtos.map((o) => o.votedCount));
      const dateMax = Math.max(0, ...dateDtos.map((o) => o.votedCount));
      const budgetMax = Math.max(0, ...budgetDtos.map((o) => o.votedCount));

      const budgetLeaders = budgetDtos.filter((o) => o.votedCount === budgetMax && budgetMax > 0);

      return res.json({
        group: {
          id: group.id,
          status: group.status,
          votingDeadline: group.voting_deadline,
          isVotingLocked: isVotingLocked(group),
        },
        destinations: {
          options: destinationDtos,
          hasTie: destinationDtos.filter((o) => o.votedCount === destinationMax && destinationMax > 0).length > 1,
        },
        dates: {
          options: dateDtos,
          hasTie: dateDtos.filter((o) => o.votedCount === dateMax && dateMax > 0).length > 1,
        },
        budget: {
          options: budgetDtos,
          hasTie: budgetLeaders.length > 1,
          hasConflict: budgetLeaders.length > 1,
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/options/:type', async (req, res, next) => {
    try {
      const type = String(req.params.type || '').trim();
      const groupId = String(req.body?.groupId || '').trim();
      const userId = String(req.body?.userId || '').trim();

      assertUuid(groupId, 'groupId');
      assertUuid(userId, 'userId');

      const group = await getGroupOrThrow(groupId);
      await assertMemberOrThrow(groupId, userId);
      await ensurePlanningAndOpenOrThrow(group);

      if (type === 'destination') {
        const destinationId = String(req.body?.destinationId || '').trim();
        if (!isValidUuid(destinationId)) {
          return res.status(400).json({ error: 'destinationId must be a valid UUID.' });
        }

        const { data, error } = await supabaseAdmin
          .from('destination_options')
          .insert({ group_id: groupId, destination_id: destinationId })
          .select('id, group_id, destination_id')
          .single();

        if (error) {
          const wrapped = new Error(error.message || 'Failed to create destination option.');
          wrapped.status = 502;
          throw wrapped;
        }

        return res.status(201).json(data);
      }

      if (type === 'date') {
        const startDate = String(req.body?.startDate || '').trim();
        const endDate = String(req.body?.endDate || '').trim();
        if (!startDate || !endDate) {
          return res.status(400).json({ error: 'startDate and endDate are required.' });
        }

        const { data, error } = await supabaseAdmin
          .from('date_options')
          .insert({ group_id: groupId, start_date: startDate, end_date: endDate })
          .select('id, group_id, start_date, end_date')
          .single();

        if (error) {
          const wrapped = new Error(error.message || 'Failed to create date option.');
          wrapped.status = 502;
          throw wrapped;
        }

        return res.status(201).json(data);
      }

      if (type === 'budget') {
        const minBudget = Number(req.body?.minBudget);
        const maxBudget = Number(req.body?.maxBudget);

        if (!Number.isFinite(minBudget) || !Number.isFinite(maxBudget) || minBudget < 0 || maxBudget < minBudget) {
          return res.status(400).json({ error: 'Invalid minBudget/maxBudget.' });
        }

        const { data, error } = await supabaseAdmin
          .from('budget_options')
          .insert({ group_id: groupId, min_budget: minBudget, max_budget: maxBudget })
          .select('id, group_id, min_budget, max_budget')
          .single();

        if (error) {
          const wrapped = new Error(error.message || 'Failed to create budget option.');
          wrapped.status = 502;
          throw wrapped;
        }

        return res.status(201).json(data);
      }

      return res.status(400).json({ error: 'Unsupported vote type.' });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/vote/:type/:optionId', async (req, res, next) => {
    try {
      const type = String(req.params.type || '').trim();
      const optionId = String(req.params.optionId || '').trim();
      const groupId = String(req.body?.groupId || '').trim();
      const userId = String(req.body?.userId || '').trim();

      assertUuid(groupId, 'groupId');
      assertUuid(userId, 'userId');
      assertUuid(optionId, 'optionId');

      const group = await getGroupOrThrow(groupId);
      await assertMemberOrThrow(groupId, userId);
      await ensurePlanningAndOpenOrThrow(group);

      if (type === 'destination') {
        const { error: clearError } = await supabaseAdmin
          .from('destination_votes')
          .delete()
          .eq('user_id', userId)
          .in(
            'destination_option_id',
            (await supabaseAdmin.from('destination_options').select('id').eq('group_id', groupId)).data?.map((row) => row.id) || [],
          );

        if (clearError) {
          const wrapped = new Error(clearError.message || 'Failed to clear previous destination vote.');
          wrapped.status = 502;
          throw wrapped;
        }

        const { data, error } = await supabaseAdmin
          .from('destination_votes')
          .insert({ destination_option_id: optionId, user_id: userId })
          .select('id, destination_option_id, user_id')
          .single();

        if (error) {
          const wrapped = new Error(error.message || 'Failed to submit destination vote.');
          wrapped.status = 502;
          throw wrapped;
        }

        return res.status(201).json(data);
      }

      if (type === 'date') {
        const { error: clearError } = await supabaseAdmin
          .from('date_votes')
          .delete()
          .eq('user_id', userId)
          .in(
            'date_option_id',
            (await supabaseAdmin.from('date_options').select('id').eq('group_id', groupId)).data?.map((row) => row.id) || [],
          );

        if (clearError) {
          const wrapped = new Error(clearError.message || 'Failed to clear previous date vote.');
          wrapped.status = 502;
          throw wrapped;
        }

        const { data, error } = await supabaseAdmin
          .from('date_votes')
          .insert({ date_option_id: optionId, user_id: userId })
          .select('id, date_option_id, user_id')
          .single();

        if (error) {
          const wrapped = new Error(error.message || 'Failed to submit date vote.');
          wrapped.status = 502;
          throw wrapped;
        }

        return res.status(201).json(data);
      }

      if (type === 'budget') {
        const { error: clearError } = await supabaseAdmin
          .from('budget_votes')
          .delete()
          .eq('user_id', userId)
          .in(
            'budget_option_id',
            (await supabaseAdmin.from('budget_options').select('id').eq('group_id', groupId)).data?.map((row) => row.id) || [],
          );

        if (clearError) {
          const wrapped = new Error(clearError.message || 'Failed to clear previous budget vote.');
          wrapped.status = 502;
          throw wrapped;
        }

        const { data, error } = await supabaseAdmin
          .from('budget_votes')
          .insert({ budget_option_id: optionId, user_id: userId })
          .select('id, budget_option_id, user_id')
          .single();

        if (error) {
          const wrapped = new Error(error.message || 'Failed to submit budget vote.');
          wrapped.status = 502;
          throw wrapped;
        }

        return res.status(201).json(data);
      }

      return res.status(400).json({ error: 'Unsupported vote type.' });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/finalize', async (req, res, next) => {
    try {
      const groupId = String(req.body?.groupId || '').trim();
      const userId = String(req.body?.userId || '').trim();

      assertUuid(groupId, 'groupId');
      assertUuid(userId, 'userId');

      const group = await getGroupOrThrow(groupId);
      await assertMemberOrThrow(groupId, userId);

      if (group.status !== 'planning') {
        return res.status(409).json({ error: 'Group is not in planning status.' });
      }

      if (!isVotingLocked(group)) {
        return res.status(409).json({ error: 'Voting cannot be finalized before the deadline.' });
      }

      const stateReq = {
        query: { groupId, userId },
      };

      const stateRes = {};
      let payload;
      await new Promise((resolve, reject) => {
        router.handle(
          { ...req, method: 'GET', url: '/state', query: stateReq.query },
          {
            status(code) {
              this.statusCode = code;
              return this;
            },
            json(body) {
              payload = body;
              resolve();
              return body;
            },
          },
          (err) => {
            if (err) reject(err);
            else resolve();
          },
        );
      });
      void stateRes;

      const destinationOptions = payload?.destinations?.options || [];
      const dateOptions = payload?.dates?.options || [];
      const budgetOptions = payload?.budget?.options || [];

      if (destinationOptions.length === 0 || dateOptions.length === 0 || budgetOptions.length === 0) {
        return res.status(409).json({ error: 'Cannot finalize voting with missing options.' });
      }

      const pickWinner = (options) => {
        const sorted = [...options].sort((a, b) => b.votedCount - a.votedCount);
        const top = sorted[0];
        if (!top || top.votedCount <= 0) return null;
        if (sorted.length > 1 && sorted[1].votedCount === top.votedCount) return null;
        return top;
      };

      const destinationWinner = pickWinner(destinationOptions);
      const dateWinner = pickWinner(dateOptions);
      const budgetWinner = pickWinner(budgetOptions);

      if (!destinationWinner || !dateWinner || !budgetWinner) {
        return res.status(409).json({ error: 'Voting conflict or tie detected. Resolve conflicts before finalizing.' });
      }

      const { data, error } = await supabaseAdmin
        .from('groups')
        .update({
          destination_place_id: destinationWinner.destinationId,
          start_date: dateWinner.startDate,
          end_date: dateWinner.endDate,
          min_budget: budgetWinner.min,
          max_budget: budgetWinner.max,
          status: 'active',
        })
        .eq('id', groupId)
        .select('id, status, destination_place_id, start_date, end_date, min_budget, max_budget')
        .single();

      if (error) {
        const wrapped = new Error(error.message || 'Failed to finalize voting.');
        wrapped.status = 502;
        throw wrapped;
      }

      const { data: members } = await supabaseAdmin
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);
      const recipients = (members || []).map((m) => m.user_id).filter(Boolean);

      await Promise.all(recipients.map((recipientId) =>
        createNotification(recipientId, 'voting_finalized', JSON.stringify({ deepLink: `/group-chat?groupId=${groupId}`, groupId })),
      ));

      if (group.voting_deadline) {
        await Promise.all(recipients.map((recipientId) =>
          createNotification(recipientId, 'voting_deadline', JSON.stringify({ deepLink: `/voting?groupId=${groupId}`, groupId, votingDeadline: group.voting_deadline })),
        ));
      }

      return res.json({ group: data });
    } catch (error) {
      return next(error);
    }
  });

  return router;
};
