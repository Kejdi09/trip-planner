import { Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TYPE_SCALE = Math.min(Math.max(SCREEN_WIDTH / 390, 0.9), 1.08);
const rs = (value: number) => Math.round(value * TYPE_SCALE);

export const COLORS = {
  background: '#FFFFFF',
  primary: '#008D9B',
  text: '#111318',
  mutedText: '#8F949F',
  sectionLabel: '#8F949F',
  border: '#E8EAED',
  cardBackground: '#FFFFFF',
  cardBorder: '#EBEBEB',
  searchBackground: '#F0F2F5',
  searchIcon: '#62707A',
  acceptButton: '#008D9B',
  rejectButton: '#F0F2F5',
  addButton: '#008D9B',
  addButtonText: '#FFFFFF',
  avatarFallback: '#D7EDF0',
  avatarIcon: '#008D9B',
  username: '#8F949F',
  divider: '#F0F2F5',
} as const;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    paddingTop: rs(20),
    paddingHorizontal: rs(24),
    paddingBottom: rs(12),
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E7E7',
  },
  title: {
    fontSize: rs(28),
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: rs(14),
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.searchBackground,
    borderRadius: 14,
    paddingHorizontal: rs(14),
    height: rs(44),
    gap: rs(8),
  },
  searchInput: {
    flex: 1,
    fontSize: rs(15),
    color: COLORS.text,
    paddingVertical: 0,
  },

  // Scroll content
  scrollContent: {
    paddingHorizontal: rs(24),
    paddingTop: rs(20),
    paddingBottom: rs(120),
  },

  // Section
  sectionLabel: {
    fontSize: rs(12),
    fontWeight: '700',
    color: COLORS.sectionLabel,
    letterSpacing: 0.8,
    marginBottom: rs(12),
  },
  sectionSpacer: {
    marginBottom: rs(24),
  },

  // Friend request card
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: rs(14),
    paddingHorizontal: rs(16),
    marginBottom: rs(10),
  },

  // Search result card
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: rs(14),
    paddingHorizontal: rs(16),
    marginBottom: rs(10),
  },

  // Avatar
  avatarWrapper: {
    width: rs(46),
    height: rs(46),
    borderRadius: rs(23),
    backgroundColor: COLORS.avatarFallback,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
    overflow: 'hidden',
  },
  avatarImage: {
    width: rs(46),
    height: rs(46),
    borderRadius: rs(23),
  },

  // User info
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: rs(15),
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  userHandle: {
    fontSize: rs(13),
    fontWeight: '500',
    color: COLORS.username,
    marginTop: rs(2),
  },

  // Accept / Reject buttons
  actionButtons: {
    flexDirection: 'row',
    gap: rs(8),
    alignItems: 'center',
  },
  acceptButton: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: COLORS.acceptButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: COLORS.rejectButton,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Add button
  addButton: {
    paddingHorizontal: rs(20),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: COLORS.addButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonSent: {
    backgroundColor: COLORS.rejectButton,
  },
  addButtonText: {
    fontSize: rs(14),
    fontWeight: '700',
    color: COLORS.addButtonText,
    letterSpacing: -0.1,
  },
  addButtonTextSent: {
    color: COLORS.mutedText,
  },

  // Empty / loading states
  emptyState: {
    alignItems: 'center',
    paddingVertical: rs(32),
  },
  emptyStateText: {
    fontSize: rs(14),
    color: COLORS.mutedText,
    fontWeight: '500',
    marginTop: rs(8),
    textAlign: 'center',
  },
  loadingText: {
    fontSize: rs(14),
    color: COLORS.mutedText,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: rs(16),
  },
});