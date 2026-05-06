import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaceListSection } from '@/components/ui/place-list-section';
import { SearchHeader } from '@/components/ui/search-header';
import { StatusMessage } from '@/components/ui/status-message';
import type { DiscoverPlace } from '../../../lib/discover-api';
import { fetchWishlistPlaces, removeWishlistPlace } from '../../../lib/wishlist-api';
import { supabase } from '../../../lib/supabase';
import { styles } from './my-wishlist-screen.styles';

export function MyWishlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [places, setPlaces] = React.useState<DiscoverPlace[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const savedPlaceIds = React.useMemo(
    () => places.map((place) => place.id),
    [places],
  );

  const filteredPlaces = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return places;
    return places.filter((place) =>
      `${place.title} ${place.region} ${place.visited}`.toLowerCase().includes(query),
    );
  }, [places, searchQuery]);

  const handleBack = () => {
    const canGoBack =
      typeof (router as { canGoBack?: () => boolean }).canGoBack === 'function'
        ? (router as { canGoBack?: () => boolean }).canGoBack?.() === true
        : false;

    if (canGoBack) {
      router.back();
      return;
    }

    router.replace('/explore');
  };

  const loadWishlist = React.useCallback(
    async (activeUserId: string) => fetchWishlistPlaces(activeUserId),
    [],
  );

  React.useEffect(() => {
    let isMounted = true;

    const initWishlist = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;

        if (!user) {
          throw new Error('Log in to see your wishlist.');
        }

        if (!isMounted) return;
        setUserId(user.id);

        const wishlistPlaces = await loadWishlist(user.id);
        if (!isMounted) return;
        setPlaces(wishlistPlaces);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load wishlist.';
        setErrorMessage(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void initWishlist();

    return () => {
      isMounted = false;
    };
  }, [loadWishlist]);

  const handleToggleSavedPlace = async (placeId: string) => {
    if (!userId) {
      setErrorMessage('Log in to manage your wishlist.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await removeWishlistPlace(userId, placeId);
      const wishlistPlaces = await loadWishlist(userId);
      setPlaces(wishlistPlaces);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update wishlist.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePressPlaceDetails = (place: DiscoverPlace) => {
    router.push({ pathname: '/destination-overview', params: { id: place.id } });
  };

  const handlePressAddPlace = (place: DiscoverPlace) => {
    router.push({ pathname: '/write-review', params: { id: place.id } });
  };

  const emptyMessage = searchQuery.trim()
    ? `No saved places for "${searchQuery.trim()}".`
    : 'No saved places yet.';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Feather name="arrow-left" size={18} color="#000000" />
          </Pressable>
        </View>

        <SearchHeader
          title="My Wishlist"
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          searchPlaceholder="Search saved places..."
          showFilterButton={false}
        />

        <View style={styles.contentArea}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 124 }]}
            showsVerticalScrollIndicator={false}>

            {errorMessage ? (
              <StatusMessage message={errorMessage} style={styles.statusMessage} />
            ) : isLoading ? (
              <StatusMessage message="Loading your wishlist..." style={styles.statusMessage} />
            ) : filteredPlaces.length === 0 ? (
              <StatusMessage message={emptyMessage} style={styles.statusMessage} />
            ) : (
              <PlaceListSection
                title="Saved Places"
                places={filteredPlaces}
                savedPlaceIds={savedPlaceIds}
                searchQuery={searchQuery}
                onToggleSavedPlace={handleToggleSavedPlace}
                onPressPlaceDetails={handlePressPlaceDetails}
                onPressAddPlace={handlePressAddPlace}
                emptyStatePrefix="No saved places"
              />
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
