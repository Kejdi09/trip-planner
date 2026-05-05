import React from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FILTER_GROUPS } from '@/components/discover/discover-data';
import { AppBottomNav } from '@/components/ui/app-bottom-nav';
import { FilterSheet } from '@/components/ui/filter-sheet';
import { PlaceListSection } from '@/components/ui/place-list-section';
import { SearchHeader } from '@/components/ui/search-header';
import { StatusMessage } from '@/components/ui/status-message';
import type { DiscoverPlace } from '../../../lib/discover-api';
import { fetchDiscoverPlaces } from '../../../lib/discover-api';
import { styles } from './discover-screen.styles';

export function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>(['high', 'culture', 'history']);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [savedPlaceIds, setSavedPlaceIds] = React.useState<string[]>([]);
  const [places, setPlaces] = React.useState<DiscoverPlace[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadPlaces = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const placeRows = await fetchDiscoverPlaces();
        if (!isMounted) {
          return;
        }

        setPlaces(placeRows);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load destinations.';
        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPlaces();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPlaces = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return places;
    }

    return places.filter((place) =>
      `${place.title} ${place.region} ${place.visited}`.toLowerCase().includes(query),
    );
  }, [places, searchQuery]);

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

  const handlePressPlaceDetails = (place: DiscoverPlace) => {
    router.push({ pathname: '/destination-overview', params: { id: place.id } });
  };

  const handlePressAddPlace = (place: DiscoverPlace) => {
    router.push({ pathname: '/write-review', params: { id: place.id } });
  };

  const statusMessage = isLoading
    ? 'Loading destinations...'
    : errorMessage;

  const showStatusMessage = Boolean(statusMessage);

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
            {showStatusMessage ? (
              <StatusMessage message={statusMessage} style={styles.statusMessage} />
            ) : (
              <PlaceListSection
                title="Popular Places"
                places={filteredPlaces}
                savedPlaceIds={savedPlaceIds}
                searchQuery={searchQuery}
                onToggleSavedPlace={toggleSavedPlace}
                onPressPlaceDetails={handlePressPlaceDetails}
                onPressAddPlace={handlePressAddPlace}
              />
            )}
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
