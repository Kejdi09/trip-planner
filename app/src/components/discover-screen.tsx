import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavItem } from '@/components/discover/bottom-nav-item';
import { DUMMY_PLACES, FILTER_OPTIONS } from '@/components/discover/discover-data';
import { FilterPanel } from '@/components/discover/filter-panel';
import { PlaceCard } from '@/components/discover/place-card';
import { DISCOVER_THEME, styles } from '@/components/discover-screen.styles';

const { colors } = DISCOVER_THEME;

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
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 124 }]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>Discover</Text>

          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <TextInput
                placeholder="Search destinations..."
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Feather name="search" size={20} color={colors.searchIcon} />
            </View>

            <Pressable style={styles.filterButton} onPress={() => setIsFilterOpen((current) => !current)}>
              <Feather name="sliders" size={18} color={colors.background} />
            </Pressable>
          </View>

          <View style={styles.handleBar} />

          <Text style={styles.sectionTitle}>Popular Places</Text>

          <View style={styles.cardList}>
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  isSaved={savedPlaceIds.includes(place.id)}
                  onToggleSaved={() => toggleSavedPlace(place.id)}
                />
              ))
            ) : (
              <Text style={styles.noResultsText}>No places found for "{searchQuery.trim()}".</Text>
            )}
          </View>
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

        <View style={[styles.bottomNav, { paddingBottom: Math.max(12, insets.bottom + 8) }]}>
          <BottomNavItem
            label="Feed"
            icon={<Feather name="home" size={24} color={colors.navIconInactive} />}
          />
          <BottomNavItem
            label="Discover"
            active
            icon={<Feather name="search" size={24} color={colors.primary} />}
          />
          <BottomNavItem
            label="Groups"
            icon={<Ionicons name="people-outline" size={24} color={colors.navIconInactive} />}
          />
          <BottomNavItem
            label="History"
            icon={<FontAwesome5 name="map-marked-alt" size={22} color={colors.navIconInactive} />}
          />
          <BottomNavItem
            label="Profile"
            icon={
              <MaterialCommunityIcons name="account-outline" size={24} color={colors.navIconInactive} />
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
