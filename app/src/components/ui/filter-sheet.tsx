import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FilterGroup, FilterOption } from '@/components/ui/types';

const SHEET_THEME = {
  spacing: 8,
  colors: {
    primary: '#008D9B',
    background: '#FFFFFF',
    textSecondary: '#8E8E8E',
    chipBackground: '#D3DAE0',
    chipText: '#091018',
    divider: '#CCCCCC',
  },
} as const;

const { spacing, colors } = SHEET_THEME;

type FilterSheetProps = {
  isOpen: boolean;
  groups: readonly FilterGroup[];
  selectedFilters: string[];
  onToggleFilter: (filterId: string) => void;
  onApplyFilters: () => void;
  applyLabel?: string;
};

export function FilterSheet({
  isOpen,
  groups,
  selectedFilters,
  onToggleFilter,
  onApplyFilters,
  applyLabel = 'Apply Filters',
}: FilterSheetProps) {
  if (!isOpen) {
    return null;
  }

  const renderChip = (filter: FilterOption) => {
    const isActive = selectedFilters.includes(filter.id);

    return (
      <Pressable
        key={filter.id}
        style={[styles.chip, isActive && styles.chipActive]}
        onPress={() => onToggleFilter(filter.id)}>
        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{filter.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.panel}>
      <View style={styles.divider} />

      <View style={styles.content}>
        {groups.map((group) => (
          <View key={group.id} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={group.layout === 'row' ? styles.chipRow : styles.chipWrap}>
              {group.options.map(renderChip)}
            </View>
          </View>
        ))}

        <Pressable style={styles.applyButton} onPress={onApplyFilters}>
          <Text style={styles.applyButtonText}>{applyLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
    zIndex: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  content: {
    flex: 1,
    paddingTop: spacing * 3,
    paddingHorizontal: spacing * 3,
    paddingBottom: spacing * 3,
  },
  group: {
    marginBottom: spacing * 4,
  },
  groupTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing * 2,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing * 2,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing * 1.5,
  },
  chip: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: spacing * 2,
    paddingVertical: spacing * 0.75,
    backgroundColor: colors.chipBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.chipText,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.background,
  },
  applyButton: {
    marginTop: 'auto',
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing * 6,
  },
  applyButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
});
