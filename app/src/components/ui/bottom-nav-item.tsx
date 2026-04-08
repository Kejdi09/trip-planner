import React from 'react';
import { Pressable, Text } from 'react-native';

import { bottomNavStyles } from '@/components/ui/bottom-nav.styles';

type BottomNavItemProps = {
  label: string;
  active?: boolean;
  icon: React.ReactNode;
  onPress?: () => void;
};

export function BottomNavItem({ label, icon, active = false, onPress }: BottomNavItemProps) {
  return (
    <Pressable style={bottomNavStyles.bottomItem} onPress={onPress}>
      {icon}
      <Text style={[bottomNavStyles.bottomLabel, active && bottomNavStyles.bottomLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}
