import React, { useState } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrendingDestination {
  id: string;
  name: string;
  visits: string;
  image: string;
}

interface ActivityPost {
  id: string;
  userInitials: string;
  userColor: string;
  userName: string;
  action: string;
  destination: string;
  timeAgo: string;
  image: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const TRENDING: TrendingDestination[] = [
  {
    id: 't1',
    name: 'Bali',
    visits: '2.3k visits',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=120&h=120&fit=crop',
  },
  {
    id: 't2',
    name: 'Tokyo',
    visits: '2.3k visits',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&h=120&fit=crop',
  },
  {
    id: 't3',
    name: 'Paris',
    visits: '2.3k visits',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=120&h=120&fit=crop',
  },
];

const ACTIVITY: ActivityPost[] = [
  {
    id: 'a1',
    userInitials: 'SM',
    userColor: '#6B9E8F',
    userName: 'Sarah M.',
    action: 'visited',
    destination: 'Santorini',
    timeAgo: '2h ago',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=240&fit=crop',
  },
  {
    id: 'a2',
    userInitials: 'JK',
    userColor: '#8B7BB5',
    userName: 'Jake K.',
    action: 'planning a trip to',
    destination: 'Kyoto',
    timeAgo: '4h ago',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=240&fit=crop',
  },
  {
    id: 'a3',
    userInitials: 'MR',
    userColor: '#C47E6B',
    userName: 'Mia R.',
    action: 'visited',
    destination: 'Amsterdam',
    timeAgo: '1d ago',
    image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=240&fit=crop',
  },
];

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  primary: '#008D9B',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
};

// ─── Trending Card ────────────────────────────────────────────────────────────
const TrendingCard: React.FC<{ item: TrendingDestination; onPress: () => void }> = ({ item, onPress }) => (
  <TouchableOpacity style={tStyles.card} activeOpacity={0.85} onPress={onPress}>
    <View style={tStyles.imageWrapper}>
      <Image source={{ uri: item.image }} style={tStyles.image} resizeMode="cover" />
    </View>
    <Text style={tStyles.name}>{item.name}</Text>
    <Text style={tStyles.visits}>{item.visits}</Text>
  </TouchableOpacity>
);

const tStyles = StyleSheet.create({
  card: {
    alignItems: 'center',
    marginRight: 12,
    width: 100,
  },
  imageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#E8F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  name: { fontSize: 13, fontWeight: '600', color: C.textPrimary, textAlign: 'center' },
  visits: { fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 2 },
});

// ─── Activity Card ────────────────────────────────────────────────────────────
const ActivityCard: React.FC<{ post: ActivityPost; onPress: () => void }> = ({ post, onPress }) => (
  <TouchableOpacity style={aStyles.card} activeOpacity={0.9} onPress={onPress}>
    <View style={aStyles.header}>
      <View style={[aStyles.avatar, { backgroundColor: post.userColor }]}>
        <Text style={aStyles.initials}>{post.userInitials}</Text>
      </View>
      <View style={aStyles.meta}>
        <Text style={aStyles.userName}>{post.userName}</Text>
        <Text style={aStyles.action}>
          {post.action}{' '}
          <Text style={aStyles.destination}>{post.destination}</Text>
        </Text>
      </View>
      <Text style={aStyles.time}>{post.timeAgo}</Text>
    </View>
    <Image source={{ uri: post.image }} style={aStyles.image} resizeMode="cover" />
  </TouchableOpacity>
);

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
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
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
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const SocialFeedScreen: React.FC = () => {
  const [notifCount] = useState(3);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Header — no logo, just title + bell */}
        <View style={styles.header}>
  <Text style={styles.appName}>TripSync</Text>
  <TouchableOpacity style={styles.notifBtn} accessibilityLabel="Notifications">
    <Ionicons name="notifications-outline" size={26} color={C.textPrimary} />
    {notifCount > 0 && (
      <View style={styles.notifBadge}>
        <Text style={styles.notifBadgeText}>{notifCount}</Text>
      </View>
    )}
  </TouchableOpacity>
</View>
          
        {/* Trending Now */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="trending-up" size={20} color={C.primary} />
            <Text style={styles.sectionTitle}>Trending Now</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingRow}
          >
            {TRENDING.map((item) => (
              <TrendingCard key={item.id} item={item} onPress={() => router.push('/destination-overview')} />
            ))}
          </ScrollView>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Friends' Activity */}
        <View style={styles.section}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Friends&apos; Activity</Text>
            <TouchableOpacity accessibilityLabel="Add friend" onPress={() => router.push('/add-friends')}>
              <Ionicons name="person-add-outline" size={22} color={C.textSecondary} />
            </TouchableOpacity>
          </View>
          {ACTIVITY.map((post) => (
            <ActivityCard key={post.id} post={post} onPress={() => router.push('/profile')} />
          ))}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 90 },

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

  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  trendingRow: { paddingBottom: 4 },
  divider: { height: 1, backgroundColor: C.border, marginTop: 16 },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
});

export default SocialFeedScreen;
