import { StyleSheet } from 'react-native';

export const BOTTOM_NAV_THEME = {
  colors: {
    primary: '#008D9B',
    background: '#FFFFFF',
    navIconInactive: '#62707A',
    navBorder: '#D9D9D9',
  },
} as const;

export const bottomNavStyles = StyleSheet.create({
  bottomNavGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 19,
    elevation: 6,
  },
  bottomNavNativeBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    zIndex: 19,
  },
  bottomNav: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(217, 217, 217, 0.82)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 21,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  bottomItem: {
    alignItems: 'center',
    minWidth: 56,
    gap: 2,
    paddingVertical: 2,
  },
  bottomLabel: {
    color: BOTTOM_NAV_THEME.colors.navIconInactive,
    fontSize: 12,
    fontWeight: '600',
  },
  bottomLabelActive: {
    color: BOTTOM_NAV_THEME.colors.primary,
  },
});
