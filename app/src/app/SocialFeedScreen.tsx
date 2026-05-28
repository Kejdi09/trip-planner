import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { FeedItem } from '../../lib/feed-api';
import { fetchFriendActivityFeed } from '../../lib/feed-api';
import { fetchIncomingPendingRequestCount, fetchUnreadNotificationCount } from '../../lib/notifications-api';
import { supabase } from '../../lib/supabase';

const PAGE_SIZE = 20;

const C = {
  primary: '#008D9B',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  mutedSurface: '#E8F4F5',
  star: '#F59E0B',
};

function formatPlaceRegion(city: string | null, country: string | null) {
  return [city, country].filter(Boolean).join(', ');
}

function getActorName(item: FeedItem) {
  return item.actor.fullName || item.actor.username || 'A friend';
}

function getInitials(item: FeedItem) {
  const name = getActorName(item).trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatTimeAgo(value: string) {
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
}

function actionText(item: FeedItem) {
  if (item.type === 'review') return 'reviewed';
  if (item.type === 'planned') return 'is planning a trip to';
  return 'saved';
}

const ActivityCard: React.FC<{ item: FeedItem; onPress: () => void }> = ({ item, onPress }) => {
  const actorName = getActorName(item);
  const region = formatPlaceRegion(item.place.city, item.place.country);

  return (
    <TouchableOpacity style={aStyles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={aStyles.header}>
        {item.actor.avatarUrl ? (
          <Image source={{ uri: item.actor.avatarUrl }} style={aStyles.avatarImage} accessibilityLabel={`${actorName} avatar`} />
        ) : (
          <View style={aStyles.avatarPlaceholder}>
            <Text style={aStyles.initials}>{getInitials(item)}</Text>
          </View>
        )}
        <View style={aStyles.meta}>
          <Text style={aStyles.userName}>{actorName}</Text>
          <Text style={aStyles.action}>
            {actionText(item)} <Text style={aStyles.destination}>{item.place.title}</Text>
          </Text>
        </View>
        <Text style={aStyles.time}>{formatTimeAgo(item.createdAt)}</Text>
      </View>

      {item.place.imageUrl ? (
        <Image source={{ uri: item.place.imageUrl }} style={aStyles.image} resizeMode="cover" accessibilityLabel={`${item.place.title} image`} />
      ) : (
        <View style={aStyles.imagePlaceholder}>
          <Ionicons name="image-outline" size={28} color={C.textSecondary} />
          <Text style={aStyles.placeholderText}>{item.place.title}</Text>
        </View>
      )}

      <View style={aStyles.body}>
        <View style={aStyles.placeRow}>
          <Text style={aStyles.placeTitle}>{item.place.title}</Text>
          {item.rating != null ? (
            <View style={aStyles.ratingPill}>
              <Ionicons name="star" size={12} color={C.star} />
              <Text style={aStyles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        {region ? <Text style={aStyles.region}>{region}</Text> : null}
        {item.text ? <Text style={aStyles.reviewText} numberOfLines={2}>{item.text}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const aStyles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.mutedSurface,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
  },
  initials: { fontSize: 13, fontWeight: '700', color: '#fff' },
  meta: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  action: { fontSize: 12, color: C.textSecondary, marginTop: 1 },
  destination: { fontWeight: '600', color: C.textPrimary },
  time: { fontSize: 11, color: C.textMuted },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: C.border,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: C.mutedSurface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: { fontSize: 13, fontWeight: '700', color: C.textSecondary },
  body: { padding: 12, paddingTop: 10 },
  placeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  placeTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.textPrimary },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF7ED', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  ratingText: { fontSize: 12, fontWeight: '700', color: C.textPrimary },
  region: { marginTop: 2, fontSize: 12, color: C.textSecondary },
  reviewText: { marginTop: 8, fontSize: 13, lineHeight: 18, color: C.textSecondary },
});

const SocialFeedScreen: React.FC = () => {
  const [notifCount, setNotifCount] = React.useState(0);
  const [friendRequestCount, setFriendRequestCount] = React.useState(0);
  const [items, setItems] = React.useState<FeedItem[]>([]);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadCounts = React.useCallback(async () => {
    try {
      const [notifications, requests] = await Promise.all([
        fetchUnreadNotificationCount(),
        fetchIncomingPendingRequestCount(),
      ]);
      setNotifCount(notifications);
      setFriendRequestCount(requests);
    } catch {
      setNotifCount(0);
      setFriendRequestCount(0);
    }
  }, []);

  const loadFeed = React.useCallback(async (nextUserId: string, offset = 0, append = false) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const rows = await fetchFriendActivityFeed({ userId: nextUserId, limit: PAGE_SIZE, offset });
      setItems((current) => (append ? [...current, ...rows] : rows));
      setHasMore(rows.length === PAGE_SIZE);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load friend activity.';
      setErrorMessage(message);
      if (!append) setItems([]);
    } finally {
      if (append) setIsLoadingMore(false);
      else setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      await loadCounts();
      const { data } = await supabase.auth.getUser();
      const currentUserId = data.user?.id ?? null;
      if (!mounted) return;
      setUserId(currentUserId);
      if (currentUserId) {
        await loadFeed(currentUserId);
      } else {
        setIsLoading(false);
        setItems([]);
      }
    })();
    return () => { mounted = false; };
  }, [loadCounts, loadFeed]);

  const refresh = async () => {
    if (!userId) return;
    setIsRefreshing(true);
    await Promise.all([loadCounts(), loadFeed(userId)]);
    setIsRefreshing(false);
  };

  const loadMore = () => {
    if (!userId || isLoadingMore || !hasMore) return;
    void loadFeed(userId, items.length, true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={C.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.appName}>TripSync</Text>
          <TouchableOpacity style={styles.notifBtn} accessibilityLabel="Notifications" onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={26} color={C.textPrimary} />
            {notifCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{notifCount > 99 ? '99+' : notifCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Friends&apos; Activity</Text>
            <TouchableOpacity accessibilityLabel="Add friend" onPress={() => router.push('/add-friends')} style={styles.friendButton}>
              <Ionicons name="person-add-outline" size={22} color={C.textSecondary} />
              {friendRequestCount > 0 ? <View style={styles.friendBadge}><Text style={styles.friendBadgeText}>{friendRequestCount > 99 ? '99+' : friendRequestCount}</Text></View> : null}
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.statusCard}>
              <ActivityIndicator color={C.primary} />
              <Text style={styles.statusText}>Loading friend activity...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.statusCard}>
              <Ionicons name="alert-circle-outline" size={24} color={C.textSecondary} />
              <Text style={styles.statusText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => userId && loadFeed(userId)}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.statusCard}>
              <Ionicons name="people-outline" size={28} color={C.textSecondary} />
              <Text style={styles.emptyTitle}>No friend activity yet.</Text>
              <Text style={styles.statusText}>Add friends or start reviewing places.</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => router.push('/add-friends')}>
                <Text style={styles.retryText}>Find friends</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {items.map((item) => (
                <ActivityCard key={item.id} item={item} onPress={() => router.push({ pathname: '/destination-overview', params: { id: item.place.id } })} />
              ))}
              {hasMore ? (
                <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore} disabled={isLoadingMore}>
                  <Text style={styles.loadMoreText}>{isLoadingMore ? 'Loading...' : 'Load more'}</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 110 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: C.surface,
  },
  appName: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  notifBtn: { position: 'relative', padding: 4 },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: C.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  friendButton: { position: 'relative', padding: 4 },
  friendBadge: { position: 'absolute', top: -4, right: -8, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  friendBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusCard: {
    minHeight: 170,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  statusText: { fontSize: 13, color: C.textSecondary, textAlign: 'center', lineHeight: 18 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, textAlign: 'center' },
  retryButton: { marginTop: 4, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: C.primary },
  retryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  loadMoreButton: {
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.primary,
    backgroundColor: C.surface,
  },
  loadMoreText: { color: C.primary, fontSize: 13, fontWeight: '700' },
});

export default SocialFeedScreen;
