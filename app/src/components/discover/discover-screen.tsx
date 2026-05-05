import React from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterSheet } from '@/components/ui/filter-sheet';
import { PlaceListSection } from '@/components/ui/place-list-section';
import { SearchHeader } from '@/components/ui/search-header';
import { StatusMessage } from '@/components/ui/status-message';
import type { FilterGroup, FilterOption } from '@/components/ui/types';
import type { DiscoverPlace } from '../../../lib/discover-api';
import { fetchDiscoverPlaces } from '../../../lib/discover-api';
import { styles } from './discover-screen.styles';

function buildCountryFilterGroups(options: FilterOption[]): FilterGroup[] {
  return [{ id: 'country', title: 'Country', options, layout: 'wrap' }];
}

export function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [savedPlaceIds, setSavedPlaceIds] = React.useState<string[]>([]);
  const [places, setPlaces] = React.useState<DiscoverPlace[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const countryOptions = React.useMemo<FilterOption[]>(() => {
    const countryMap = new Map<string, string>();
    places.forEach((place) => {
      const country = place.country?.trim();
      if (!country) return;
      const key = country.toLowerCase();
      if (!countryMap.has(key)) countryMap.set(key, country);
    });
    return Array.from(countryMap.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [places]);

  const filterGroups = React.useMemo(
    () => buildCountryFilterGroups(countryOptions),
    [countryOptions],
  );

  React.useEffect(() => {
    let isMounted = true;
    const loadPlaces = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const placeRows = await fetchDiscoverPlaces();
        if (!isMounted) return;
        setPlaces(placeRows);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load destinations.';
        setErrorMessage(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void loadPlaces();
    return () => { isMounted = false; };
  }, []);

  const filteredPlaces = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const activeCountries = selectedFilters;
    return places.filter((place) => {
      const matchesSearch = !query
        ? true
        : `${place.title} ${place.region} ${place.visited}`.toLowerCase().includes(query);
      const placeCountry = place.country?.toLowerCase() ?? '';
      const matchesCountry =
        activeCountries.length === 0 || (placeCountry && activeCountries.includes(placeCountry));
      return matchesSearch && matchesCountry;
    });
  }, [places, searchQuery, selectedFilters]);

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((current) =>
      current.includes(filterId) ? current.filter((id) => id !== filterId) : [...current, filterId],
    );
  };

  const toggleSavedPlace = (placeId: string) => {
    setSavedPlaceIds((current) =>
      current.includes(placeId) ? current.filter((id) => id !== placeId) : [...current, placeId],
    );
  };

  const handlePressPlaceDetails = (place: DiscoverPlace) => {
    router.push({ pathname: '/destination-overview', params: { id: place.id } });
  };

  const handlePressAddPlace = (place: DiscoverPlace) => {
    router.push({ pathname: '/write-review', params: { id: place.id } });
  };

  const statusMessage = isLoading ? 'Loading destinations...' : errorMessage;
  const showStatusMessage = Boolean(statusMessage);

  // BATCH 1: active filter count for badge
  const activeFilterCount = selectedFilters.length;

  // BATCH 1: no results but data exists
  const showEmptySearch =
    !isLoading && !errorMessage && filteredPlaces.length === 0 && places.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <SearchHeader
          title="Discover"
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          searchPlaceholder="Search destinations..."
          activeFilterCount={activeFilterCount}
          onPressFilter={() => setIsFilterOpen((current) => !current)}
        />

        <View style={styles.contentArea}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 124 }]}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isFilterOpen}>

            {showStatusMessage ? (
              <StatusMessage message={statusMessage!} style={styles.statusMessage} />
            ) : showEmptySearch ? (
              // BATCH 1: Empty search state
              <View style={emptyStyles.container}>
                <Text style={emptyStyles.emoji}>🔍</Text>
                <Text style={emptyStyles.title}>
                  {searchQuery.trim() ? `No results for "${searchQuery.trim()}"` : 'No destinations match'}
                </Text>
                <Text style={emptyStyles.body}>
                  {activeFilterCount > 0
                    ? 'Try removing some filters or clearing your search.'
                    : 'Try a different search term.'}
                </Text>
                {(searchQuery.trim() || activeFilterCount > 0) ? (
                  <Text
                    style={emptyStyles.clearLink}
                    onPress={() => { setSearchQuery(''); setSelectedFilters([]); }}>
                    Clear search & filters
                  </Text>
                ) : null}
              </View>
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
            groups={filterGroups}
            selectedFilters={selectedFilters}
            onToggleFilter={toggleFilter}
            onApplyFilters={() => setIsFilterOpen(false)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  body: {
    fontSize: 13,
    color: '#A19D9D',
    textAlign: 'center',
    lineHeight: 18,
  },
  clearLink: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#008D9B',
  },
});