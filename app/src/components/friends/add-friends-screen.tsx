import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  acceptFriendRequest,
  declineFriendRequest,
  fetchIncomingFriendRequests,
  FriendRequest,
  searchUsers,
  sendFriendRequest,
  UserSearchResult,
} from './add-friends';
import { COLORS, styles } from './add-friends-screen.styles';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type AvatarProps = { uri: string | null; name: string; size?: number };

function Avatar({ uri, name, size = 46 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.avatarWrapper,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <Text
          style={{
            fontSize: size * 0.35,
            fontWeight: '700',
            color: COLORS.avatarIcon,
          }}>
          {initials}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Friend Request Card
// ---------------------------------------------------------------------------

type FriendRequestCardProps = {
  request: FriendRequest;
  onAccept: (request: FriendRequest) => void;
  onDecline: (request: FriendRequest) => void;
  isProcessing: boolean;
};

function FriendRequestCard({
  request,
  onAccept,
  onDecline,
  isProcessing,
}: FriendRequestCardProps) {
  return (
    <View style={styles.requestCard}>
      <Avatar uri={request.senderAvatarUrl} name={request.senderName} />

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{request.senderName}</Text>
        <Text style={styles.userHandle}>@{request.senderUsername}</Text>
      </View>

      <View style={styles.actionButtons}>
        {isProcessing ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Accept friend request from ${request.senderName}`}
              style={styles.acceptButton}
              onPress={() => onAccept(request)}>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Decline friend request from ${request.senderName}`}
              style={styles.rejectButton}
              onPress={() => onDecline(request)}>
              <Feather name="x" size={18} color={COLORS.mutedText} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Search Result Card
// ---------------------------------------------------------------------------

type SearchResultCardProps = {
  user: UserSearchResult;
  onAdd: (user: UserSearchResult) => void;
  isSending: boolean;
};

function SearchResultCard({ user, onAdd, isSending }: SearchResultCardProps) {
  return (
    <Pressable style={styles.resultCard} onPress={() => router.push('/profile')}>
      <Avatar uri={user.avatarUrl} name={user.fullName} />

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.fullName}</Text>
        <Text style={styles.userHandle}>@{user.username}</Text>
      </View>

      {isSending ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            user.requestSent ? `Request sent to ${user.fullName}` : `Add ${user.fullName}`
          }
          style={[styles.addButton, user.requestSent && styles.addButtonSent]}
          onPress={(e) => { e.stopPropagation?.(); !user.requestSent && onAdd(user); }}
          disabled={user.requestSent}>
          <Text style={[styles.addButtonText, user.requestSent && styles.addButtonTextSent]}>
            {user.requestSent ? 'Sent' : 'Add'}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export function AddFriendsScreen() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const isSearching = searchQuery.trim().length > 0;

  // ── Friend requests state ──────────────────────────────────────────────
  const [requests, setRequests] = React.useState<FriendRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = React.useState(true);
  const [requestsError, setRequestsError] = React.useState<string | null>(null);
  const [processingIds, setProcessingIds] = React.useState<Set<string>>(new Set());

  // ── Search results state ───────────────────────────────────────────────
  const [results, setResults] = React.useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [sendingIds, setSendingIds] = React.useState<Set<string>>(new Set());

  // ── Load friend requests on mount ─────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setRequestsLoading(true);
        setRequestsError(null);
        const data = await fetchIncomingFriendRequests();
        if (!cancelled) {
          setRequests(data);
        }
      } catch {
        if (!cancelled) {
          setRequestsError('Could not load friend requests.');
        }
      } finally {
        if (!cancelled) {
          setRequestsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Debounced search ───────────────────────────────────────────────────
  React.useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setResults([]);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError(null);
        const data = await searchUsers(query);
        setResults(data);
      } catch {
        setSearchError('Search failed. Please try again.');
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleAccept = async (request: FriendRequest) => {
    setProcessingIds((prev) => new Set(prev).add(request.id));
    try {
      await acceptFriendRequest(request.id);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch {
      // silently ignore — production code would surface an alert
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const handleDecline = async (request: FriendRequest) => {
    setProcessingIds((prev) => new Set(prev).add(request.id));
    try {
      await declineFriendRequest(request.id);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch {
      // silently ignore
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const handleAdd = async (user: UserSearchResult) => {
    setSendingIds((prev) => new Set(prev).add(user.id));
    try {
      await sendFriendRequest(user.id);
      // Mark as sent in the results list
      setResults((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, requestSent: true } : u)),
      );
    } catch {
      // silently ignore
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        {/* ── Header + Search bar ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Friends</Text>

          <View style={styles.searchBar}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or username..."
              placeholderTextColor={COLORS.mutedText}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            <Feather name="search" size={18} color={COLORS.searchIcon} />
          </View>
        </View>

        {/* ── Content ── */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── FRIEND REQUESTS section (shown when not searching) ── */}
          {!isSearching && (
            <View style={styles.sectionSpacer}>
              <Text style={styles.sectionLabel}>FRIEND REQUESTS</Text>

              {requestsLoading ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginTop: 12 }} />
              ) : requestsError ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>{requestsError}</Text>
                </View>
              ) : requests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="user-plus" size={28} color={COLORS.mutedText} />
                  <Text style={styles.emptyStateText}>No pending friend requests</Text>
                </View>
              ) : (
                requests.map((request) => (
                  <FriendRequestCard
                    key={request.id}
                    request={request}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    isProcessing={processingIds.has(request.id)}
                  />
                ))
              )}
            </View>
          )}

          {/* ── SEARCH RESULTS section (shown when searching) ── */}
          {isSearching && (
            <View style={styles.sectionSpacer}>
              <Text style={styles.sectionLabel}>RESULTS</Text>

              {searchLoading ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginTop: 12 }} />
              ) : searchError ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>{searchError}</Text>
                </View>
              ) : results.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="search" size={28} color={COLORS.mutedText} />
                  <Text style={styles.emptyStateText}>
                    No users found for &quot;{searchQuery.trim()}&quot;
                  </Text>
                </View>
              ) : (
                results.map((user) => (
                  <SearchResultCard
                    key={user.id}
                    user={user}
                    onAdd={handleAdd}
                    isSending={sendingIds.has(user.id)}
                  />
                ))
              )}
            </View>
          )}
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}
