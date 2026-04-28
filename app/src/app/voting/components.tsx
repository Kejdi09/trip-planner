import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Member } from './types';

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const COLORS = {
  primary: '#2DD4BF',
  primaryDark: '#0D9488',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  borderSelected: '#2DD4BF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  tabActive: '#2DD4BF',
  tabInactive: '#64748B',
  progressBg: '#E2E8F0',
  progressFill: '#2DD4BF',
  progressFillLow: '#94A3B8',
  badgeBg: '#FEE2E2',
  badgeText: '#EF4444',
  checkBg: '#2DD4BF',
  buttonBg: '#2DD4BF',
  buttonText: '#FFFFFF',
  timerText: '#EF4444',
  conflictBadgeBg: '#EF4444',
  conflictBadgeText: '#FFFFFF',
};

// ─── Header ───────────────────────────────────────────────────────────────────
interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  timeLeft?: string;
}
export const Header: React.FC<HeaderProps> = ({ title, onBack, timeLeft }) => (
  <View style={headerStyles.container}>
    <TouchableOpacity onPress={onBack} style={headerStyles.backBtn} accessibilityLabel="Go back">
      <Text style={headerStyles.backArrow}>←</Text>
    </TouchableOpacity>
    <View style={headerStyles.titleBlock}>
      <Text style={headerStyles.title}>{title}</Text>
      {timeLeft && (
        <View style={headerStyles.timerRow}>
          <Text style={headerStyles.timerIcon}>⏰</Text>
          <Text style={headerStyles.timerText}>{timeLeft}</Text>
        </View>
      )}
    </View>
    <TouchableOpacity style={headerStyles.chatBtn} accessibilityLabel="Open chat">
      <Text style={headerStyles.chatIcon}>💬</Text>
    </TouchableOpacity>
  </View>
);

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  backBtn: { padding: 4, marginTop: 2 },
  backArrow: { fontSize: 20, color: COLORS.textPrimary },
  titleBlock: { flex: 1, marginLeft: 8 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 24 },
  timerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  timerIcon: { fontSize: 11, marginRight: 3 },
  timerText: { fontSize: 12, color: COLORS.timerText, fontWeight: '600' },
  chatBtn: { padding: 4, marginTop: 2 },
  chatIcon: { fontSize: 20 },
});

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
interface TabBarProps {
  tabs: string[];
  activeTab: string;
  onTabPress: (tab: string) => void;
}
export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabPress }) => (
  <View style={tabStyles.container}>
    {tabs.map((tab) => {
      const isActive = tab === activeTab;
      return (
        <TouchableOpacity
          key={tab}
          style={tabStyles.tab}
          onPress={() => onTabPress(tab)}
          accessibilityRole="tab"
          accessibilityState={{ selected: isActive }}
        >
          <Text style={[tabStyles.label, isActive && tabStyles.labelActive]}>{tab}</Text>
          {isActive && <View style={tabStyles.indicator} />}
        </TouchableOpacity>
      );
    })}
  </View>
);

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  label: { fontSize: 14, fontWeight: '500', color: COLORS.tabInactive },
  labelActive: { color: COLORS.tabActive, fontWeight: '700' },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: COLORS.tabActive,
    borderRadius: 1,
  },
});

// ─── Voter Avatars ────────────────────────────────────────────────────────────
interface VoterAvatarsProps {
  voters: Member[];
  totalMembers: number;
}
export const VoterAvatars: React.FC<VoterAvatarsProps> = ({ voters, totalMembers }) => {
  const shown = voters.slice(0, 5);
  const empty = Math.max(0, Math.min(totalMembers, 5) - shown.length);
  return (
    <View style={avatarStyles.row}>
      {shown.map((m) => (
        <View key={m.id} style={[avatarStyles.circle, { backgroundColor: m.avatarColor }]}>
          <Text style={avatarStyles.initials}>{m.initials}</Text>
        </View>
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <View key={`empty-${i}`} style={[avatarStyles.circle, avatarStyles.empty]} />
      ))}
    </View>
  );
};

const avatarStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5, marginTop: 8 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 11, fontWeight: '700', color: '#fff' },
  empty: { backgroundColor: '#E2E8F0' },
});

// ─── Vote Progress Bar ────────────────────────────────────────────────────────
interface VoteProgressProps {
  votedCount: number;
  totalMembers: number;
}
export const VoteProgress: React.FC<VoteProgressProps> = ({ votedCount, totalMembers }) => {
  const pct = totalMembers > 0 ? (votedCount / totalMembers) * 100 : 0;
  const isLow = pct < 50;
  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.track}>
        <View
          style={[
            progressStyles.fill,
            { width: `${pct}%` as any },
            isLow && progressStyles.fillLow,
          ]}
        />
      </View>
    </View>
  );
};

const progressStyles = StyleSheet.create({
  container: { marginTop: 6 },
  track: {
    height: 4,
    backgroundColor: COLORS.progressBg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: COLORS.progressFill, borderRadius: 2 },
  fillLow: { backgroundColor: COLORS.progressFillLow },
});

// ─── Checkmark ────────────────────────────────────────────────────────────────
export const Checkmark: React.FC = () => (
  <View style={checkStyles.circle}>
    <Text style={checkStyles.check}>✓</Text>
  </View>
);

const checkStyles = StyleSheet.create({
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.checkBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#fff', fontSize: 14, fontWeight: '800' },
});

// ─── Radio Circle ─────────────────────────────────────────────────────────────
export const RadioCircle: React.FC = () => (
  <View style={radioStyles.outer}>
    <View style={radioStyles.inner} />
  </View>
);

const radioStyles = StyleSheet.create({
  outer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'transparent' },
});

// ─── Option Card Wrapper ──────────────────────────────────────────────────────
interface OptionCardProps {
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
  children: React.ReactNode;
}
export const OptionCard: React.FC<OptionCardProps> = ({ selected, onPress, style, children }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={[cardStyles.card, selected && cardStyles.selected, style]}
    accessibilityRole="radio"
    accessibilityState={{ selected }}
  >
    {children}
  </TouchableOpacity>
);

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  selected: { borderColor: COLORS.borderSelected, borderWidth: 2 },
});

// ─── Voted Count Label ────────────────────────────────────────────────────────
export const VotedLabel: React.FC<{ votedCount: number; totalMembers: number }> = ({
  votedCount,
  totalMembers,
}) => (
  <Text style={votedLabelStyles.text}>
    {votedCount} of {totalMembers} voted
  </Text>
);

const votedLabelStyles = StyleSheet.create({
  text: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
});
