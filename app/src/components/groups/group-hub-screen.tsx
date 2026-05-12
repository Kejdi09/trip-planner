import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMyGroups } from '../../../lib/groups-api';

export function GroupHubScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const [groupName, setGroupName] = React.useState('Your Group');

  React.useEffect(() => {
    if (!groupId) return;
    (async () => {
      try {
        const { groups } = await fetchMyGroups();
        const match = groups.find((g) => g.id === groupId);
        if (match?.name) setGroupName(match.name);
      } catch {}
    })();
  }, [groupId]);

  const routeParams = groupId ? { groupId } : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#0F172A" />
        </Pressable>
        <Text style={styles.title}>{groupName}</Text>
        <Text style={styles.subtitle}>Choose what your group wants to do</Text>

        <View style={styles.grid}>
          <Pressable style={styles.card} onPress={() => router.push({ pathname: '/group-chat', params: routeParams })}>
            <Ionicons name="chatbubbles-outline" size={30} color="#008D9B" />
            <Text style={styles.cardTitle}>Chat</Text>
            <Text style={styles.cardSub}>Talk with your group</Text>
          </Pressable>

          <Pressable style={styles.card} onPress={() => router.push({ pathname: '/voting', params: routeParams })}>
            <MaterialCommunityIcons name="vote-outline" size={30} color="#008D9B" />
            <Text style={styles.cardTitle}>Vote</Text>
            <Text style={styles.cardSub}>Choose destination, dates, budget</Text>
          </Pressable>

          <Pressable style={styles.card} onPress={() => router.push({ pathname: '/itinerary', params: routeParams })}>
            <Feather name="map" size={30} color="#008D9B" />
            <Text style={styles.cardTitle}>Itinerary</Text>
            <Text style={styles.cardSub}>Plan daily activities</Text>
          </Pressable>

          <Pressable style={styles.card} onPress={() => router.push({ pathname: '/invite-to-group', params: routeParams })}>
            <Ionicons name="person-add-outline" size={30} color="#008D9B" />
            <Text style={styles.cardTitle}>Add Friends</Text>
            <Text style={styles.cardSub}>Invite friends to this trip</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4FBFC' },
  container: { flex: 1, padding: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 18, fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 6, color: '#5B6B77', fontSize: 14 },
  grid: { marginTop: 22, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#D7EEF0', shadowColor: '#008D9B', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTitle: { marginTop: 10, fontSize: 18, fontWeight: '700', color: '#0F172A' },
  cardSub: { marginTop: 4, color: '#64748B' },
});
