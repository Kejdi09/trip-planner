import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchGroupMembers, fetchGroupMessages, fetchMyGroups, getActiveUserId, postGroupMessage } from '../../../lib/groups-api';
import { supabase } from '../../../lib/supabase';

type ChatMessage = { id: string; groupId: string; senderId: string; text: string; timestamp: string; dateLabel: string | null };
type Group = { id: string; name: string; adminId: string; members: { id: string; fullName: string; username: string; avatarUrl: string | null; tripCount: number; role: 'admin' | 'member' }[]; status: string; votingOpen: boolean; places: { name: string }[]; dateRange: string | null; budgetRange: string | null; destination: string | null };


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TYPE_SCALE = Math.min(Math.max(SCREEN_WIDTH / 390, 0.9), 1.08);
const rs = (v: number) => Math.round(v * TYPE_SCALE);

const C = {
  background: '#F8FCFD',
  primary: '#008D9B',
  primaryLight: '#D7EDF0',
  text: '#111318',
  mutedText: '#8F949F',
  border: '#EBEBEB',
  myBubble: '#008D9B',
  myBubbleText: '#FFFFFF',
  theirBubble: '#FFFFFF',
  theirBubbleText: '#111318',
  inputBackground: '#F7FAFB',
  timestampText: '#B0B5BE',
  dateLabelText: '#8F949F',
  headerBorder: '#F0F2F5',
} as const;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  screen: { flex: 1, backgroundColor: C.background },
  messageArea: {
    flex: 1,
    overflow: 'hidden',
  },
  chatBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FCFD',
  },
  backdropBlobLarge: {
    position: 'absolute',
    width: rs(320),
    height: rs(320),
    borderRadius: rs(160),
    backgroundColor: 'rgba(0, 141, 155, 0.08)',
    top: rs(42),
    left: rs(-130),
  },
  backdropBlobMedium: {
    position: 'absolute',
    width: rs(260),
    height: rs(260),
    borderRadius: rs(130),
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    bottom: rs(34),
    right: rs(-98),
  },
  backdropBlobSmall: {
    position: 'absolute',
    width: rs(150),
    height: rs(150),
    borderRadius: rs(75),
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
    top: rs(230),
    right: rs(28),
  },
  backdropDot: {
    position: 'absolute',
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
    backgroundColor: 'rgba(0, 141, 155, 0.14)',
  },

  // Header
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: C.headerBorder,
    paddingTop: rs(12),
    paddingBottom: rs(10),
    paddingHorizontal: rs(16),
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    marginBottom: rs(4),
  },
  backButton: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: {
    fontSize: rs(17),
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
    flex: 1,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    paddingLeft: rs(46),
  },
  headerMetaText: {
    fontSize: rs(12),
    color: C.mutedText,
    fontWeight: '500',
  },
  headerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.mutedText,
  },
  headerMembersText: {
    fontSize: rs(12),
    color: C.mutedText,
    fontWeight: '500',
    paddingLeft: rs(46),
    marginTop: rs(4),
  },

  // Messages list
  messageList: { flex: 1, backgroundColor: 'transparent' },
  messageListContent: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
    gap: rs(4),
  },

  // Date label
  dateLabel: {
    alignSelf: 'center',
    fontSize: rs(12),
    color: C.dateLabelText,
    fontWeight: '600',
    marginVertical: rs(10),
  },

  // Bubbles
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: rs(2),
  },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '72%',
    paddingHorizontal: rs(14),
    paddingVertical: rs(9),
    borderRadius: rs(18),
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: rs(6),
  },
  bubbleMine: {
    backgroundColor: C.myBubble,
    borderBottomRightRadius: rs(4),
  },
  bubbleTheirs: {
    backgroundColor: C.theirBubble,
    borderBottomLeftRadius: rs(4),
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.86)',
  },
  bubbleText: { fontSize: rs(15), lineHeight: rs(20), fontWeight: '500' },
  bubbleTextMine: { color: C.myBubbleText },
  bubbleTextTheirs: { color: C.theirBubbleText },
  bubbleTimestamp: { fontSize: rs(11), fontWeight: '500' },
  bubbleTimestampMine: { color: 'rgba(255,255,255,0.7)' },
  bubbleTimestampTheirs: { color: C.timestampText },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: rs(14),
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    borderRadius: rs(28),
    borderWidth: 1,
    borderColor: 'rgba(203, 239, 242, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    gap: rs(10),
    shadowColor: '#008D9B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBackground,
    borderRadius: rs(22),
    paddingHorizontal: rs(14),
    minHeight: rs(42),
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.72)',
  },
  input: {
    flex: 1,
    fontSize: rs(15),
    color: C.text,
    paddingVertical: rs(8),
    maxHeight: rs(100),
  },
  sendButton: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(21),
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  sendButtonDisabled: { backgroundColor: '#D7EDF0' },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatChatTime(createdAt: string | Date) {
  const value = createdAt instanceof Date ? createdAt.toISOString() : createdAt;
  const normalized = /z$|[+-]\d{2}:?\d{2}$/i.test(value) ? value : `${value}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function GroupChatScreen() {
  const params = useLocalSearchParams<{ groupId?: string | string[] }>();
  const rawGroupId = params.groupId;
  const groupId = Array.isArray(rawGroupId) ? rawGroupId[0] : rawGroupId;
  const [group, setGroup] = React.useState<Group | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [inputText, setInputText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState(getActiveUserId());
  const insets = useSafeAreaInsets();
  const navBottom = Math.max(10, insets.bottom + 6);
  const navHeight = 66;
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);
  const inputBottomSpacing = keyboardVisible ? Math.max(8, insets.bottom) : navBottom + navHeight + 12;
  const listRef = React.useRef<FlatList>(null);


  React.useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? getActiveUserId());
    })();

    if (!groupId) return;
    const load = async () => {
      const [{ groups }, { members }, { messages: rows }] = await Promise.all([
        fetchMyGroups(),
        fetchGroupMembers(groupId),
        fetchGroupMessages(groupId),
      ]);
      const groupRow = groups.find((g) => g.id === groupId) ?? null;
      setGroup(
        groupRow
          ? {
              id: groupRow.id,
              name: groupRow.name ?? 'Group',
              adminId: groupRow.created_by ?? '',
              members: members.map((m) => ({
                id: m.user_id,
                fullName: 'Unknown user',
                username: 'Unknown user',
                avatarUrl: null,
                tripCount: 0,
                role: m.user_id === groupRow.created_by ? 'admin' : 'member',
              })),
              status: groupRow.status === 'completed' ? 'completed' : groupRow.status === 'active' ? 'active' : 'upcoming',
              votingOpen: groupRow.status === 'planning',
              places: [],
              dateRange: groupRow.start_date && groupRow.end_date ? `${groupRow.start_date} - ${groupRow.end_date}` : null,
              budgetRange: null,
              destination: null,
            }
          : null,
      );

      const memberIds = Array.from(new Set(members.map((m) => m.user_id).concat(rows.map((msg) => msg.sender_id))));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', memberIds);
      const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

      setGroup((current) => {
        if (!current) return current;
        return {
          ...current,
          members: current.members.map((member) => {
            const profile = profileById.get(member.id);
            const displayName = profile?.full_name?.trim() || profile?.username?.trim() || 'Unknown user';
            return {
              ...member,
              fullName: displayName,
              username: displayName,
            };
          }),
        };
      });

      setMessages(
        rows.map((msg) => ({
          id: msg.id,
          groupId: msg.group_id,
          senderId: msg.sender_id,
          text: msg.content,
          timestamp: formatChatTime(msg.created_at),
          dateLabel: null,
        })),
      );
      await supabase.from('group_chat_reads').upsert({ group_id: groupId, user_id: currentUserId, last_read_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'group_id,user_id' });
      setLoading(false);
    };
    void load();
  }, [groupId]);

  const handleBackPress = () => {
    if (groupId) {
      router.replace({ pathname: '/group-hub', params: { groupId: String(groupId) } });
      return;
    }
    router.replace('/groups');
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !groupId) return;
    setInputText('');
    setSending(true);
    try {
      const msg = await postGroupMessage(groupId, text, currentUserId);
      setMessages((prev) => [...prev, {
        id: msg.id,
        groupId: msg.group_id,
        senderId: msg.sender_id,
        text: msg.content,
        timestamp: formatChatTime(msg.created_at),
        dateLabel: null,
      }]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSending(false);
    }
  };

  if (!groupId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: '600' }}>Missing group context.</Text>
          <Pressable onPress={() => router.replace('/groups')} style={{ marginTop: 14 }}><Text style={{ color: C.primary, fontWeight: '700' }}>Back to Groups</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Pressable style={styles.backButton} onPress={handleBackPress} accessibilityRole="button">
              <Feather name="arrow-left" size={20} color={C.text} />
            </Pressable>
            <Text style={styles.headerName} numberOfLines={1}>
              {group ? `${group.name} Chat` : 'Group Chat'}
            </Text>
          </View>

          {group && (
            <>
              <View style={styles.headerMeta}>
                {group.destination && (
                  <>
                    <Text style={styles.headerMetaText}>{group.destination}</Text>
                    {group.dateRange && <View style={styles.headerDot} />}
                  </>
                )}
                {group.dateRange && (
                  <Text style={styles.headerMetaText}>{group.dateRange}, 2026</Text>
                )}
              </View>

              <Text style={styles.headerMembersText} numberOfLines={1}>
                {`Members: ${group.members.map((m) => m.fullName || m.username || 'Unknown user').join(', ')}`}
              </Text>
            </>
          )}
        </View>

        {/* Messages */}
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ flex: 1 }} />
        ) : (
          <View style={styles.messageArea}>
            <View pointerEvents="none" style={styles.chatBackdrop}>
              <View style={styles.backdropBlobLarge} />
              <View style={styles.backdropBlobMedium} />
              <View style={styles.backdropBlobSmall} />
              <View style={[styles.backdropDot, { top: rs(114), right: rs(44) }]} />
              <View style={[styles.backdropDot, { top: rs(190), left: rs(58), opacity: 0.55 }]} />
              <View style={[styles.backdropDot, { bottom: rs(120), left: rs(34), opacity: 0.45 }]} />
            </View>
            <FlatList
              ref={listRef}
              style={styles.messageList}
              contentContainerStyle={[styles.messageListContent, { paddingBottom: 24 }]}
              data={messages}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => item.id}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item }) => {
              const isMe = item.senderId === currentUserId;
              const sender = group?.members.find((m) => m.id === item.senderId);
              return (
                <>
                  {item.dateLabel && (
                    <Text style={styles.dateLabel}>{item.dateLabel}</Text>
                  )}
                  <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                    <View style={[styles.bubble, isMe ? styles.bubbleMine : styles.bubbleTheirs]}>
                      <Pressable onPress={() => { if (!isMe && sender?.id) router.push({ pathname: '/user-profile/[userId]', params: { userId: sender.id } }); }}><Text style={{ fontSize: 11, fontWeight: '700', color: '#4B5563', marginBottom: 2 }}>{isMe ? 'You' : (sender?.fullName || sender?.username || 'Unknown user')}</Text></Pressable>
                      <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
                        {item.text}
                      </Text>
                      <Text style={[styles.bubbleTimestamp, isMe ? styles.bubbleTimestampMine : styles.bubbleTimestampTheirs]}>
                        {item.timestamp}
                      </Text>
                    </View>
                  </View>
                </>
              );
            }}
            />
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { marginBottom: inputBottomSpacing }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message"
              placeholderTextColor={C.mutedText}
              style={styles.input}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit
            />
          </View>
          <Pressable
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="Send message">
            <Ionicons name="send" size={16} color={inputText.trim() ? '#FFFFFF' : C.primary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
