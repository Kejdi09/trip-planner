import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavItem } from '@/components/discover/bottom-nav-item';
import { DISCOVER_THEME, styles } from '@/components/discover-screen.styles';

const { colors } = DISCOVER_THEME;

export function DiscoverBottomNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(12, insets.bottom + 8) }]}>
      <BottomNavItem
        label="Feed"
        active={isActive('/')}
        icon={<Feather name="home" size={24} color={colors.navIconInactive} />}
        onPress={() => router.push('/')}
      />
      <BottomNavItem
        label="Discover"
        active={isActive('/explore')}
        icon={<Feather name="search" size={24} color={colors.primary} />}
        onPress={() => router.push('/explore')}
      />
      <BottomNavItem
        label="Groups"
        active={isActive('/groups')}
        icon={<Ionicons name="people-outline" size={24} color={colors.navIconInactive} />}
        onPress={() => router.push('/groups')}
      />
      <BottomNavItem
        label="History"
        active={isActive('/history')}
        icon={<FontAwesome5 name="map-marked-alt" size={22} color={colors.navIconInactive} />}
        onPress={() => router.push('/history')}
      />
      <BottomNavItem
        label="Profile"
        active={isActive('/profile')}
        icon={<MaterialCommunityIcons name="account-outline" size={24} color={colors.navIconInactive} />}
        onPress={() => router.push('/profile')}
      />
    </View>
  );
}
