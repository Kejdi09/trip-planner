import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { styles } from '@/components/discover-screen.styles';
import type { FilterOption } from '@/components/discover/types';

const POPULARITY_FILTER_IDS = new Set(['high', 'medium', 'low']);

type FilterPanelProps = {
  isOpen: boolean;
  options: readonly FilterOption[];
  selectedFilters: string[];
  onToggleFilter: (filterId: string) => void;
  onApplyFilters: () => void;
};

export function FilterPanel({
  isOpen,
  options,
  selectedFilters,
  onToggleFilter,
  onApplyFilters,
}: FilterPanelProps) {
  if (!isOpen) {
    return null;
  }

  const popularityFilters = options.filter((option) => POPULARITY_FILTER_IDS.has(option.id));
  const tagFilters = options.filter((option) => !POPULARITY_FILTER_IDS.has(option.id));

  const renderChip = (filter: FilterOption) => {
    const isActive = selectedFilters.includes(filter.id);

    return (
      <Pressable
        key={filter.id}
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => onToggleFilter(filter.id)}>
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {filter.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.filterPanel}>
      <View style={styles.filterDivider} />

      <View style={styles.filterPanelContent}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupTitle}>Filter by Popularity</Text>
          <View style={styles.filterChipRow}>{popularityFilters.map(renderChip)}</View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupTitle}>Filter by Tags</Text>
          <View style={styles.filterChipList}>{tagFilters.map(renderChip)}</View>
        </View>

        <Pressable style={styles.filterApplyButton} onPress={onApplyFilters}>
          <Text style={styles.filterApplyButtonText}>Apply Filters</Text>
        </Pressable>
      </View>
    </View>
  );
}
