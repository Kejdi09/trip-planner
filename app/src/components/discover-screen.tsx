import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DISCOVER_THEME, styles } from '@/components/discover-screen.styles';

const { colors } = DISCOVER_THEME;

type Place = {
  id: string;
  title: string;
  region: string;
  visited: string;
  rating: number;
  image: string;
};

const DUMMY_PLACES: Place[] = [
  {
    id: '1',
    title: 'Kyoto, Japan',
    region: 'East Asia',
    visited: '12 friends visited',
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '2',
    title: 'Bali, Indonesia',
    region: 'Southeast Asia',
    visited: '9 friends visited',
    rating: 4.6,
    image:
      'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '3',
    title: 'Florence, Italy',
    region: 'Southern Europe',
    visited: '7 friends visited',
    rating: 4.7,
    image:
      'https://images.unsplash.com/photo-1543429776-2782fcdfb569?auto=format&fit=crop&w=1200&q=80',
  },
];

function PlaceCard({ place }: { place: Place }) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: place.image }} style={styles.cardImage} />
        <View style={styles.ratingPill}>
          <View style={styles.ratingIconWrap}>
            <Ionicons name="star" size={12} color={colors.background} />
          </View>
          <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTextGroup}>
          <Text style={styles.cardTitle}>{place.title}</Text>
          <Text style={styles.cardRegion}>{place.region}</Text>
          <Text style={styles.cardVisited}>{place.visited}</Text>
        </View>

        <View style={styles.cardActionGroup}>
          <Pressable style={styles.plusButton}>
            <Feather name="plus" size={24} color={colors.primary} />
          </Pressable>
          <Ionicons name="bookmark" size={20} color={colors.primary} />
        </View>
      </View>
    </View>
  );
}

type BottomNavItemProps = {
  label: string;
  active?: boolean;
  icon: React.ReactNode;
};

function BottomNavItem({ label, icon, active = false }: BottomNavItemProps) {
  return (
    <View style={styles.bottomItem}>
      {icon}
      <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>{label}</Text>
    </View>
  );
}

export function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>Discover</Text>

          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <TextInput
                placeholder="Search destinations..."
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
              />
              <Feather name="search" size={20} color={colors.searchIcon} />
            </View>

            <Pressable style={styles.filterButton}>
              <Feather name="sliders" size={18} color={colors.background} />
            </Pressable>
          </View>

          <View style={styles.handleBar} />

          <Text style={styles.sectionTitle}>Popular Places</Text>

          <View style={styles.cardList}>
            {DUMMY_PLACES.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
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
