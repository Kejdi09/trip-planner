import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createGroup } from '../friends/dummy-data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TYPE_SCALE = Math.min(Math.max(SCREEN_WIDTH / 390, 0.9), 1.08);
const rs = (v: number) => Math.round(v * TYPE_SCALE);

const C = {
  background: '#FFFFFF',
  primary: '#008D9B',
  primaryLight: '#D7EDF0',
  text: '#111318',
  mutedText: '#8F949F',
  border: '#E3E8ED',
  inputBackground: '#F8F9FB',
  error: '#D54545',
} as const;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  screen: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: rs(16),
    paddingHorizontal: rs(24),
    paddingBottom: rs(12),
    gap: rs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E7E7E7',
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
  },
  body: {
    flex: 1,
    paddingHorizontal: rs(24),
    paddingTop: rs(24),
  },
  label: {
    fontSize: rs(14),
    fontWeight: '700',
    color: C.text,
    marginBottom: rs(8),
    letterSpacing: -0.1,
  },
  input: {
    height: rs(52),
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.inputBackground,
    paddingHorizontal: rs(16),
    fontSize: rs(16),
    color: C.text,
    marginBottom: rs(20),
  },
  inputFocused: { borderColor: C.primary },
  hint: {
    fontSize: rs(13),
    color: C.mutedText,
    fontWeight: '500',
    marginTop: -rs(12),
    marginBottom: rs(20),
    lineHeight: rs(18),
  },
  error: {
    fontSize: rs(13),
    color: C.error,
    fontWeight: '600',
    marginBottom: rs(12),
  },
  createButton: {
    height: rs(52),
    borderRadius: rs(14),
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rs(8),
  },
  createButtonDisabled: { opacity: 0.65 },
  createButtonText: {
    fontSize: rs(17),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});

export function CreateGroupScreen() {
  const [name, setName] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Group name is required.');
      return;
    }
    if (name.trim().length < 3) {
      setError('Name must be at least 3 characters.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const group = await createGroup(name.trim());
      // Navigate to the new group's chat (or back to groups)
      router.replace({ pathname: '../../group-chat', params: { groupId: group.id } });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color="#111318" />
          </Pressable>
          <Text style={styles.title}>Create Group</Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            value={name}
            onChangeText={(v) => { setName(v); setError(null); }}
            placeholder="e.g. Summer Europe Trip"
            placeholderTextColor={C.mutedText}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleCreate}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[styles.input, focused && styles.inputFocused]}
            editable={!submitting}
          />

          <Text style={styles.hint}>
            Give your group a memorable name. You can invite friends after creating it.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.createButton, submitting && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={submitting}
            accessibilityRole="button">
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>Create Group</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}