import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav } from '@/components/ui/app-bottom-nav';
import { addGroupMember, fetchGroupMembers, fetchMyGroups, getActiveUserId } from '../../../lib/groups-api';
import {
  DUMMY_FRIENDS,
  Friend,
  Group,
} from '../friends/dummy-data';

const ACTIVE_USER_ID = getActiveUserId();

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TYPE_SCALE = Math.min(Math.max(SCREEN_WIDTH / 390, 0.9), 1.08);
const rs = (v: number) => Math.round(v * TYPE_SCALE);

const C = {
  background: '#FFFFFF',
  primary: '#008D9B',
  primaryLight: '#D7EDF0',
  text: '#111318',
  mutedText: '#8F949F',
  sectionLabel: '#8F949F',
  border: '#EBEBEB',
  searchBackground: '#F0F2F5',
  searchIcon: '#62707A',
  pillBackground: '#F0F2F5',
  cardBorder: '#EBEBEB',
} as const;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  screen: { flex: 1, backgroundColor: C.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: rs(16),
    paddingHorizontal: rs(24),
    paddingBottom: rs(14),
    gap: rs(12),
  },
  backButton: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: rs(22),
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.4,
    flex: 1,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.searchBackground,
    borderRadius: rs(14),
    paddingHorizontal: rs(14),
    height: rs(44),
    marginHorizontal: rs(24),
    marginBottom: rs(20),
    gap: rs(8),
  },
  searchInput: {
    flex: 1,
    fontSize: rs(15),
    color: C.text,
    paddingVertical: 0,
  },

  scrollContent: {
    paddingHorizontal: rs(24),
    paddingBottom: rs(120),
  },

  sectionLabel: {
    fontSize: rs(12),
    fontWeight: '700',
    color: C.sectionLabel,
    letterSpacing: 0.8,
    marginBottom: rs(14),
  },

  // Top friends row
  topRow: {
    flexDirection: 'row',
    gap: rs(16),
    marginBottom: rs(24),
  },
  topFriendItem: {
    alignItems: 'center',
    width: rs(64),
  },
  topAvatar: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(6),
    overflow: 'hidden',
  },
  topAvatarImage: { width: rs(56), height: rs(56), borderRadius: rs(28) },
  topAvatarText: { fontSize: rs(18), fontWeight: '700', color: C.primary },
  topFriendName: {
    fontSize: rs(12),
    fontWeight: '600',
    color: C.text,
    textAlign: 'center',
  },
  topFriendTrips: {
    fontSize: rs(11),
    color: C.mutedText,
    fontWeight: '500',
    textAlign: 'center',
  },

  // All friends list
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingVertical: rs(14),
    paddingHorizontal: rs(16),
    marginBottom: rs(10),
  },
  cardAvatar: {
    width: rs(46),
    height: rs(46),
    borderRadius: rs(23),
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
    overflow: 'hidden',
  },
  cardAvatarImage: { width: rs(46), height: rs(46), borderRadius: rs(23) },
  cardAvatarText: { fontSize: rs(16), fontWeight: '700', color: C.primary },
  cardInfo: { flex: 1 },
  cardName: { fontSize: rs(15), fontWeight: '700', color: C.text, letterSpacing: -0.2 },
  cardHandle: { fontSize: rs(13), color: C.mutedText, fontWeight: '500', marginTop: rs(2) },

  inviteButton: {
    paddingHorizontal: rs(18),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonSent: { backgroundColor: C.pillBackground },
  inviteButtonText: { fontSize: rs(13), fontWeight: '700', color: '#FFFFFF' },
  inviteButtonTextSent: { color: C.mutedText },

  emptyState: { alignItems: 'center', paddingVertical: rs(32) },
  emptyStateText: { fontSize: rs(14), color: C.mutedText, fontWeight: '500', marginTop: rs(8) },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function friendInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function FriendAvatar({ friend, size = 46 }: { friend: Friend; size?: number }) {
  return (
    <View style={[styles.cardAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {friend.avatarUrl ? (
        <Image source={{ uri: friend.avatarUrl }} style={[styles.cardAvatarImage, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <Text style={[styles.cardAvatarText, { fontSize: size * 0.35 }]}>{friendInitials(friend.fullName)}</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function InviteToGroupScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [group, setGroup] = React.useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [invitedIds, setInvitedIds] = React.useState<Set<string>>(new Set());
  const [sendingIds, setSendingIds] = React.useState<Set<string>>(new Set());

  // Load group to know who's already a member
  React.useEffect(() => {
    if (groupId) {
      void (async () => {
        const [{ groups }, { members }] = await Promise.all([
          fetchMyGroups(),
          fetchGroupMembers(groupId),
        ]);
        const row = groups.find((g) => g.id === groupId) ?? null;
        if (!row) {
          setGroup(null);
          return;
        }

        setGroup({
          id: row.id,
          name: row.name ?? 'Group',
          adminId: row.created_by ?? '',
          members: members.map((m) => ({ id: m.user_id, fullName: `Member ${m.user_id.slice(0, 4)}`, username: m.user_id.slice(0, 8), avatarUrl: null, tripCount: 0, role: m.user_id === row.created_by ? 'admin' : 'member' })),
          status: row.status === 'completed' ? 'completed' : row.status === 'active' ? 'active' : 'upcoming',
          votingOpen: row.status === 'planning',
          places: [],
          dateRange: null,
          budgetRange: null,
          destination: null,
        });
      })();
    }
  }, [groupId]);

  const alreadyMemberIds = React.useMemo(
    () => new Set(group?.members.map((m) => m.id) ?? []),
    [group],
  );

  const eligibleFriends = React.useMemo(
    () => DUMMY_FRIENDS.filter((f) => !alreadyMemberIds.has(f.id)),
    [alreadyMemberIds],
  );

  const filteredFriends = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return eligibleFriends;
    return eligibleFriends.filter(
      (f) => f.fullName.toLowerCase().includes(q) || f.username.toLowerCase().includes(q),
    );
  }, [eligibleFriends, searchQuery]);

  const topFriends = eligibleFriends.slice(0, 3);

  const handleInvite = async (friend: Friend) => {
    if (!groupId || invitedIds.has(friend.id)) return;
    setSendingIds((prev) => new Set(prev).add(friend.id));
    try {
      await addGroupMember(groupId, ACTIVE_USER_ID, ACTIVE_USER_ID);
      setInvitedIds((prev) => new Set(prev).add(friend.id));
    } finally {
      setSendingIds((prev) => { const n = new Set(prev); n.delete(friend.id); return n; });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
            <Feather name="arrow-left" size={18} color="#111318" />
          </Pressable>
          <Text style={styles.title}>Add to Group</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or username..."
            placeholderTextColor={C.mutedText}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          <Feather name="search" size={18} color={C.searchIcon} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Top friends */}
          {!searchQuery && topFriends.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>TOP</Text>
              <View style={styles.topRow}>
                {topFriends.map((f) => (
                  <Pressable key={f.id} style={styles.topFriendItem} onPress={() => handleInvite(f)}>
                    <View style={styles.topAvatar}>
                      {f.avatarUrl
                        ? <Image source={{ uri: f.avatarUrl }} style={styles.topAvatarImage} />
                        : <Text style={styles.topAvatarText}>{friendInitials(f.fullName)}</Text>
                      }
                    </View>
                    <Text style={styles.topFriendName} numberOfLines={1}>
                      {f.fullName.split(' ')[0]} {f.fullName.split(' ')[1]?.[0]}.
                    </Text>
                    <Text style={styles.topFriendTrips}>{f.tripCount} trips</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* All friends list */}
          <Text style={styles.sectionLabel}>ALL</Text>

          {filteredFriends.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="users" size={28} color={C.mutedText} />
              <Text style={styles.emptyStateText}>No friends to invite</Text>
            </View>
          ) : (
            filteredFriends.map((friend) => {
              const sent = invitedIds.has(friend.id);
              const sending = sendingIds.has(friend.id);
              return (
                <View key={friend.id} style={styles.card}>
                  <FriendAvatar friend={friend} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{friend.fullName}</Text>
                    <Text style={styles.cardHandle}>@{friend.username}</Text>
                  </View>
                  {sending ? (
                    <ActivityIndicator size="small" color={C.primary} />
                  ) : (
                    <Pressable
                      style={[styles.inviteButton, sent && styles.inviteButtonSent]}
                      onPress={() => handleInvite(friend)}
                      disabled={sent}
                      accessibilityRole="button">
                      <Text style={[styles.inviteButtonText, sent && styles.inviteButtonTextSent]}>
                        {sent ? 'Invited' : 'Invite'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        <AppBottomNav activeTab="Groups" />
      </View>
    </SafeAreaView>
  );
}
