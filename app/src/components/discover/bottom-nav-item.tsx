import React from 'react';
import { Text, View } from 'react-native';

import { styles } from '@/components/discover-screen.styles';

type BottomNavItemProps = {
  label: string;
  active?: boolean;
  icon: React.ReactNode;
};

export function BottomNavItem({ label, icon, active = false }: BottomNavItemProps) {
  return (
    <View style={styles.bottomItem}>
      {icon}
      <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>{label}</Text>
    </View>
  );
}
