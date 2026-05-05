import { StyleSheet } from 'react-native';

import { REVIEW_COLORS, REVIEW_FONTS, rs } from './review-theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: REVIEW_COLORS.surface,
  },
  screen: {
    flex: 1,
    backgroundColor: REVIEW_COLORS.surface,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    paddingHorizontal: rs(20),
    paddingTop: rs(10),
    paddingBottom: rs(8),
  },
  backButton: {
    height: rs(36),
    width: rs(36),
    borderRadius: rs(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: rs(18),
    fontWeight: '700',
    color: REVIEW_COLORS.textPrimary,
    fontFamily: REVIEW_FONTS.heading,
  },
  headerSummary: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: rs(20),
    paddingBottom: rs(32),
    paddingTop: rs(6),
    gap: rs(16),
  },
  tabRow: {
    flexDirection: 'row',
    gap: rs(18),
    paddingBottom: rs(6),
  },
  tabButton: {
    paddingBottom: rs(8),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: REVIEW_COLORS.accent,
  },
  tabText: {
    fontSize: rs(14),
    fontWeight: '700',
    color: REVIEW_COLORS.tabMuted,
    fontFamily: REVIEW_FONTS.body,
  },
  tabTextActive: {
    color: REVIEW_COLORS.accent,
  },
  friendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rs(10),
  },
  friendsLabel: {
    fontSize: rs(13),
    fontWeight: '700',
    color: REVIEW_COLORS.textSecondary,
    fontFamily: REVIEW_FONTS.body,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: REVIEW_COLORS.surface,
  },
  avatarText: {
    fontSize: rs(11),
    fontWeight: '700',
    color: REVIEW_COLORS.textPrimary,
    fontFamily: REVIEW_FONTS.body,
  },
  avatarCounter: {
    marginLeft: -10,
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: REVIEW_COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: REVIEW_COLORS.surface,
  },
  avatarCounterText: {
    fontSize: rs(11),
    fontWeight: '700',
    color: REVIEW_COLORS.textSecondary,
    fontFamily: REVIEW_FONTS.body,
  },
  tagRow: {
    flexDirection: 'row',
    gap: rs(8),
    flexWrap: 'wrap',
  },
  tagChip: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: 999,
    backgroundColor: REVIEW_COLORS.accent,
  },
  tagText: {
    fontSize: rs(12),
    fontWeight: '700',
    color: REVIEW_COLORS.chipTextActive,
    fontFamily: REVIEW_FONTS.body,
  },
  descriptionCard: {
    backgroundColor: REVIEW_COLORS.surfaceMuted,
    borderRadius: rs(14),
    padding: rs(14),
  },
  descriptionText: {
    fontSize: rs(13),
    lineHeight: rs(18),
    color: REVIEW_COLORS.textSecondary,
    fontFamily: REVIEW_FONTS.body,
  },
  statusText: {
    fontSize: rs(12),
    fontWeight: '600',
    color: REVIEW_COLORS.textSecondary,
    fontFamily: REVIEW_FONTS.body,
    lineHeight: rs(16),
  },
  errorText: {
    fontSize: rs(12),
    fontWeight: '600',
    color: REVIEW_COLORS.error,
    fontFamily: REVIEW_FONTS.body,
    lineHeight: rs(16),
  },
  emptyState: {
    paddingVertical: rs(32),
    paddingHorizontal: rs(20),
    alignItems: 'center',
    gap: rs(10),
  },
  emptyTitle: {
    fontSize: rs(18),
    fontWeight: '700',
    color: REVIEW_COLORS.textPrimary,
    fontFamily: REVIEW_FONTS.heading,
  },
  emptyBody: {
    fontSize: rs(13),
    lineHeight: rs(18),
    color: REVIEW_COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: REVIEW_FONTS.body,
  },
  emptyButton: {
    marginTop: rs(6),
    paddingHorizontal: rs(20),
    paddingVertical: rs(10),
    borderRadius: 999,
    backgroundColor: REVIEW_COLORS.accent,
  },
  emptyButtonText: {
    fontSize: rs(13),
    fontWeight: '700',
    color: REVIEW_COLORS.buttonText,
    fontFamily: REVIEW_FONTS.body,
  },
  sectionHeader: {
    marginTop: rs(4),
  },
  sectionTitle: {
    fontSize: rs(18),
    fontWeight: '700',
    color: REVIEW_COLORS.textPrimary,
    fontFamily: REVIEW_FONTS.heading,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(12),
  },
  photoTile: {
    flexBasis: '48%',
    aspectRatio: 1,
    borderRadius: rs(16),
    overflow: 'hidden',
    backgroundColor: REVIEW_COLORS.surfaceMuted,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
});
