import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ChatMessage,
  CURRENT_USER,
  fetchGroupById,
  fetchMessages,
  Group,
  sendMessage,
} from '../friends/dummy-data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TYPE_SCALE = Math.min(Math.max(SCREEN_WIDTH / 390, 0.9), 1.08);
const rs = (v: number) => Math.round(v * TYPE_SCALE);

const C = {
  background: '#FFFFFF',
  primary: '#008D9B',
  primaryLight: '#D7EDF0',
  text: '#111318',
  mutedText: '#8F949F',
  border: '#EBEBEB',
  myBubble: '#008D9B',
  myBubbleText: '#FFFFFF',
  theirBubble: '#F0F2F5',
  theirBubbleText: '#111318',
  inputBackground: '#F5F6F8',
  timestampText: '#B0B5BE',
  dateLabelText: '#8F949F',
  headerBorder: '#F0F2F5',
} as const;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  screen: { flex: 1, backgroundColor: C.background },

  // Header
  header: {
    backgroundColor: C.background,
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
  headerAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(6),
    paddingLeft: rs(46),
  },
  headerAvatar: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    backgroundColor: C.primaryLight,
    borderWidth: 2,
    borderColor: C.background,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -rs(6),
  },
  headerAvatarFirst: { marginLeft: 0 },
  headerAvatarImage: { width: rs(28), height: rs(28), borderRadius: rs(14) },
  headerAvatarText: { fontSize: rs(10), fontWeight: '700', color: C.primary },
  headerMoreText: { fontSize: rs(12), color: C.mutedText, fontWeight: '600', marginLeft: rs(6) },

  // Messages list
  messageList: { flex: 1 },
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
    paddingHorizontal: rs(16),
    paddingVertical: rs(10),
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.background,
    gap: rs(10),
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBackground,
    borderRadius: rs(22),
    paddingHorizontal: rs(14),
    minHeight: rs(42),
  },
  input: {
    flex: 1,
    fontSize: rs(15),
    color: C.text,
    paddingVertical: rs(8),
    maxHeight: rs(100),
  },
  sendButton: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#D7EDF0' },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function GroupChatScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [group, setGroup] = React.useState<Group | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [inputText, setInputText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const listRef = React.useRef<FlatList>(null);

  React.useEffect(() => {
    if (!groupId) return;
    Promise.all([fetchGroupById(groupId), fetchMessages(groupId)]).then(([g, msgs]) => {
      setGroup(g);
      setMessages(msgs);
      setLoading(false);
    });
  }, [groupId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !groupId) return;
    setInputText('');
    setSending(true);
    try {
      const msg = await sendMessage(groupId, text);
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSending(false);
    }
  };

  // Header avatar stack
  const visibleMembers = group?.members.slice(0, 3) ?? [];
  const extraCount = (group?.members.length ?? 0) - visibleMembers.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
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

              <View style={styles.headerAvatarStack}>
                {visibleMembers.map((m, i) => (
                  <View
                    key={m.id}
                    style={[styles.headerAvatar, i === 0 && styles.headerAvatarFirst]}>
                    {m.avatarUrl
                      ? <Image source={{ uri: m.avatarUrl }} style={styles.headerAvatarImage} />
                      : <Text style={styles.headerAvatarText}>{initials(m.fullName)}</Text>
                    }
                  </View>
                ))}
                {extraCount > 0 && (
                  <Text style={styles.headerMoreText}>+{extraCount}</Text>
                )}
              </View>
            </>
          )}
        </View>

        {/* Messages */}
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ flex: 1 }} />
        ) : (
          <FlatList
            ref={listRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            data={messages}
            keyExtractor={(item) => item.id}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const isMe = item.senderId === CURRENT_USER.id;
              return (
                <>
                  {item.dateLabel && (
                    <Text style={styles.dateLabel}>{item.dateLabel}</Text>
                  )}
                  <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                    <View style={[styles.bubble, isMe ? styles.bubbleMine : styles.bubbleTheirs]}>
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
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
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