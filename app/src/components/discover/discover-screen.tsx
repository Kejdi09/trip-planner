import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DUMMY_PLACES, FILTER_GROUPS } from '@/components/discover/discover-data';
import { AppBottomNav } from '@/components/ui/app-bottom-nav';
import { FilterSheet } from '@/components/ui/filter-sheet';
import { PlaceListSection } from '@/components/ui/place-list-section';
import { SearchHeader } from '@/components/ui/search-header';
import { styles } from './discover-screen.styles';

export function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>(['high', 'culture', 'history']);
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
        <SearchHeader
          title="Discover"
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          searchPlaceholder="Search destinations..."
          onPressFilter={() => setIsFilterOpen((current) => !current)}
        />

        <View style={styles.contentArea}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 124 }]}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isFilterOpen}>
            <PlaceListSection
              title="Popular Places"
              places={filteredPlaces}
              savedPlaceIds={savedPlaceIds}
              searchQuery={searchQuery}
              onToggleSavedPlace={toggleSavedPlace}
            />
          </ScrollView>

          <FilterSheet
            isOpen={isFilterOpen}
            groups={FILTER_GROUPS}
            selectedFilters={selectedFilters}
            onToggleFilter={toggleFilter}
            onApplyFilters={() => setIsFilterOpen(false)}
          />
        </View>

        <AppBottomNav activeTab="Discover" />
      </View>
    </SafeAreaView>
  );
}
