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
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BOTTOM_NAV_THEME.colors.background,
    borderTopWidth: 1,
    borderTopColor: BOTTOM_NAV_THEME.colors.navBorder,
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 21,
    elevation: 12,
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
