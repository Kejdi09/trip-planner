import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DUMMY_PLACES, FILTER_OPTIONS } from '@/components/discover/discover-data';
import { DiscoverBottomNav } from '@/components/discover/discover-bottom-nav';
import { DiscoverHeader } from '@/components/discover/discover-header';
import { DiscoverPlacesSection } from '@/components/discover/discover-places-section';
import { FilterPanel } from '@/components/discover/filter-panel';
import { styles } from '@/components/discover-screen.styles';

export function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>(['top_rated']);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [savedPlaceIds, setSavedPlaceIds] = React.useState<string[]>([]);

  const filteredPlaces = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return DUMMY_PLACES;
    }

    return DUMMY_PLACES.filter((place) =>
      `${place.title} ${place.region} ${place.visited}`.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((current) =>
      current.includes(filterId)
        ? current.filter((id) => id !== filterId)
        : [...current, filterId],
    );
  };

  const toggleSavedPlace = (placeId: string) => {
    setSavedPlaceIds((current) =>
      current.includes(placeId)
        ? current.filter((id) => id !== placeId)
        : [...current, placeId],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <DiscoverHeader
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          onPressFilter={() => setIsFilterOpen((current) => !current)}
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 124 }]}
          showsVerticalScrollIndicator={false}>
          <DiscoverPlacesSection
            places={filteredPlaces}
            savedPlaceIds={savedPlaceIds}
            searchQuery={searchQuery}
            onToggleSavedPlace={toggleSavedPlace}
          />
        </ScrollView>

        <FilterPanel
          isOpen={isFilterOpen}
          options={FILTER_OPTIONS}
          selectedFilters={selectedFilters}
          onToggleFilter={toggleFilter}
          onClearFilters={() => setSelectedFilters([])}
          onApplyFilters={() => setIsFilterOpen(false)}
          onDismiss={() => setIsFilterOpen(false)}
        />

        <DiscoverBottomNav />
      </View>
    </SafeAreaView>
  );
}
