import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLoading } from '@/components/common/AppLoading';
import {
  clearNotifications,
  deleteNotification,
  fetchNotifications,
  markNotificationRead,
  type AppNotification,
} from '../../../lib/notifications-api';

const C = {
  background: '#F8FCFD',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  subtle: '#94A3B8',
  border: '#E2E8F0',
  primary: '#008D9B',
  danger: '#BE123C',
};

const isJsonLike = (value: string) => {
  const trimmed = value.trim();
  return (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
};

const safePlainText = (value?: string | null) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  if (!isJsonLike(trimmed)) return trimmed;
  try {
    const parsed = JSON.parse(trimmed) as { title?: unknown; body?: unknown; message?: unknown };
    const text = parsed.title ?? parsed.body ?? parsed.message;
    return typeof text === 'string' && !isJsonLike(text) ? text.trim() || null : null;
  } catch {
    return null;
  }
};

const parseContent = (content: string | null, title?: string | null, body?: string | null) => {
  const contentText = safePlainText(content);
  return {
    title: safePlainText(title) ?? contentText ?? 'Notification',
    body: safePlainText(body) ?? (!safePlainText(title) ? null : contentText) ?? '',
  };
};

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m ago`;
  if (diffMs < day) return `${Math.max(1, Math.floor(diffMs / hour))}h ago`;
  if (diffMs < 7 * day) return `${Math.max(1, Math.floor(diffMs / day))}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export function NotificationsScreen() {
  const [items, setItems] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isClearing, setIsClearing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      setItems(await fetchNotifications());
    } catch {
      setItems([]);
      setErrorMessage('Unable to load notifications right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const handleClearAll = async () => {
    if (items.length === 0 || isClearing) return;
    const previous = items;
    setIsClearing(true);
    setItems([]);
    setErrorMessage(null);
    try {
      await clearNotifications();
    } catch {
      setItems(previous);
      setErrorMessage('Unable to clear notifications right now.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDelete = async (notification: AppNotification) => {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== notification.id));
    setErrorMessage(null);
    try {
      await deleteNotification(notification.id);
    } catch {
      setItems(previous);
      setErrorMessage('Unable to delete that notification.');
    }
  };

  const handlePressNotification = async (notification: AppNotification) => {
    if (!notification.is_read) {
      setItems((current) => current.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)));
      await markNotificationRead(notification.id);
    }

    if ((notification.related_entity_type === 'group' || notification.related_entity_type === 'trip_deadline') && notification.related_entity_id) {
      router.push({ pathname: '/group-hub', params: { groupId: notification.related_entity_id } });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppLoading message="Loading notifications..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable disabled={items.length === 0 || isClearing} onPress={handleClearAll} hitSlop={10}>
          <Text style={[styles.clearText, (items.length === 0 || isClearing) && styles.disabledText]}>
            {isClearing ? 'Clearing…' : 'Clear all'}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="bell" size={24} color={C.primary} />
            <Text style={styles.emptyTitle}>No notifications yet.</Text>
            <Text style={styles.emptyBody}>Friend requests, trip updates, reviews, and messages will show up here.</Text>
          </View>
        ) : items.map((notification) => {
          const content = parseContent(notification.content, notification.title, notification.body);
          return (
            <Pressable
              key={notification.id}
              onPress={() => { void handlePressNotification(notification); }}
              style={[styles.card, !notification.is_read && styles.unreadCard]}>
              <View style={styles.cardTopRow}>
                <View style={[styles.unreadDot, notification.is_read && styles.readDot]} />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{content.title}</Text>
                  {content.body ? <Text style={styles.cardBody}>{content.body}</Text> : null}
                  <Text style={styles.timeText}>{formatTime(notification.created_at)}{notification.is_read ? ' · Read' : ' · Unread'}</Text>
                </View>
                <Pressable
                  accessibilityLabel="Delete notification"
                  style={styles.deleteButton}
                  hitSlop={8}
                  onPress={(event) => {
                    event.stopPropagation?.();
                    void handleDelete(notification);
                  }}>
                  <Feather name="x" size={15} color={C.muted} />
                </Pressable>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  clearText: { color: C.primary, fontWeight: '800', fontSize: 13 },
  disabledText: { color: C.subtle },
  content: { padding: 16, paddingBottom: 132 },
  errorText: { color: C.danger, fontWeight: '700', marginBottom: 12 },
  emptyCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    alignItems: 'center',
  },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: '800', color: C.text },
  emptyBody: { marginTop: 6, textAlign: 'center', fontSize: 13, lineHeight: 19, color: C.muted },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },
  unreadCard: { borderColor: '#7DD3FC', backgroundColor: '#F8FEFF' },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginTop: 6 },
  readDot: { backgroundColor: C.border },
  cardText: { flex: 1 },
  cardTitle: { fontWeight: '800', color: C.text, fontSize: 14 },
  cardBody: { color: '#475569', marginTop: 4, fontSize: 13, lineHeight: 18 },
  timeText: { color: C.subtle, marginTop: 8, fontSize: 12, fontWeight: '600' },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
