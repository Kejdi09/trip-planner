import { Stack, usePathname } from 'expo-router';
import React from 'react';
import { Keyboard, View } from 'react-native';

import { AppBottomNav, AppTab } from '@/components/ui/app-bottom-nav';
import { registerForPushNotificationsOnce } from '../../lib/push-notifications';

const getActiveTab = (pathname: string): AppTab => {
  if (pathname.startsWith('/feed')) {
    return 'Feed';
  }

  if (
    pathname.startsWith('/profile') ||
    pathname.startsWith('/my-reviews') ||
    pathname.startsWith('/my-wishlist') ||
    pathname.startsWith('/my-friends') ||
    pathname.startsWith('/add-friends')
  ) {
    return 'Profile';
  }
  if (
    pathname.startsWith('/groups') ||
    pathname.startsWith('/group-chat') ||
    pathname.startsWith('/create-group') ||
    pathname.startsWith('/invite-to-group') ||
    pathname.startsWith('/voting')
  ) {
    return 'Groups';
  }

  if (
    pathname.startsWith('/my-travels') ||
    pathname.startsWith('/my-trips') ||
    pathname.startsWith('/itinerary') ||
    pathname.startsWith('/itenerary')
  ) {
    return 'History';
  }

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
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);
  const hideBottomNav =
    keyboardVisible ||
    !pathname ||
    pathname === '/' ||
    pathname.startsWith('/index') ||
    pathname.startsWith('/reset-password');

  React.useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  React.useEffect(() => {
    void registerForPushNotificationsOnce().catch((error) => {
      console.warn('Push notification registration skipped:', error?.message || error);
    });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {hideBottomNav ? null : <AppBottomNav activeTab={activeTab} />}
    </View>
  );
}
