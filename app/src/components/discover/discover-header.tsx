import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { DISCOVER_THEME, styles } from '@/components/discover-screen.styles';

const { colors } = DISCOVER_THEME;

type DiscoverHeaderProps = {
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  onPressFilter: () => void;
};

export function DiscoverHeader({
  searchQuery,
  onChangeSearchQuery,
  onPressFilter,
}: DiscoverHeaderProps) {
  return (
    <View style={styles.topSection}>
      <Text style={styles.header}>Discover</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <TextInput
            placeholder="Search destinations..."
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onChangeSearchQuery}
          />
          <Feather name="search" size={20} color={colors.searchIcon} />
        </View>

        <Pressable style={styles.filterButton} onPress={onPressFilter}>
          <Feather name="sliders" size={18} color={colors.background} />
        </Pressable>
      </View>
    </View>
  );
}
