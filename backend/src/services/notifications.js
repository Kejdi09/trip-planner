const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function shortPreview(value, max = 120) {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}…`;
}

function isJsonLike(value) {
  const text = String(value || '').trim();
  return (text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'));
}

function safeNotificationText(value, fallback = '') {
  const text = String(value || '').trim();
  if (!text || isJsonLike(text)) return fallback;
  return text;
}

function notificationContent(title, body) {
  return JSON.stringify({ title, body });
}

function dedupeQuery(query, { userId, type, relatedEntityType, relatedEntityId }) {
  let next = query.eq('user_id', userId).eq('type', type);
  if (relatedEntityType) next = next.eq('related_entity_type', relatedEntityType);
  else next = next.is('related_entity_type', null);
  if (relatedEntityId) next = next.eq('related_entity_id', relatedEntityId);
  else next = next.is('related_entity_id', null);
  return next;
}

function createNotificationService(supabaseAdmin) {
  async function sendPushNotification({ userId, type, title, body, relatedEntityType = null, relatedEntityId = null }) {
    const { data: tokens, error } = await supabaseAdmin
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId);

    if (error) {
      console.warn('[notifications] failed to load push tokens', { userId, error: error.message });
      return;
    }

    const uniqueTokens = Array.from(new Set((tokens || []).map((row) => row.token).filter(Boolean)));
    if (uniqueTokens.length === 0) return;

    const payload = uniqueTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: { type, relatedEntityType, relatedEntityId },
    }));

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.warn('[notifications] expo push failed', { status: response.status, body: shortPreview(text, 500) });
      }
    } catch (error) {
      console.warn('[notifications] expo push request failed', { error: error?.message || String(error) });
    }
  }

  async function createNotification({
    userId,
    type,
    title,
    body,
    relatedEntityType = null,
    relatedEntityId = null,
    push = true,
  }) {
    if (!userId || !type || !title) return null;
    const safeTitle = safeNotificationText(title, 'Notification');
    const safeBody = safeNotificationText(body, '');

    if (relatedEntityId) {
      const { data: existing, error: existingError } = await dedupeQuery(
        supabaseAdmin.from('notifications').select('id').limit(1),
        { userId, type, relatedEntityType, relatedEntityId },
      );
      if (existingError) {
        console.warn('[notifications] dedupe lookup failed', { userId, type, error: existingError.message });
      }
      if ((existing || []).length > 0) return existing[0];
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title: safeTitle,
        body: safeBody,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        content: notificationContent(safeTitle, safeBody),
      })
      .select('id, user_id, type, title, body, related_entity_type, related_entity_id, content, is_read, created_at')
      .single();

    if (error) {
      console.error('[notifications] insert failed', { userId, type, error: error.message });
      return null;
    }

    if (push) {
      void sendPushNotification({ userId, type, title: safeTitle, body: safeBody, relatedEntityType, relatedEntityId });
    }

    return data;
  }

  async function notifyAcceptedFriends({ actorId, type, title, body, relatedEntityType, relatedEntityId, push = true }) {
    const { data: friendships, error } = await supabaseAdmin
      .from('friendships')
      .select('requester_id, receiver_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${actorId},receiver_id.eq.${actorId}`);

    if (error) {
      console.warn('[notifications] failed to load friends', { actorId, error: error.message });
      return;
    }

    const recipients = new Set();
    for (const row of friendships || []) {
      const other = row.requester_id === actorId ? row.receiver_id : row.requester_id;
      if (other && other !== actorId) recipients.add(other);
    }

    await Promise.all(Array.from(recipients).map((userId) => createNotification({
      userId,
      type,
      title,
      body,
      relatedEntityType,
      relatedEntityId,
      push,
    })));
  }

  return { createNotification, notifyAcceptedFriends, sendPushNotification };
}

module.exports = { createNotificationService, shortPreview };
