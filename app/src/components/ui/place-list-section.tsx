import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PlaceCard } from '@/components/ui/place-card';
import type { Place } from '@/components/ui/types';

const SECTION_THEME = {
  spacing: 8,
  colors: {
    textPrimary: '#000000',
    textSecondary: '#A19D9D',
  },
} as const;

const { spacing, colors } = SECTION_THEME;

type PlaceListSectionProps = {
  title: string;
  places: readonly Place[];
  savedPlaceIds: string[];
  searchQuery: string;
  onToggleSavedPlace: (placeId: string) => void;
  emptyStatePrefix?: string;
};

export function PlaceListSection({
  title,
  places,
  savedPlaceIds,
  searchQuery,
  onToggleSavedPlace,
  emptyStatePrefix = 'No places found for',
}: PlaceListSectionProps) {
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.cardList}>
        {places.length > 0 ? (
          places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              isSaved={savedPlaceIds.includes(place.id)}
              onToggleSaved={() => onToggleSavedPlace(place.id)}
            />
          ))
        ) : (
          <Text style={styles.noResultsText}>
            {emptyStatePrefix} &quot;{searchQuery.trim()}&quot;.
          </Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: spacing * 2,
  },
  cardList: {
    gap: spacing * 2,
  },
  noResultsText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
});
