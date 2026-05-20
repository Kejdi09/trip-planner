import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Path } from 'react-native-svg';

import { API_BASE_URL, APP_ENV } from '../../../lib/app-config';
import { supabase } from '../../../lib/supabase';
import { AppLoading } from '@/components/common/AppLoading';
import { C, rs } from './theme';
import { styles } from './my-trips-screen.styles';

type TravelSummary = {
  visitedCountries: string[];
};

type Feature = { properties?: { name?: string; ADMIN?: string; NAME?: string }; geometry?: { type?: string; coordinates?: unknown } };

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

export function MyTripsScreen() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [visitedCountries, setVisitedCountries] = React.useState<string[]>([]);
  const [worldFeatures, setWorldFeatures] = React.useState<Feature[]>([]);

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
        setWorldFeatures(features);
      } catch {
        if (!mounted) return;
        setError('Unable to load your travel map right now.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const visitedSet = React.useMemo(() => new Set(visitedCountries.map(normalizeCountryName)), [visitedCountries]);

  if (loading) {
    return <SafeAreaView style={styles.safeArea} edges={['top']}><AppLoading message="Loading your travel map..." /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <Feather name="arrow-left" size={18} color={C.text} />
          </Pressable>
          <Text style={styles.title}>My Trips</Text>
        </View>

        {error ? <Text style={{ color: '#BE123C', paddingHorizontal: rs(20), marginTop: rs(16) }}>{error}</Text> : null}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Visited Countries</Text>

          {visitedCountries.length === 0 ? (
            <Text style={{ color: '#64748B', marginBottom: rs(12) }}>No visited countries yet.</Text>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: rs(12) }}>
            <View style={{ flexDirection: 'row', gap: rs(8) }}>
              {visitedCountries.map((country) => (
                <View key={country} style={{ backgroundColor: '#D7EDF0', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                  <Text style={{ color: '#0F766E', fontWeight: '700', fontSize: 12 }}>{country}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <ScrollView horizontal maximumZoomScale={4} minimumZoomScale={1} bouncesZoom>
            <ScrollView maximumZoomScale={4} minimumZoomScale={1} bouncesZoom>
              <View style={{ borderWidth: 1, borderColor: '#D7EEF0', borderRadius: 18, backgroundColor: '#F8FCFF', overflow: 'hidden' }}>
                <Svg width={1000} height={520}>
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
            </ScrollView>
          </ScrollView>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
