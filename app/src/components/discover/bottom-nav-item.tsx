import React from 'react';
import { Pressable, Text } from 'react-native';

import { styles } from '@/components/discover-screen.styles';

type BottomNavItemProps = {
  label: string;
  active?: boolean;
  icon: React.ReactNode;
  onPress: () => void;
};

export function BottomNavItem({ label, icon, active = false, onPress }: BottomNavItemProps) {
  return (
    <Pressable style={styles.bottomItem} onPress={onPress}>
      {icon}
      <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>{label}</Text>
    </Pressable>
  );
}
