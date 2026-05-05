import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const HEADER_THEME = {
  spacing: 8,
  borderRadius: 25,
  colors: {
    primary: '#008D9B',
    background: '#FFFFFF',
    textPrimary: '#000000',
    textSecondary: '#A19D9D',
    searchBackground: '#E3E8EC',
    searchIcon: '#4E5A64',
  },
} as const;

const { spacing, borderRadius, colors } = HEADER_THEME;

type SearchHeaderProps = {
  title: string;
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  searchPlaceholder?: string;
  showFilterButton?: boolean;
  onPressFilter?: () => void;
  // BATCH 1: badge count for active filters
  activeFilterCount?: number;
};

export function SearchHeader({
  title,
  searchQuery,
  onChangeSearchQuery,
  searchPlaceholder = 'Search...',
  showFilterButton = true,
  onPressFilter,
  activeFilterCount = 0,
}: SearchHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <TextInput
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onChangeSearchQuery}
          />
          <Feather name="search" size={20} color={colors.searchIcon} />
        </View>

        {showFilterButton ? (
          <Pressable style={styles.filterButton} onPress={onPressFilter}>
            <Feather name="sliders" size={18} color={colors.background} />
            {/* BATCH 1: badge shown when filters are active */}
            {activeFilterCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingTop: spacing * 3,
    paddingHorizontal: spacing * 3,
    paddingBottom: spacing,
    zIndex: 11,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '700',
    marginBottom: spacing * 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing * 2,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.searchBackground,
    borderRadius: borderRadius,
    paddingHorizontal: spacing * 2,
    height: spacing * 5,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    marginRight: spacing,
    paddingVertical: 0,
  },
  filterButton: {
    height: spacing * 6,
    width: spacing * 6,
    borderRadius: spacing * 3,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});