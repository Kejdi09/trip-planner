import { StyleSheet } from 'react-native';
import { C, rs } from './theme';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  screen: { flex: 1, backgroundColor: C.bg },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(24),
    paddingTop: rs(16),
    paddingBottom: rs(14),
    gap: rs(12),
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

  scrollContent: {
    paddingBottom: rs(120),
    paddingTop: rs(8),
  },

  sectionLabel: {
    fontSize: rs(17),
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
    paddingHorizontal: rs(24),
    marginBottom: rs(4),
  },

  // ── Timeline list ────────────────────────────────────────────────────────
  timelineList: {
    paddingTop: rs(12),
  },
  tripRow: {
    flexDirection: 'row',
    paddingHorizontal: rs(24),
    marginBottom: rs(28),
  },

  // Left column: dot + line
  timelineLeft: {
    width: rs(20),
    alignItems: 'center',
    marginRight: rs(14),
    paddingTop: rs(4),
  },
  timelineDot: {
    width: rs(12),
    height: rs(12),
    borderRadius: rs(6),
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E8EAED',
    marginTop: rs(4),
  },

  // Right column: content
  tripContent: {
    flex: 1,
  },
  tripDestination: {
    fontSize: rs(16),
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.2,
    marginBottom: rs(2),
  },
  tripMeta: {
    fontSize: rs(13),
    color: C.muted,
    fontWeight: '500',
    marginBottom: rs(10),
  },

  // Member avatars + photos row
  tripMediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginBottom: rs(10),
  },
  memberAvatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    backgroundColor: C.primaryLight,
    borderWidth: 2,
    borderColor: C.bg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -rs(6),
  },
  memberAvatarFirst: { marginLeft: 0 },
  memberAvatarImage: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
  },
  memberAvatarText: {
    fontSize: rs(10),
    fontWeight: '700',
    color: C.primary,
  },
  memberOverflow: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    backgroundColor: C.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -rs(6),
    borderWidth: 2,
    borderColor: C.bg,
  },
  memberOverflowText: {
    fontSize: rs(10),
    fontWeight: '700',
    color: C.muted,
  },

  // Trip photo thumbnails
  photoStrip: {
    flexDirection: 'row',
    gap: rs(6),
    marginTop: rs(8),
  },
  photo: {
    width: rs(86),
    height: rs(70),
    borderRadius: rs(12),
    backgroundColor: C.pillBg,
  },

  // ── View all button ──────────────────────────────────────────────────────
  viewAllButton: {
    marginHorizontal: rs(24),
    marginTop: rs(4),
    height: rs(50),
    borderRadius: rs(16),
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: rs(15),
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.2,
  },
});
