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
    gap: rs(14),
  },
  tabRow: {
    flexDirection: 'row',
    gap: rs(18),
    paddingBottom: rs(4),
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
  sortSection: {
    gap: rs(8),
  },
  sortLabel: {
    fontSize: rs(13),
    fontWeight: '700',
    color: REVIEW_COLORS.textSecondary,
    fontFamily: REVIEW_FONTS.body,
  },
  sortRow: {
    flexDirection: 'row',
    gap: rs(12),
  },
  sortChip: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(8),
    borderRadius: 999,
    backgroundColor: REVIEW_COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortChipActive: {
    backgroundColor: REVIEW_COLORS.accent,
    borderColor: REVIEW_COLORS.accent,
  },
  sortChipText: {
    fontSize: rs(13),
    fontWeight: '700',
    color: REVIEW_COLORS.chipText,
    fontFamily: REVIEW_FONTS.body,
  },
  sortChipTextActive: {
    color: REVIEW_COLORS.chipTextActive,
  },
  reviewCard: {
    backgroundColor: REVIEW_COLORS.surface,
    borderRadius: rs(16),
    padding: rs(14),
    borderWidth: 1,
    borderColor: REVIEW_COLORS.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
  },
  avatar: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: rs(12),
    fontWeight: '700',
    color: REVIEW_COLORS.textPrimary,
    fontFamily: REVIEW_FONTS.body,
  },
  reviewMeta: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rs(8),
  },
  reviewerName: {
    fontSize: rs(14),
    fontWeight: '700',
    color: REVIEW_COLORS.textPrimary,
    fontFamily: REVIEW_FONTS.heading,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(6),
  },
  reviewTime: {
    fontSize: rs(12),
    fontWeight: '600',
    color: REVIEW_COLORS.textSecondary,
    fontFamily: REVIEW_FONTS.body,
  },
  reviewBody: {
    marginTop: rs(8),
    fontSize: rs(12.5),
    lineHeight: rs(16),
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
  viewMoreButton: {
    marginTop: rs(6),
    alignSelf: 'center',
    paddingHorizontal: rs(30),
    paddingVertical: rs(9),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: REVIEW_COLORS.border,
    backgroundColor: REVIEW_COLORS.surface,
  },
  viewMoreText: {
    fontSize: rs(13),
    fontWeight: '700',
    color: REVIEW_COLORS.textPrimary,
    fontFamily: REVIEW_FONTS.body,
  },
});
