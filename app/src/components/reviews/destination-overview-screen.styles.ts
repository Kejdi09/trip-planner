import { StyleSheet } from 'react-native';

import { REVIEW_COLORS, rs } from './review-theme';

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
  },
  sectionHint: {
    fontSize: rs(13),
    lineHeight: rs(18),
    color: REVIEW_COLORS.textSecondary,
  },
  statusText: {
    fontSize: rs(12),
    fontWeight: '600',
    color: REVIEW_COLORS.textSecondary,
    lineHeight: rs(16),
  },
  errorText: {
    fontSize: rs(12),
    fontWeight: '600',
    color: REVIEW_COLORS.error,
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
  },
  emptyBody: {
    fontSize: rs(13),
    lineHeight: rs(18),
    color: REVIEW_COLORS.textSecondary,
    textAlign: 'center',
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
  },
  sectionHeader: {
    marginTop: rs(4),
  },
  sectionTitle: {
    fontSize: rs(18),
    fontWeight: '700',
    color: REVIEW_COLORS.textPrimary,
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
  photoTilePressable: {
    flex: 1,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: rs(10),
    paddingVertical: rs(8),
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  photoName: {
    fontSize: rs(11),
    fontWeight: '700',
    color: REVIEW_COLORS.buttonText,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(20),
  },
  modalCard: {
    width: '100%',
    borderRadius: rs(18),
    backgroundColor: REVIEW_COLORS.surface,
    padding: rs(16),
    gap: rs(12),
  },
  modalClose: {
    alignSelf: 'flex-end',
    height: rs(28),
    width: rs(28),
    borderRadius: rs(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: REVIEW_COLORS.surfaceMuted,
  },
  modalImage: {
    width: '100%',
    height: rs(320),
    borderRadius: rs(16),
    backgroundColor: REVIEW_COLORS.surfaceMuted,
  },
  modalName: {
    fontSize: rs(15),
    fontWeight: '700',
    color: REVIEW_COLORS.textPrimary,
  },
});
