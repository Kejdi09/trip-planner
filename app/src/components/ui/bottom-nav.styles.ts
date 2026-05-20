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
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BOTTOM_NAV_THEME.colors.background,
    borderWidth: 1,
    borderColor: BOTTOM_NAV_THEME.colors.navBorder,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 21,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
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
