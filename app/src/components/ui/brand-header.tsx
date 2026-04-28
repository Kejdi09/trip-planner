import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';

type BrandHeaderProps = {
  brandName?: string;
  containerStyle?: StyleProp<ViewStyle>;
  badgeStyle?: StyleProp<ViewStyle>;
  brandTextStyle?: StyleProp<TextStyle>;
};

export function BrandHeader({
  brandName = 'TripSync',
  containerStyle,
  badgeStyle,
  brandTextStyle,
}: BrandHeaderProps) {
  return (
    <View style={containerStyle}>
      <View style={badgeStyle}>
        <Feather name="navigation" size={20} color="#FFFFFF" />
      </View>
      <Text style={brandTextStyle}>{brandName}</Text>
    </View>
  );
}
