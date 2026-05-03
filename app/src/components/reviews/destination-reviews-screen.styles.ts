import { StyleSheet } from 'react-native';

import { REVIEW_COLORS, REVIEW_FONTS, rs } from './review-theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#9AA0A6',
    fontFamily: REVIEW_FONTS.body,
  },
  tabTextActive: {
    color: '#0B8F98',
  },
  sortSection: {
    gap: rs(8),
  },
  sortLabel: {
    fontSize: rs(13),
    fontWeight: '700',
    color: '#8A8A8A',
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
    backgroundColor: '#EEF1F4',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortChipActive: {
    backgroundColor: '#0B8F98',
    borderColor: '#0B8F98',
  },
  sortChipText: {
    fontSize: rs(13),
    fontWeight: '700',
    color: '#1B1E23',
    fontFamily: REVIEW_FONTS.body,
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: rs(16),
    padding: rs(14),
    borderWidth: 1,
    borderColor: '#E6E6E6',
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
    color: '#111111',
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
    color: '#111111',
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
    color: '#9B9B9B',
    fontFamily: REVIEW_FONTS.body,
  },
  reviewBody: {
    marginTop: rs(8),
    fontSize: rs(12.5),
    lineHeight: rs(16),
    color: '#4F4F4F',
    fontFamily: REVIEW_FONTS.body,
  },
  statusText: {
    fontSize: rs(12),
    fontWeight: '600',
    color: '#8A8A8A',
    fontFamily: REVIEW_FONTS.body,
    lineHeight: rs(16),
  },
  errorText: {
    fontSize: rs(12),
    fontWeight: '600',
    color: '#D54545',
    fontFamily: REVIEW_FONTS.body,
    lineHeight: rs(16),
  },
  viewMoreButton: {
    marginTop: rs(6),
    alignSelf: 'center',
    paddingHorizontal: rs(30),
    paddingVertical: rs(9),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: '#FFFFFF',
  },
  viewMoreText: {
    fontSize: rs(13),
    fontWeight: '700',
    color: '#111111',
    fontFamily: REVIEW_FONTS.body,
  },
});
