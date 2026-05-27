import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL, APP_ENV } from '../../../lib/app-config';
import { supabase } from '../../../lib/supabase';
import { AppLoading } from '@/components/common/AppLoading';
import { C, rs } from './theme';
import { styles } from './my-travels-screen.styles';

type TravelStats = { countries: number; cities: number; placesRated: number; groupTrips: number; visitedCountries: string[] };
function StatTile({ value, label, backgroundColor, icon }: { value: number; label: string; backgroundColor: string; icon: React.ReactNode }) { return <View style={[styles.statTile, { backgroundColor }]}><View style={styles.statIcon}>{icon}</View><Text style={styles.statNumber}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

export function MyTravelsScreen() {
  const [stats, setStats] = React.useState<TravelStats>({ countries: 0, cities: 0, placesRated: 0, groupTrips: 0, visitedCountries: [] });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) { setLoading(false); return; }
      const params = new URLSearchParams({ userId });
      const res = await fetch(`${API_BASE_URL}/api/groups/travel-summary?${params.toString()}`, { headers: { 'x-app-env': APP_ENV } });
      const json = await res.json().catch(() => null);
      if (res.ok && json) {
        setStats({ countries: json.countries ?? 0, cities: json.cities ?? 0, placesRated: json.placesRated ?? 0, groupTrips: json.groupTrips ?? 0, visitedCountries: json.visitedCountries ?? [] });
      }
      setLoading(false);
    };
    void load();
  }, []);

  return <SafeAreaView style={styles.safeArea} edges={['top']}><View style={styles.screen}><View style={styles.header}><Text style={styles.title}>My Travels</Text></View>{loading ? <AppLoading message="Loading your travel stats..." /> : <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><View style={styles.statsGrid}><StatTile value={stats.countries} label="Countries" backgroundColor={C.statCountriesBg} icon={<MaterialIcons name="language" size={rs(28)} color={C.statCountriesIcon} />} /><StatTile value={stats.cities} label="Cities" backgroundColor={C.statCitiesBg} icon={<MaterialCommunityIcons name="office-building-outline" size={rs(28)} color={C.statCitiesIcon} />} /><StatTile value={stats.placesRated} label="Places Rated" backgroundColor={C.statRatedBg} icon={<Ionicons name="heart-outline" size={rs(28)} color={C.statRatedIcon} />} /><StatTile value={stats.groupTrips} label="Group Trips" backgroundColor={C.statGroupsBg} icon={<Ionicons name="people-outline" size={rs(28)} color={C.statGroupsIcon} />} /></View><View style={styles.mapSectionHeader}><Text style={styles.mapSectionTitle}>My Travel Map</Text><Pressable onPress={() => router.push('/my-trips')} accessibilityRole="button"><Text style={styles.viewTripsLink}>View Trips</Text></Pressable></View><Pressable style={styles.mapContainer} onPress={() => router.push('/my-trips')} accessibilityRole="button" accessibilityLabel="View your travel map"><View style={styles.mapPlaceholder}><Feather name="globe" size={rs(30)} color={C.primary} /><Text style={styles.mapPlaceholderText}>{stats.visitedCountries.length === 0 ? 'No visited countries yet' : `${stats.visitedCountries.length} visited countr${stats.visitedCountries.length === 1 ? 'y' : 'ies'}`}</Text><View style={{ marginTop: 12, width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>{stats.visitedCountries.length === 0 ? <Text style={{ color: '#94A3B8', fontSize: 12 }}>Travel destinations will appear here.</Text> : stats.visitedCountries.map((country) => <View key={country} style={{ backgroundColor: '#D7EDF0', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}><Text style={{ color: '#0F766E', fontWeight: '700', fontSize: 12 }}>{country}</Text></View>)}</View></View></Pressable></ScrollView>}</View></SafeAreaView>;
}
