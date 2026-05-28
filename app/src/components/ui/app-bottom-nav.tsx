import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
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
  const router = useRouter();

  const handleTabPress = (tab: AppTab) => {
    onPressTab?.(tab);

    if (tab === 'Feed') router.replace('/feed');
    if (tab === 'Discover') router.replace('/explore');
    if (tab === 'Groups') router.replace('/groups');
    if (tab === 'History') router.replace('/my-travels');
    if (tab === 'Profile') router.replace('/profile');
  };

  const navBottom = Math.max(10, insets.bottom + 6);
  const gradientHeight = navBottom + 132;

  const webGradientStyle = Platform.OS === 'web'
    ? ({
        backgroundImage:
          'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.10) 32%, rgba(255,255,255,0.34) 62%, rgba(255,255,255,0.78) 100%)',
      } as ViewStyle)
    : null;

  return (
    <>
      {Platform.OS === 'web' ? (
        <View pointerEvents="none" style={[bottomNavStyles.bottomNavGradient, { height: gradientHeight }, webGradientStyle]} />
      ) : (
        <View
          pointerEvents="none"
          style={[bottomNavStyles.bottomNavNativeBackdrop, { height: navBottom + 58 }]}
        />
      )}
      <View style={[bottomNavStyles.bottomNav, { bottom: navBottom }]}>
      <BottomNavItem
        label="Feed"
        active={activeTab === 'Feed'}
        onPress={() => handleTabPress('Feed')}
        icon={<Feather name="home" size={24} color={activeTab === 'Feed' ? colors.primary : colors.navIconInactive} />}
      />
      <BottomNavItem
        label="Discover"
        active={activeTab === 'Discover'}
        onPress={() => handleTabPress('Discover')}
        icon={<Feather name="search" size={24} color={activeTab === 'Discover' ? colors.primary : colors.navIconInactive} />}
      />
      <BottomNavItem
        label="Groups"
        active={activeTab === 'Groups'}
        onPress={() => handleTabPress('Groups')}
        icon={<Ionicons name="people-outline" size={24} color={activeTab === 'Groups' ? colors.primary : colors.navIconInactive} />}
      />
      <BottomNavItem
        label="History"
        active={activeTab === 'History'}
        onPress={() => handleTabPress('History')}
        icon={<FontAwesome5 name="map-marked-alt" size={22} color={activeTab === 'History' ? colors.primary : colors.navIconInactive} />}
      />
      <BottomNavItem
        label="Profile"
        active={activeTab === 'Profile'}
        onPress={() => handleTabPress('Profile')}
        icon={<MaterialCommunityIcons name="account-outline" size={24} color={activeTab === 'Profile' ? colors.primary : colors.navIconInactive} />}
      />
      </View>
    </>
  );
}
