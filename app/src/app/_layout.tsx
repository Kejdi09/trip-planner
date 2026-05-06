import { Stack, usePathname } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { AppBottomNav, AppTab } from '@/components/ui/app-bottom-nav';

const getActiveTab = (pathname: string): AppTab => {
  if (
    pathname.startsWith('/profile') ||
    pathname.startsWith('/my-reviews') ||
    pathname.startsWith('/my-wishlist')
  ) {
    return 'Profile';
  }
  if (pathname.startsWith('/voting')) return 'Groups';
  if (
    pathname.startsWith('/explore') ||
    pathname.startsWith('/destination') ||
    pathname.startsWith('/write-review')
  ) {
    return 'Discover';
  }

  return 'Discover';
};

export default function TabLayout() {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname ?? '/');
  const hideBottomNav = !pathname || pathname === '/' || pathname.startsWith('/index');

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {hideBottomNav ? null : <AppBottomNav activeTab={activeTab} />}
    </View>
  );
}
