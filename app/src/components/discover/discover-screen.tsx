import React from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLoading } from '@/components/common/AppLoading';
import { FilterSheet } from '@/components/ui/filter-sheet';
import { PlaceListSection } from '@/components/ui/place-list-section';
import { SearchHeader } from '@/components/ui/search-header';
import { StatusMessage } from '@/components/ui/status-message';
import type { FilterGroup } from '@/components/ui/types';
import type { DiscoverPlace } from '../../../lib/discover-api';
import { fetchDiscoverPlaces } from '../../../lib/discover-api';
import { supabase } from '../../../lib/supabase';
import {
  addWishlistPlace,
  fetchWishlistPlaceIds,
  removeWishlistPlace,
} from '../../../lib/wishlist-api';
import { styles } from './discover-screen.styles';

const PAGE_SIZE = 10;

type SortOption = 'relevance' | 'population' | 'name';

type DiscoverFilters = {
  continent: string | null;
  minPopulation: number | null;
  sort: SortOption;
};

const POPULATION_OPTIONS: { id: string; label: string; value: number | null }[] = [
  { id: 'pop:any', label: 'Any size', value: null },
  { id: 'pop:50000', label: '50k+', value: 50000 },
  { id: 'pop:100000', label: '100k+', value: 100000 },
  { id: 'pop:500000', label: '500k+', value: 500000 },
  { id: 'pop:1000000', label: '1M+', value: 1000000 },
];

const CONTINENT_OPTIONS: { id: string; label: string; value: string | null }[] = [
  { id: 'continent:any', label: 'Any continent', value: null },
  { id: 'continent:EU', label: 'Europe', value: 'EU' },
  { id: 'continent:AS', label: 'Asia', value: 'AS' },
  { id: 'continent:AF', label: 'Africa', value: 'AF' },
  { id: 'continent:NA', label: 'North America', value: 'NA' },
  { id: 'continent:SA', label: 'South America', value: 'SA' },
  { id: 'continent:OC', label: 'Oceania', value: 'OC' },
];

const SORT_OPTIONS: { id: string; label: string; value: SortOption }[] = [
  { id: 'sort:relevance', label: 'Best match', value: 'relevance' },
  { id: 'sort:population', label: 'Most popular', value: 'population' },
  { id: 'sort:name', label: 'A-Z', value: 'name' },
];

