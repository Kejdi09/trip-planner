import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { styles } from '@/components/discover-screen.styles';
import type { FilterOption } from '@/components/discover/types';

type FilterPanelProps = {
  isOpen: boolean;
  options: readonly FilterOption[];
  selectedFilters: string[];
  onToggleFilter: (filterId: string) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
  onDismiss: () => void;
};

export function FilterPanel({
  isOpen,
  options,
  selectedFilters,
  onToggleFilter,
  onClearFilters,
  onApplyFilters,
  onDismiss,
}: FilterPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <Pressable style={styles.filterBackdrop} onPress={onDismiss} />

      <View style={styles.filterPanel}>
        <Text style={styles.filterPanelTitle}>Filter places</Text>

        <View style={styles.filterChipList}>
          {options.map((filter) => {
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
          })}
        </View>

        <View style={styles.filterActionRow}>
          <Pressable style={styles.clearFilterButton} onPress={onClearFilters}>
            <Text style={styles.clearFilterText}>Clear</Text>
          </Pressable>
          <Pressable style={styles.applyFilterButton} onPress={onApplyFilters}>
            <Text style={styles.applyFilterText}>Apply</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
