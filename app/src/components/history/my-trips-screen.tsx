import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { G, Path } from 'react-native-svg';

import { API_BASE_URL, APP_ENV } from '../../../lib/app-config';
import { supabase } from '../../../lib/supabase';
import { AppLoading } from '@/components/common/AppLoading';
import { StatusMessage } from '@/components/ui/status-message';
import { C, rs } from './theme';
import { styles } from './my-trips-screen.styles';

type TravelSummary = {
  countries?: number;
  cities?: number;
  placesRated?: number;
  groupTrips?: number;
  visitedCountries?: string[];
};

type Feature = { properties?: { name?: string; ADMIN?: string; NAME?: string }; geometry?: { type?: string; coordinates?: unknown } };

type SummaryTileProps = {
  value: number;
  label: string;
  icon: React.ReactNode;
};

function countryNameFromFeature(feature: Feature): string {
  return feature.properties?.name ?? feature.properties?.ADMIN ?? feature.properties?.NAME ?? '';
}

function normalizeCountryName(name: string): string {
  const value = name.trim().toLowerCase();
  if (value === 'türkiye') return 'turkey';
  return value;
}

function toPathD(geometry: Feature['geometry']): string {
  if (!geometry || !geometry.coordinates) return '';
  const coords = geometry.coordinates as number[][][] | number[][][][];
  const polygons = geometry.type === 'MultiPolygon' ? (coords as number[][][][]) : [coords as number[][][]];

  let d = '';
  polygons.forEach((polygon) => {
    polygon.forEach((ring) => {
      ring.forEach(([lon, lat], index) => {
        const x = ((lon + 180) / 360) * 1000;
        const y = ((90 - lat) / 180) * 520;
        d += `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)} `;
      });
      d += 'Z ';
    });
  });

  return d;
}

function SummaryTile({ value, label, icon }: SummaryTileProps) {
  return (
    <View style={styles.summaryTile}>
      <View style={styles.summaryTileIcon}>{icon}</View>
      <Text style={styles.summaryTileValue}>{value}</Text>
      <Text style={styles.summaryTileLabel}>{label}</Text>
    </View>
  );
}

export function MyTripsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [visitedCountries, setVisitedCountries] = React.useState<string[]>([]);
  const [worldFeatures, setWorldFeatures] = React.useState<Feature[]>([]);
  const [summaryStats, setSummaryStats] = React.useState({ countries: 0, cities: 0, placesRated: 0, groupTrips: 0 });

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!userId) {
          if (mounted) {
            setVisitedCountries([]);
            setLoading(false);
          }
          return;
        }

        const params = new URLSearchParams({ userId });
        const summaryRes = await fetch(`${API_BASE_URL}/api/groups/travel-summary?${params.toString()}`, { headers: { 'x-app-env': APP_ENV } });
        const summary = (await summaryRes.json().catch(() => null)) as TravelSummary | null;

        const countries = summary?.visitedCountries ?? [];

        const worldRes = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
        const worldJson = await worldRes.json();
        const features = Array.isArray(worldJson?.features) ? worldJson.features : [];

        if (!mounted) return;
        setVisitedCountries(countries);
        setSummaryStats({
          countries: summary?.countries ?? countries.length,
          cities: summary?.cities ?? 0,
          placesRated: summary?.placesRated ?? 0,
          groupTrips: summary?.groupTrips ?? 0,
        });
        setWorldFeatures(features);
      } catch {
        if (!mounted) return;
        setError('Unable to load your travel map right now.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const visitedSet = React.useMemo(() => new Set(visitedCountries.map(normalizeCountryName)), [visitedCountries]);

  if (loading) {
    return <SafeAreaView style={styles.safeArea} edges={['top']}><AppLoading message="Loading your travel map..." /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <View style={styles.pageContainer}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
              <Feather name="arrow-left" size={18} color={C.text} />
            </Pressable>
            <View>
              <Text style={styles.title}>My Trips</Text>
              <Text style={styles.subtitle}>Your travel history at a glance</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + rs(128) }]}
            showsVerticalScrollIndicator={false}
          >
            {error ? <StatusMessage message={error} style={styles.errorMessage} /> : null}

            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>Travel Summary</Text>
              <View style={styles.summaryGrid}>
                <SummaryTile value={summaryStats.countries} label="Countries" icon={<MaterialIcons name="language" size={rs(22)} color="#0F766E" />} />
                <SummaryTile value={summaryStats.groupTrips} label="Trips" icon={<Ionicons name="map-outline" size={rs(22)} color="#0F766E" />} />
                <SummaryTile value={summaryStats.cities} label="Cities" icon={<MaterialCommunityIcons name="city-variant-outline" size={rs(22)} color="#0F766E" />} />
              </View>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Visited Countries</Text>
                <Text style={styles.sectionCount}>{visitedCountries.length}</Text>
              </View>

              {visitedCountries.length === 0 ? (
                <StatusMessage message="No visited countries yet. Start planning your next trip!" style={styles.emptyMessage} />
              ) : (
                <View style={styles.chipsWrap}>
                  {visitedCountries.map((country) => (
                    <View key={country} style={styles.countryChip}>
                      <Text style={styles.countryChipText}>{country}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Travel Map</Text>
              <View style={styles.mapCard}>
                <View style={styles.mapFrame}>
                  <Svg width="100%" height="100%" viewBox="0 0 1000 520" preserveAspectRatio="xMidYMid meet">
                    <G>
                      {worldFeatures.map((feature, idx) => {
                        const country = countryNameFromFeature(feature);
                        const path = toPathD(feature.geometry);
                        if (!path) return null;
                        const visited = visitedSet.has(normalizeCountryName(country));
                        return <Path key={`${country}-${idx}`} d={path} fill={visited ? '#14B8A6' : '#E5EEF2'} stroke="#C7D9E2" strokeWidth={0.6} />;
                      })}
                    </G>
                  </Svg>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
