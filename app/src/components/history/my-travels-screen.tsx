import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav } from '@/components/ui/app-bottom-nav';
import { fetchTravelStats, TravelStats } from './history.dummy';
import { C, rs } from './theme';
import { styles } from './my-travels-screen.styles';

// ---------------------------------------------------------------------------
// Stat tile
// ---------------------------------------------------------------------------

type StatTileProps = {
  value: number;
  label: string;
  backgroundColor: string;
  icon: React.ReactNode;
};

function StatTile({ value, label, backgroundColor, icon }: StatTileProps) {
  return (
    <View style={[styles.statTile, { backgroundColor }]}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function MyTravelsScreen() {
  const [stats, setStats] = React.useState<TravelStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchTravelStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>My Travels</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: rs(40) }} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>

            {/* ── Stat tiles ── */}
            <View style={styles.statsGrid}>
              <StatTile
                value={stats!.countries}
                label="Countries"
                backgroundColor={C.statCountriesBg}
                icon={
                  <MaterialIcons
                    name="language"
                    size={rs(28)}
                    color={C.statCountriesIcon}
                  />
                }
              />
              <StatTile
                value={stats!.cities}
                label="Cities"
                backgroundColor={C.statCitiesBg}
                icon={
                  <MaterialCommunityIcons
                    name="office-building-outline"
                    size={rs(28)}
                    color={C.statCitiesIcon}
                  />
                }
              />
              <StatTile
                value={stats!.placesRated}
                label="Places Rated"
                backgroundColor={C.statRatedBg}
                icon={
                  <Ionicons
                    name="heart-outline"
                    size={rs(28)}
                    color={C.statRatedIcon}
                  />
                }
              />
              <StatTile
                value={stats!.groupTrips}
                label="Group Trips"
                backgroundColor={C.statGroupsBg}
                icon={
                  <Ionicons
                    name="people-outline"
                    size={rs(28)}
                    color={C.statGroupsIcon}
                  />
                }
              />
            </View>

            {/* ── Travel map ── */}
            <View style={styles.mapSectionHeader}>
              <Text style={styles.mapSectionTitle}>My Travel Map</Text>
              <Pressable
                onPress={() => router.push('/my-trips')}
                accessibilityRole="button">
                <Text style={styles.viewTripsLink}>View Trips</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.mapContainer}
              onPress={() => router.push('/my-trips')}
              accessibilityRole="button"
              accessibilityLabel="View your travel map">
              {/* 
                Replace this placeholder with a real map component such as
                react-native-maps <MapView> when integrating.
                The static image below gives a realistic preview for now.
              */}
              <View style={styles.mapPlaceholder}>
                <Feather name="map" size={rs(36)} color={C.primary} />
                <Text style={styles.mapPlaceholderText}>
                  Interactive map — integrate react-native-maps here
                </Text>
              </View>
            </Pressable>
          </ScrollView>
        )}

        <AppBottomNav activeTab="History" />
      </View>
    </SafeAreaView>
  );
}
