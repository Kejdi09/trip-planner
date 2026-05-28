import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../../lib/supabase';
import { AppLoading } from '@/components/common/AppLoading';

type Friend = { id: string; friendshipId: string; fullName: string; username: string; avatarUrl: string | null; tripCount: number };

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
  cardBorder: '#EBEBEB',
  removeButton: '#F0F2F5',
  removeIcon: '#8F949F',
} as const;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  screen: { flex: 1, backgroundColor: C.background },

  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: rs(16),
    paddingHorizontal: rs(24),
    paddingBottom: rs(14),
    gap: rs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E7E7E7',
    marginBottom: rs(16),
  },
  backButton: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: C.removeButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: rs(22),
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.4,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.searchBackground,
    borderRadius: rs(14),
    paddingHorizontal: rs(14),
    height: rs(44),
    width: '100%',
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
  topItem: { alignItems: 'center', width: rs(64) },
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
  topName: { fontSize: rs(12), fontWeight: '600', color: C.text, textAlign: 'center' },
  topTrips: { fontSize: rs(11), color: C.mutedText, fontWeight: '500', textAlign: 'center' },

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

  removeButton: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: C.removeButton,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: { alignItems: 'center', paddingVertical: rs(32) },
  emptyStateText: { fontSize: rs(14), color: C.mutedText, fontWeight: '500', marginTop: rs(8), textAlign: 'center' },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: rs(18),
    backgroundColor: '#FFFFFF',
    padding: rs(18),
    borderWidth: 1,
    borderColor: C.border,
  },
  title: { fontSize: rs(17), fontWeight: '800', color: C.text },
  body: { marginTop: rs(8), fontSize: rs(14), lineHeight: rs(20), color: C.mutedText },
  errorText: { marginTop: rs(10), color: '#BE123C', fontSize: rs(12), fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: rs(10), marginTop: rs(18) },
  cancelButton: { paddingHorizontal: rs(14), paddingVertical: rs(10), borderRadius: rs(12), backgroundColor: C.removeButton },
  cancelText: { color: C.text, fontSize: rs(13), fontWeight: '800' },
  removeConfirmButton: { paddingHorizontal: rs(14), paddingVertical: rs(10), borderRadius: rs(12), backgroundColor: '#BE123C' },
  removeConfirmText: { color: '#FFFFFF', fontSize: rs(13), fontWeight: '800' },
  disabledButton: { opacity: 0.65 },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function friendInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function Avatar({ friend, size = 46 }: { friend: Friend; size?: number }) {
  return (
    <View style={[styles.cardAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {friend.avatarUrl
        ? <Image source={{ uri: friend.avatarUrl }} style={[styles.cardAvatarImage, { width: size, height: size, borderRadius: size / 2 }]} />
        : <Text style={[styles.cardAvatarText, { fontSize: size * 0.35 }]}>{friendInitials(friend.fullName)}</Text>
      }
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function MyFriendsScreen() {
  const [friends, setFriends] = React.useState<Friend[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [removingIds, setRemovingIds] = React.useState<Set<string>>(new Set());
  const [removeError, setRemoveError] = React.useState<string | null>(null);
  const [friendToRemove, setFriendToRemove] = React.useState<Friend | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const me = auth.user?.id;
        if (!me) return;

        const { data: rows } = await supabase
          .from('friendships')
          .select('id, requester_id, receiver_id')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${me},receiver_id.eq.${me}`);

        const friendshipByFriendId = new Map<string, string>();
        (rows ?? []).forEach((row) => {
          const friendId = row.requester_id === me ? row.receiver_id : row.requester_id;
          friendshipByFriendId.set(friendId, row.id);
        });
        const friendIds = Array.from(friendshipByFriendId.keys());
        if (friendIds.length === 0) {
          setFriends([]);
          return;
        }

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', friendIds);

        setFriends((profiles ?? []).flatMap((p) => {
          const friendshipId = friendshipByFriendId.get(p.id);
          if (!friendshipId) {
            console.warn('[friends] missing friendship row id for profile', { profileId: p.id });
            return [];
          }
          return [{
            id: p.id,
            friendshipId,
            fullName: p.full_name ?? p.username ?? 'User',
            username: p.username ?? 'user',
            avatarUrl: p.avatar_url ?? null,
            tripCount: 0,
          }];
        }));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) => f.fullName.toLowerCase().includes(q) || f.username.toLowerCase().includes(q),
    );
  }, [friends, searchQuery]);

  // Top 3 by tripCount
  const topFriends = [...friends].sort((a, b) => b.tripCount - a.tripCount).slice(0, 3);

  const removeFriend = async (friend: Friend) => {
    if (removingIds.has(friend.id)) return false;
    setRemoveError(null);
    setRemovingIds((prev) => new Set(prev).add(friend.id));
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData.user?.id ?? null;
    console.log('[friends] removing friend', {
      currentUserId,
      friendId: friend.id,
      friendshipId: friend.friendshipId,
    });

    const { data, error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friend.friendshipId)
      .select('id');
    console.log('[friends] delete result', { data, error });

    if (error) {
      console.error('Failed to delete friendship row', {
        friendId: friend.id,
        friendshipId: friend.friendshipId,
        error,
      });
      setRemoveError('Could not remove friend. Please try again.');
    } else if (!data || data.length === 0) {
      console.error('Delete matched zero friendship rows', {
        friendId: friend.id,
        friendshipId: friend.friendshipId,
      });
      const { data: existingRows, error: existingError } = await supabase
        .from('friendships')
        .select('id, requester_id, receiver_id, status')
        .eq('id', friend.friendshipId);
      console.log('[friends] row after failed delete', { existingRows, existingError });
      setRemoveError('Could not remove friend. No friendship row was deleted.');
    } else {
      setFriends((prev) => prev.filter((f) => f.id !== friend.id));
      setFriendToRemove(null);
      setRemovingIds((prev) => { const n = new Set(prev); n.delete(friend.id); return n; });
      return true;
    }
    setRemovingIds((prev) => { const n = new Set(prev); n.delete(friend.id); return n; });
    return false;
  };

  const handleRemove = (friend: Friend) => {
    setRemoveError(null);
    setFriendToRemove(friend);
  };

  const closeRemoveModal = () => {
    if (friendToRemove && removingIds.has(friendToRemove.id)) return;
    setFriendToRemove(null);
    setRemoveError(null);
  };

  const confirmRemoveFriend = () => {
    if (!friendToRemove) return;
    void removeFriend(friendToRemove);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        {/* Header & Search*/}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
            <Feather name="arrow-left" size={18} color="#111318" />
          </Pressable>
          <Text style={styles.title}>My Friends</Text>

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
        </View>

        {loading ? (
          <AppLoading message="Loading your friends..." />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            {/* Top friends */}
            {!searchQuery && topFriends.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>TOP</Text>
                <View style={styles.topRow}>
                  {topFriends.map((f) => (
                    <View key={f.id} style={styles.topItem}>
                      <View style={styles.topAvatar}>
                        {f.avatarUrl
                          ? <Image source={{ uri: f.avatarUrl }} style={styles.topAvatarImage} />
                          : <Text style={styles.topAvatarText}>{friendInitials(f.fullName)}</Text>
                        }
                      </View>
                      <Text style={styles.topName} numberOfLines={1}>
                        {f.fullName.split(' ')[0]} {f.fullName.split(' ')[1]?.[0]}.
                      </Text>
                      <Text style={styles.topTrips}>{f.tripCount} trips</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* All friends */}
            <Text style={styles.sectionLabel}>ALL</Text>
            {removeError ? <Text style={{ color: '#BE123C', marginBottom: rs(10), fontWeight: '600' }}>{removeError}</Text> : null}

            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="users" size={28} color={C.mutedText} />
                <Text style={styles.emptyStateText}>
                  {searchQuery ? `No friends found for "${searchQuery.trim()}"` : 'No friends yet'}
                </Text>
              </View>
            ) : (
              filtered.map((friend) => (
                <View key={friend.id} style={styles.card}>
                  <Pressable style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={() => router.push({ pathname: '/user-profile/[userId]', params: { userId: friend.id } })}>
                    <Avatar friend={friend} />
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{friend.fullName}</Text>
                      <Text style={styles.cardHandle}>@{friend.username}</Text>
                    </View>
                  </Pressable>
                  {removingIds.has(friend.id) ? (
                    <ActivityIndicator size="small" color={C.primary} />
                  ) : (
                    <Pressable
                      style={styles.removeButton}
                      onPress={(event) => { event.stopPropagation?.(); handleRemove(friend); }}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${friend.fullName}`}
                      disabled={removingIds.has(friend.id)}
                      hitSlop={10}>
                      <Feather name="x" size={16} color={C.removeIcon} />
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        )}

        <Modal visible={Boolean(friendToRemove)} transparent animationType="fade" onRequestClose={closeRemoveModal}>
          <Pressable style={modalStyles.backdrop} onPress={closeRemoveModal}>
            <Pressable style={modalStyles.card} onPress={(event) => event.stopPropagation()}>
              <Text style={modalStyles.title}>Remove friend?</Text>
              <Text style={modalStyles.body}>
                Remove {friendToRemove?.fullName ?? 'this friend'} from your friends? You can always add them again later.
              </Text>
              {removeError ? <Text style={modalStyles.errorText}>{removeError}</Text> : null}
              <View style={modalStyles.actions}>
                <Pressable style={modalStyles.cancelButton} onPress={closeRemoveModal} disabled={Boolean(friendToRemove && removingIds.has(friendToRemove.id))}>
                  <Text style={modalStyles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[modalStyles.removeConfirmButton, friendToRemove && removingIds.has(friendToRemove.id) && modalStyles.disabledButton]}
                  onPress={confirmRemoveFriend}
                  disabled={Boolean(friendToRemove && removingIds.has(friendToRemove.id))}>
                  <Text style={modalStyles.removeConfirmText}>{friendToRemove && removingIds.has(friendToRemove.id) ? 'Removing…' : 'Remove'}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
