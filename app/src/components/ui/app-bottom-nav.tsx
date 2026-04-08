import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavItem } from '@/components/ui/bottom-nav-item';
import { BOTTOM_NAV_THEME, bottomNavStyles } from '@/components/ui/bottom-nav.styles';

const { colors } = BOTTOM_NAV_THEME;

export type AppTab = 'Feed' | 'Discover' | 'Groups' | 'History' | 'Profile';

type AppBottomNavProps = {
  activeTab?: AppTab;
  onPressTab?: (tab: AppTab) => void;
};

export function AppBottomNav({ activeTab = 'Discover', onPressTab }: AppBottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[bottomNavStyles.bottomNav, { paddingBottom: Math.max(12, insets.bottom + 8) }]}>
      <BottomNavItem
        label="Feed"
        active={activeTab === 'Feed'}
        onPress={() => onPressTab?.('Feed')}
        icon={
          <Feather
            name="home"
            size={24}
            color={activeTab === 'Feed' ? colors.primary : colors.navIconInactive}
          />
        }
      />
      <BottomNavItem
        label="Discover"
        active={activeTab === 'Discover'}
        onPress={() => onPressTab?.('Discover')}
        icon={
          <Feather
            name="search"
            size={24}
            color={activeTab === 'Discover' ? colors.primary : colors.navIconInactive}
          />
        }
      />
      <BottomNavItem
        label="Groups"
        active={activeTab === 'Groups'}
        onPress={() => onPressTab?.('Groups')}
        icon={
          <Ionicons
            name="people-outline"
            size={24}
            color={activeTab === 'Groups' ? colors.primary : colors.navIconInactive}
          />
        }
      />
      <BottomNavItem
        label="History"
        active={activeTab === 'History'}
        onPress={() => onPressTab?.('History')}
        icon={
          <FontAwesome5
            name="map-marked-alt"
            size={22}
            color={activeTab === 'History' ? colors.primary : colors.navIconInactive}
          />
        }
      />
      <BottomNavItem
        label="Profile"
        active={activeTab === 'Profile'}
        onPress={() => onPressTab?.('Profile')}
        icon={
          <MaterialCommunityIcons
            name="account-outline"
            size={24}
            color={activeTab === 'Profile' ? colors.primary : colors.navIconInactive}
          />
        }
      />
    </View>
  );
}
