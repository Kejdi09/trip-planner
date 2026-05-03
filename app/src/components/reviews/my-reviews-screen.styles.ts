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
    gap: rs(8),
    paddingHorizontal: rs(20),
    paddingTop: rs(10),
    paddingBottom: rs(12),
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
    fontSize: rs(24),
    fontWeight: '700',
    color: '#111111',
    fontFamily: REVIEW_FONTS.heading,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#E6E6E6',
  },
  sortSection: {
    paddingHorizontal: rs(20),
    paddingTop: rs(10),
    paddingBottom: rs(10),
    gap: rs(10),
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
  scrollContent: {
    paddingHorizontal: rs(20),
    paddingBottom: rs(120),
    gap: rs(14),
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
  destinationTitle: {
    fontSize: rs(15),
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
    fontSize: rs(13),
    lineHeight: rs(18),
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
    marginTop: rs(8),
    marginBottom: rs(16),
    alignSelf: 'center',
    paddingHorizontal: rs(32),
    paddingVertical: rs(10),
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
