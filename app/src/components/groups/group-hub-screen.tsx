import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deleteGroupApi, fetchMyGroups, getActiveUserId } from '../../../lib/groups-api';
import { supabase } from '../../../lib/supabase';
import { AppLoading } from '@/components/common/AppLoading';

export function GroupHubScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const [groupName, setGroupName] = React.useState('Your Group');
  const [isCreator, setIsCreator] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState(getActiveUserId());
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!groupId) return;
    (async () => {
      try {
        const { groups } = await fetchMyGroups();
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id ?? getActiveUserId();
        setCurrentUserId(uid);
        const match = groups.find((g) => g.id === groupId);
        if (match?.name) setGroupName(match.name);
        setIsCreator(Boolean(match?.created_by && match.created_by === uid));
      } catch {}
      finally { setLoading(false); }
    })();
  }, [groupId]);

  const routeParams = groupId ? { groupId } : undefined;

  if (loading) {
    return <SafeAreaView style={styles.safeArea}><AppLoading message="Loading group details..." /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/groups')}>
          <Feather name="arrow-left" size={20} color="#0F172A" />
        </Pressable>
        {isCreator ? <Pressable style={styles.backBtn} onPress={() => Alert.alert('Delete group?', 'Are you sure you want to delete this group? This will remove its members, chat, votes, and itinerary.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { if (!groupId) return; await deleteGroupApi(groupId, currentUserId); router.replace('/groups'); } }])}><Feather name='x-circle' size={20} color='#BE123C' /></Pressable> : <View style={{ width: 38 }} />}
        </View>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4FBFC' },
  container: { padding: 20, paddingBottom: 120 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 18, fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 6, color: '#5B6B77', fontSize: 14 },
  grid: { marginTop: 22, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#D7EEF0', shadowColor: '#008D9B', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTitle: { marginTop: 10, fontSize: 18, fontWeight: '700', color: '#0F172A' },
  cardSub: { marginTop: 4, color: '#64748B' },
});
