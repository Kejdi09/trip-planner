import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavItem } from '@/components/discover/bottom-nav-item';
import { DISCOVER_THEME, styles } from '@/components/discover-screen.styles';

const { colors } = DISCOVER_THEME;

export function DiscoverBottomNav() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(12, insets.bottom + 8) }]}>
      <BottomNavItem
        label="Feed"
        icon={<Feather name="home" size={24} color={colors.navIconInactive} />}
      />
      <BottomNavItem
        label="Discover"
        active
        icon={<Feather name="search" size={24} color={colors.primary} />}
      />
      <BottomNavItem
        label="Groups"
        icon={<Ionicons name="people-outline" size={24} color={colors.navIconInactive} />}
      />
      <BottomNavItem
        label="History"
        icon={<FontAwesome5 name="map-marked-alt" size={22} color={colors.navIconInactive} />}
      />
      <BottomNavItem
        label="Profile"
        icon={<MaterialCommunityIcons name="account-outline" size={24} color={colors.navIconInactive} />}
      />
    </View>
  );
}
