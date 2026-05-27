import { Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TYPE_SCALE = Math.min(Math.max(SCREEN_WIDTH / 390, 0.9), 1.08);
export const rs = (value: number) => Math.round(value * TYPE_SCALE);

export const COLORS = {
  background: '#FFFFFF',
  primary: '#008D9B',
  primaryLight: '#D7EDF0',
  text: '#111318',
  mutedText: '#8F949F',
  sectionLabel: '#8F949F',
  border: '#EBEBEB',
  cardBackground: '#FFFFFF',
  cardBorder: '#EBEBEB',
  activeCardBorder: '#008D9B',
  activeCardBackground: '#FAFFFE',
  pillBackground: '#F0F2F5',
  votingBadgeBackground: '#D7EDF0',
  votingBadgeText: '#008D9B',
  upcomingText: '#008D9B',
  completedText: '#8F949F',
  addButton: '#008D9B',
  chevron: '#C7CAD1',
} as const;

export const groupsStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  screen: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: rs(20),
    paddingHorizontal: rs(24),
    paddingBottom: rs(14),
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E7E7',
  },
  title: {
    fontSize: rs(28),
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  addButton: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(21),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: rs(24),
    paddingTop: rs(8),
    paddingBottom: rs(120),
  },

  sectionLabel: {
    fontSize: rs(12),
    fontWeight: '700',
    color: COLORS.sectionLabel,
    letterSpacing: 0.8,
    marginBottom: rs(12),
    marginTop: rs(8),
  },

  // Active group card
  activeCard: {
    borderRadius: rs(18),
    borderWidth: 1.5,
    borderColor: COLORS.activeCardBorder,
    backgroundColor: COLORS.activeCardBackground,
    padding: rs(16),
    marginBottom: rs(16),
  },
  activeCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: rs(6),
  },
  activeCardName: {
    fontSize: rs(20),
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
    flex: 1,
    paddingRight: rs(8),
  },
  votingBadge: {
    backgroundColor: COLORS.votingBadgeBackground,
    borderRadius: rs(10),
    paddingHorizontal: rs(10),
    paddingVertical: rs(5),
    alignItems: 'center',
  },
  votingBadgeText: {
    fontSize: rs(12),
    fontWeight: '700',
    color: COLORS.votingBadgeText,
    textAlign: 'center',
  },
  adminText: {
    fontSize: rs(13),
    color: COLORS.mutedText,
    fontWeight: '500',
    marginBottom: rs(12),
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(14),
  },
  memberNamesText: {
    flex: 1,
    fontSize: rs(13),
    color: COLORS.mutedText,
    fontWeight: '500',
    marginRight: rs(10),
  },
  inviteButton: {
    marginLeft: 'auto',
    paddingHorizontal: rs(18),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: rs(13),
    fontWeight: '700',
  },
  pillRow: {
    flexDirection: 'row',
    gap: rs(8),
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    backgroundColor: COLORS.pillBackground,
    borderRadius: rs(20),
    paddingHorizontal: rs(12),
    paddingVertical: rs(7),
  },
  pillText: {
    fontSize: rs(12),
    fontWeight: '600',
    color: COLORS.text,
  },

  // Other group row
  otherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.cardBackground,
    paddingVertical: rs(14),
    paddingHorizontal: rs(16),
    marginBottom: rs(10),
  },
  otherCardIcon: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(12),
    backgroundColor: COLORS.pillBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
  },
  otherCardInfo: { flex: 1 },
  otherCardName: {
    fontSize: rs(15),
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  otherCardSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginTop: rs(2),
  },
  otherCardMembers: {
    fontSize: rs(13),
    color: COLORS.mutedText,
    fontWeight: '500',
  },
  otherCardStatus: {
    fontSize: rs(13),
    fontWeight: '700',
  },
  chevron: { marginLeft: rs(8) },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: rs(32) },
  emptyStateText: { fontSize: rs(14), color: COLORS.mutedText, fontWeight: '500', marginTop: rs(8) },
});