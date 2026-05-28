import React from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLoading } from '@/components/common/AppLoading';
import { PlaceListSection } from '@/components/ui/place-list-section';
import { SearchHeader } from '@/components/ui/search-header';
import { StatusMessage } from '@/components/ui/status-message';
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

  const loadPlaces = React.useCallback(async (query: string, offset: number, append: boolean) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    setErrorMessage(null);
    try {
      const placeRows = await fetchDiscoverPlaces({ query, limit: PAGE_SIZE, offset });
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
      void loadPlaces(searchQuery.trim(), 0, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadPlaces]);

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
    void loadPlaces(searchQuery.trim(), places.length, true);
  };

  const statusMessage = isLoading ? 'Loading destinations...' : errorMessage;
  const showStatusMessage = Boolean(statusMessage);

  // BATCH 1: active filter count for badge
  const activeFilterCount = 0;

  // BATCH 1: no results but data exists
  const showEmptySearch =
    !isLoading && !errorMessage && places.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <SearchHeader
          title="Discover"
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          searchPlaceholder="Search destinations..."
          activeFilterCount={activeFilterCount}
          onPressFilter={() => {}}
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
              // BATCH 1: Empty search state
              <View style={emptyStyles.container}>
                <Text style={emptyStyles.emoji}>🔍</Text>
                <Text style={emptyStyles.title}>
                  {searchQuery.trim() ? `No results for "${searchQuery.trim()}"` : 'No destinations match'}
                </Text>
                <Text style={emptyStyles.body}>
                  Try a different search term.
                </Text>
                {searchQuery.trim() ? (
                  <Text
                    style={emptyStyles.clearLink}
                    onPress={() => { setSearchQuery(''); }}>
                    Clear search
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
