import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type RatingStarsProps = {
  value: number;
  max?: number;
  size?: number;
  color?: string;
  inactiveColor?: string;
  onChange?: (value: number) => void;
};

export function RatingStars({
  value,
  max = 5,
  size = 16,
  color = '#F4B400',
  inactiveColor = '#D1D5DB',
  onChange,
}: RatingStarsProps) {
  const isInteractive = typeof onChange === 'function';

  return (
    <View style={styles.row}>
      {Array.from({ length: max }).map((_, index) => {
        const starValue = index + 1;
        const iconName = starValue <= value ? 'star' : 'star-outline';

        if (isInteractive) {
          return (
            <Pressable key={`star-${starValue}`} onPress={() => onChange?.(starValue)} hitSlop={6}>
              <Ionicons
                name={iconName}
                size={size}
                color={starValue <= value ? color : inactiveColor}
              />
            </Pressable>
          );
        }

        return (
          <Ionicons
            key={`star-${starValue}`}
            name={iconName}
            size={size}
            color={starValue <= value ? color : inactiveColor}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