export function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [userId, setUserId] = React.useState<string | null>(null);
  const [savedPlaceIds, setSavedPlaceIds] = React.useState<string[]>([]);
  const [places, setPlaces] = React.useState<DiscoverPlace[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);

  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<DiscoverFilters>({ continent: null, minPopulation: null, sort: 'relevance' });
  const [draftFilters, setDraftFilters] = React.useState<DiscoverFilters>(filters);

  const filterGroups = React.useMemo<FilterGroup[]>(() => [
    { id: 'continent', title: 'Continent', options: CONTINENT_OPTIONS.map((x) => ({ id: x.id, label: x.label })), layout: 'wrap' },
    { id: 'population', title: 'City size', options: POPULATION_OPTIONS.map((x) => ({ id: x.id, label: x.label })), layout: 'wrap' },
    { id: 'sort', title: 'Sort', options: SORT_OPTIONS.map((x) => ({ id: x.id, label: x.label })), layout: 'wrap' },
  ], []);

  const draftSelectedFilterIds = React.useMemo(() => [
    draftFilters.continent ? `continent:${draftFilters.continent}` : 'continent:any',
    draftFilters.minPopulation === null ? 'pop:any' : `pop:${draftFilters.minPopulation}`,
    `sort:${draftFilters.sort}`,
  ], [draftFilters]);

  const loadPlaces = React.useCallback(async (query: string, offset: number, append: boolean, nextFilters: DiscoverFilters) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    setErrorMessage(null);
    try {
      const placeRows = await fetchDiscoverPlaces({
        query,
        limit: PAGE_SIZE,
        offset,
        continent: nextFilters.continent,
        minPopulation: nextFilters.minPopulation,
        sort: nextFilters.sort,
      });
      setPlaces((prev) => (append ? [...prev, ...placeRows] : placeRows));
      setHasMore(placeRows.length === PAGE_SIZE);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load destinations.';
      setErrorMessage(message);
      if (!append) setPlaces([]);
    } finally {
      if (append) setIsLoadingMore(false);
      else setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void loadPlaces(searchQuery.trim(), 0, false, filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filters, loadPlaces]);

  React.useEffect(() => {
    let isMounted = true;

    const loadWishlist = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;

        if (!user || !isMounted) {
          return;
        }

        setUserId(user.id);
        const wishlistIds = await fetchWishlistPlaceIds(user.id);
        if (!isMounted) return;
        setSavedPlaceIds(wishlistIds);
      } catch {
        if (!isMounted) return;
        setSavedPlaceIds([]);
      }
    };

    void loadWishlist();
    return () => { isMounted = false; };
  }, []);

  const toggleSavedPlace = async (placeId: string) => {
    if (!userId) {
      return;
    }

    const isSaved = savedPlaceIds.includes(placeId);
    const nextSaved = isSaved
      ? savedPlaceIds.filter((id) => id !== placeId)
      : [...savedPlaceIds, placeId];

    setSavedPlaceIds(nextSaved);

    try {
      if (isSaved) {
        await removeWishlistPlace(userId, placeId);
      } else {
        await addWishlistPlace(userId, placeId);
      }
    } catch {
      setSavedPlaceIds(savedPlaceIds);
    }
  };

  const handlePressPlaceDetails = (place: DiscoverPlace) => {
    router.push({ pathname: '/destination-overview', params: { id: place.id } });
  };

  const handlePressAddPlace = (place: DiscoverPlace) => {
    router.push({ pathname: '/write-review', params: { id: place.id } });
  };

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    void loadPlaces(searchQuery.trim(), places.length, true, filters);
  };

  const statusMessage = isLoading ? 'Loading destinations...' : errorMessage;
  const showStatusMessage = Boolean(statusMessage);

  const activeFilterCount = [filters.continent !== null, filters.minPopulation !== null, filters.sort !== 'relevance'].filter(Boolean).length;

  const showEmptySearch =
    !isLoading && !errorMessage && places.length === 0;

  const onToggleDraftFilter = (filterId: string) => {
    if (filterId.startsWith('continent:')) {
      const code = filterId.split(':')[1];
      setDraftFilters((prev) => ({ ...prev, continent: code === 'any' ? null : code }));
      return;
    }
    if (filterId.startsWith('pop:')) {
      const raw = filterId.split(':')[1];
      setDraftFilters((prev) => ({ ...prev, minPopulation: raw === 'any' ? null : Number(raw) }));
      return;
    }
    if (filterId.startsWith('sort:')) {
      const raw = filterId.split(':')[1] as SortOption;
      setDraftFilters((prev) => ({ ...prev, sort: raw }));
    }
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    const reset: DiscoverFilters = { continent: null, minPopulation: null, sort: 'relevance' };
    setDraftFilters(reset);
    setFilters(reset);
    setIsFilterOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <SearchHeader
          title="Discover"
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          searchPlaceholder="Search destinations..."
          activeFilterCount={activeFilterCount}
          onPressFilter={() => { setDraftFilters(filters); setIsFilterOpen(true); }}
        />

        <View style={styles.contentArea}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 124 }]}
            showsVerticalScrollIndicator={false}
            scrollEnabled>

            {isLoading ? (
              <AppLoading message="Loading destinations..." />
            ) : showStatusMessage ? (
              <StatusMessage message={statusMessage!} style={styles.statusMessage} />
            ) : showEmptySearch ? (
              <View style={emptyStyles.container}>
                <Text style={emptyStyles.emoji}>🔍</Text>
                <Text style={emptyStyles.title}>
                  {searchQuery.trim() ? `No destinations found for "${searchQuery.trim()}"` : 'No destinations found'}
                </Text>
                <Text style={emptyStyles.body}>
                  No destinations found. Try clearing filters or changing your search.
                </Text>
                {(searchQuery.trim() || activeFilterCount > 0) ? (
                  <Text
                    style={emptyStyles.clearLink}
                    onPress={() => { setSearchQuery(''); clearFilters(); }}>
                    Clear search & filters
                  </Text>
                ) : null}
              </View>
            ) : (
              <View>
                <PlaceListSection
                  title="Popular Places"
                  places={places}
                  savedPlaceIds={savedPlaceIds}
                  searchQuery={searchQuery}
                  onToggleSavedPlace={toggleSavedPlace}
                  onPressPlaceDetails={handlePressPlaceDetails}
                  onPressAddPlace={handlePressAddPlace}
                />
                {hasMore ? (
                  <View style={styles.loadMoreWrapper}>
                    <Pressable style={styles.loadMoreButton} onPress={handleLoadMore} disabled={isLoadingMore}>
                      <Text style={styles.loadMoreText}>{isLoadingMore ? 'Loading...' : 'Load more'}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>

          <FilterSheet
            isOpen={isFilterOpen}
            groups={filterGroups}
            selectedFilters={draftSelectedFilterIds}
            onToggleFilter={onToggleDraftFilter}
            onApplyFilters={applyFilters}
            onClearFilters={clearFilters}
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
