import { StyleSheet } from 'react-native';

import { REVIEW_COLORS, rs } from './review-theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: REVIEW_COLORS.background,
  },
  screen: {
    flex: 1,
    backgroundColor: REVIEW_COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(20),
    paddingTop: rs(10),
    paddingBottom: rs(6),
    gap: rs(10),
  },
  backButton: {
    height: rs(36),
    width: rs(36),
    borderRadius: rs(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: REVIEW_COLORS.surface,
    borderWidth: 1,
    borderColor: REVIEW_COLORS.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: rs(22),
    fontWeight: '700',
    color: REVIEW_COLORS.textPrimary,
  },
  postButton: {
    paddingHorizontal: rs(18),
    paddingVertical: rs(9),
    borderRadius: 999,
    backgroundColor: REVIEW_COLORS.accent,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: rs(13),
    fontWeight: '700',
    color: REVIEW_COLORS.buttonText,
  },
  scrollContent: {
    paddingHorizontal: rs(20),
    paddingBottom: rs(32),
    gap: rs(20),
  },
  summaryWrapper: {
    marginTop: rs(8),
  },
  section: {
    gap: rs(10),
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: rs(15),
    fontWeight: '700',
    color: REVIEW_COLORS.textPrimary,
  },
  sectionSub: {
    fontSize: rs(12),
    fontWeight: '600',
    color: REVIEW_COLORS.textSecondary,
  },
  reviewInput: {
    minHeight: rs(120),
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: REVIEW_COLORS.border,
    backgroundColor: REVIEW_COLORS.surface,
    padding: rs(14),
    fontSize: rs(13),
    lineHeight: rs(20),
    color: REVIEW_COLORS.textPrimary,
  },
  charCount: {
    fontSize: rs(11),
    fontWeight: '600',
    color: REVIEW_COLORS.textSecondary,
    textAlign: 'right',
  },
  statusText: {
    fontSize: rs(12),
    fontWeight: '600',
    color: REVIEW_COLORS.success,
  },
  errorText: {
    fontSize: rs(12),
    fontWeight: '600',
    color: REVIEW_COLORS.error,
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
  // Photo grid — thumbnails + add tile in the same wrapping row
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(10),
  },
  photoThumb: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(14),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: REVIEW_COLORS.border,
    backgroundColor: REVIEW_COLORS.surfaceMuted,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: rs(5),
    right: rs(5),
    width: rs(20),
    height: rs(20),
    borderRadius: rs(10),
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoTile: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: REVIEW_COLORS.accent,
    borderStyle: 'dashed',
    backgroundColor: REVIEW_COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(4),
  },
  addPhotoTileText: {
    fontSize: rs(11),
    fontWeight: '700',
    color: REVIEW_COLORS.accent,
  },
  // Tags
  tagGroupLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(5),
    marginBottom: rs(2),
  },
  tagGroupLabel: {
    fontSize: rs(11),
    fontWeight: '600',
    color: REVIEW_COLORS.accent,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(8),
  },
  tagChip: {
    paddingHorizontal: rs(13),
    paddingVertical: rs(7),
    borderRadius: 999,
    backgroundColor: REVIEW_COLORS.chip,
  },
  tagChipActive: {
    backgroundColor: REVIEW_COLORS.accent,
  },
  tagChipPopular: {
    backgroundColor: REVIEW_COLORS.accentSoft,
    borderWidth: 1,
    borderColor: REVIEW_COLORS.accent,
  },
  tagText: {
    fontSize: rs(12),
    fontWeight: '700',
    color: REVIEW_COLORS.chipText,
  },
  tagTextActive: {
    color: REVIEW_COLORS.chipTextActive,
  },
  customTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginTop: rs(2),
  },
  customTagInput: {
    flex: 1,
    minHeight: rs(38),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: REVIEW_COLORS.border,
    paddingHorizontal: rs(14),
    fontSize: rs(13),
    color: REVIEW_COLORS.textPrimary,
    backgroundColor: REVIEW_COLORS.surface,
  },
  customTagButton: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(9),
    borderRadius: 999,
    backgroundColor: REVIEW_COLORS.accent,
  },
  customTagButtonDisabled: {
    opacity: 0.4,
  },
  customTagButtonText: {
    fontSize: rs(13),
    fontWeight: '700',
    color: REVIEW_COLORS.buttonText,
  },
});