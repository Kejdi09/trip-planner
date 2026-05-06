import { StyleSheet } from 'react-native';
import { C, rs } from './theme';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  screen: { flex: 1, backgroundColor: C.bg },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: rs(24),
    paddingTop: rs(20),
    paddingBottom: rs(16),
  },
  title: {
    fontSize: rs(28),
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.5,
  },

  scrollContent: {
    paddingHorizontal: rs(24),
    paddingBottom: rs(120),
  },

  // ── Stat tiles grid ─────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(12),
    marginBottom: rs(32),
  },
  statTile: {
    width: '47%',
    borderRadius: rs(18),
    padding: rs(18),
    gap: rs(6),
  },
  statIcon: {
    marginBottom: rs(4),
  },
  statNumber: {
    fontSize: rs(30),
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: rs(14),
    fontWeight: '500',
    color: C.muted,
  },

  // ── Map section ─────────────────────────────────────────────────────────
  mapSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(14),
  },
  mapSectionTitle: {
    fontSize: rs(20),
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  viewTripsLink: {
    fontSize: rs(14),
    fontWeight: '700',
    color: C.primary,
  },
  mapContainer: {
    height: rs(200),
    borderRadius: rs(20),
    borderWidth: 2,
    borderColor: C.mapBorder,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
  },
  mapPlaceholderText: {
    fontSize: rs(13),
    color: C.muted,
    fontWeight: '500',
  },
});
