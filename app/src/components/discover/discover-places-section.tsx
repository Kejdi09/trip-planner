import React from 'react';
import { Text, View } from 'react-native';

import { PlaceCard } from '@/components/discover/place-card';
import { styles } from '@/components/discover-screen.styles';
import type { Place } from '@/components/discover/types';

type DiscoverPlacesSectionProps = {
  places: readonly Place[];
  savedPlaceIds: string[];
  searchQuery: string;
  onToggleSavedPlace: (placeId: string) => void;
};

export function DiscoverPlacesSection({
  places,
  savedPlaceIds,
  searchQuery,
  onToggleSavedPlace,
}: DiscoverPlacesSectionProps) {
  return (
    <>
      <Text style={styles.sectionTitle}>Popular Places</Text>

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
          <Text style={styles.noResultsText}>No places found for "{searchQuery.trim()}".</Text>
        )}
      </View>
    </>
  );
}
