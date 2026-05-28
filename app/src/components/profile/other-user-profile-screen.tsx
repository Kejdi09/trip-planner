import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLoading } from '@/components/common/AppLoading';
import { API_BASE_URL, APP_ENV } from '../../../lib/app-config';
import { supabase } from '../../../lib/supabase';
import { acceptFriendRequest, sendFriendRequest } from '../friends/add-friends';
import { C, rs } from '../history/theme';
import { styles as travelStyles } from '../history/my-travels-screen.styles';

type ProfileRow = { id: string; username: string | null; full_name: string | null; avatar_url: string | null; created_at: string | null };
type Summary = { countries: number; cities: number; placesRated: number; groupTrips: number; visitedCountries: string[] };
type FriendshipRow = { id: string; requester_id: string; receiver_id: string; status: string; created_at: string | null };

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatFriendDate(value: string | null) {
  if (!value) return '';
  const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(value);
  const date = new Date(hasTimezone ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function StatTile({ value, label, backgroundColor, icon }: { value: number; label: string; backgroundColor: string; icon: React.ReactNode }) {
  return <View style={[travelStyles.statTile, { backgroundColor }]}><View style={travelStyles.statIcon}>{icon}</View><Text style={travelStyles.statNumber}>{value}</Text><Text style={travelStyles.statLabel}>{label}</Text></View>;
}

export function OtherUserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [friendship, setFriendship] = React.useState<FriendshipRow | null>(null);
  const [friendActionError, setFriendActionError] = React.useState<string | null>(null);
  const [isFriendActionLoading, setIsFriendActionLoading] = React.useState(false);
  const [friendsCount, setFriendsCount] = React.useState(0);
  const [tripsCount, setTripsCount] = React.useState(0);
  const [summary, setSummary] = React.useState<Summary>({ countries: 0, cities: 0, placesRated: 0, groupTrips: 0, visitedCountries: [] });

  React.useEffect(() => {
    if (!userId) { setError('User not found.'); setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: authData } = await supabase.auth.getUser();
        const viewerId = authData.user?.id ?? null;
        if (!mounted) return;
        setCurrentUserId(viewerId);
        if (viewerId && viewerId === userId) {
          router.replace('/profile');
          return;
        }

        const [p, req, rec, trips, friendshipRes] = await Promise.all([
          supabase.from('profiles').select('id, username, full_name, avatar_url, created_at').eq('id', userId).maybeSingle(),
          supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('requester_id', userId).eq('status', 'accepted'),
          supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('receiver_id', userId).eq('status', 'accepted'),
          supabase.from('group_members').select('group_id', { count: 'exact', head: true }).eq('user_id', userId),
          viewerId
            ? supabase
              .from('friendships')
              .select('id, requester_id, receiver_id, status, created_at')
              .or(`and(requester_id.eq.${viewerId},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${viewerId})`)
              .limit(1)
              .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        const params = new URLSearchParams({ userId });
        const res = await fetch(`${API_BASE_URL}/api/groups/travel-summary?${params.toString()}`, { headers: { 'x-app-env': APP_ENV } });
        const json = (await res.json().catch(() => null)) as Summary | null;

        if (!mounted) return;
        setProfile((p.data as ProfileRow | null) ?? null);
        setFriendship((friendshipRes.data as FriendshipRow | null) ?? null);
        setFriendsCount((req.count ?? 0) + (rec.count ?? 0));
        setTripsCount(trips.count ?? 0);
        setSummary({ countries: json?.countries ?? 0, cities: json?.cities ?? 0, placesRated: json?.placesRated ?? 0, groupTrips: json?.groupTrips ?? 0, visitedCountries: json?.visitedCountries ?? [] });
      } catch {
        if (!mounted) return;
        setError('Unable to load user profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  const handleAddFriend = async () => {
    if (!userId || isFriendActionLoading) return;
    setIsFriendActionLoading(true);
    setFriendActionError(null);
    try {
      await sendFriendRequest(userId);
      if (currentUserId) {
        const { data } = await supabase
          .from('friendships')
          .select('id, requester_id, receiver_id, status, created_at')
          .eq('requester_id', currentUserId)
          .eq('receiver_id', userId)
          .maybeSingle();
        setFriendship((data as FriendshipRow | null) ?? { id: 'pending', requester_id: currentUserId, receiver_id: userId, status: 'pending', created_at: new Date().toISOString() });
      }
    } catch {
      setFriendActionError('Unable to send friend request.');
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!friendship || isFriendActionLoading) return;
    setIsFriendActionLoading(true);
    setFriendActionError(null);
    try {
      await acceptFriendRequest(friendship.id);
      setFriendship({ ...friendship, status: 'accepted' });
    } catch {
      setFriendActionError('Unable to accept friend request.');
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FCFD' }}><AppLoading message="Loading profile..." /></SafeAreaView>;
  if (error || !profile) return <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FCFD', alignItems: 'center', justifyContent: 'center' }}><Text>{error ?? 'User not found'}</Text></SafeAreaView>;

  const name = profile.full_name || profile.username || 'Unknown user';
  const isPendingSent = friendship?.status === 'pending' && friendship.requester_id === currentUserId;
  const isPendingReceived = friendship?.status === 'pending' && friendship.receiver_id === currentUserId;
  const isAccepted = friendship?.status === 'accepted';
  const friendsSince = isAccepted ? formatFriendDate(friendship.created_at) : '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FCFD' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Feather name="arrow-left" size={18} color="#0F172A" /></Pressable>
        <View style={{ marginTop: 14, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#D7EEF0', padding: 16 }}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#D7EEF0' }} />
          ) : (
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#D7EEF0', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#0F766E', fontSize: 22, fontWeight: '800' }}>{initials(name)}</Text></View>
          )}
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 10 }}>{name}</Text>
          <Text style={{ color: '#64748B' }}>{profile.username ? `@${profile.username}` : ''}</Text>
          <Text style={{ color: '#94A3B8', marginTop: 4 }}>{profile.created_at ? `Joined ${new Date(profile.created_at).toLocaleDateString()}` : ''}</Text>
          <Text style={{ marginTop: 10, color: '#334155' }}>{friendsCount} friends · {tripsCount} trips</Text>
          {isAccepted ? (
            <Text style={{ marginTop: 12, color: '#0F766E', fontWeight: '800' }}>{friendsSince ? `Friends since ${friendsSince}` : 'Friends'}</Text>
          ) : isPendingSent ? (
            <View style={{ marginTop: 12, alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 9 }}><Text style={{ color: '#64748B', fontWeight: '800' }}>Request sent</Text></View>
          ) : isPendingReceived ? (
            <Pressable onPress={handleAcceptRequest} disabled={isFriendActionLoading} style={{ marginTop: 12, alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#008D9B', paddingHorizontal: 16, paddingVertical: 10 }}>
              {isFriendActionLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Accept request</Text>}
            </Pressable>
          ) : currentUserId ? (
            <Pressable onPress={handleAddFriend} disabled={isFriendActionLoading} style={{ marginTop: 12, alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#008D9B', paddingHorizontal: 16, paddingVertical: 10 }}>
              {isFriendActionLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Add friend</Text>}
            </Pressable>
          ) : null}
          {friendActionError ? <Text style={{ color: '#BE123C', marginTop: 8, fontWeight: '700' }}>{friendActionError}</Text> : null}
        </View>

        <View style={{ marginTop: 14 }}>
          <View style={travelStyles.statsGrid}>
            <StatTile value={summary.countries} label="Countries" backgroundColor={C.statCountriesBg} icon={<MaterialIcons name="language" size={rs(28)} color={C.statCountriesIcon} />} />
            <StatTile value={summary.cities} label="Cities" backgroundColor={C.statCitiesBg} icon={<MaterialCommunityIcons name="office-building-outline" size={rs(28)} color={C.statCitiesIcon} />} />
            <StatTile value={summary.placesRated} label="Places Rated" backgroundColor={C.statRatedBg} icon={<Ionicons name="heart-outline" size={rs(28)} color={C.statRatedIcon} />} />
            <StatTile value={summary.groupTrips} label="Group Trips" backgroundColor={C.statGroupsBg} icon={<Ionicons name="people-outline" size={rs(28)} color={C.statGroupsIcon} />} />
          </View>

          <View style={travelStyles.mapSectionHeader}><Text style={travelStyles.mapSectionTitle}>{`${name.split(' ')[0]}'s Travel Map`}</Text></View>
          <View style={travelStyles.mapContainer}>
            <View style={travelStyles.mapPlaceholder}>
              <Feather name="globe" size={rs(30)} color={C.primary} />
              <Text style={travelStyles.mapPlaceholderText}>{summary.visitedCountries.length === 0 ? 'No trips yet.' : `${summary.visitedCountries.length} visited countr${summary.visitedCountries.length === 1 ? 'y' : 'ies'}`}</Text>
              <View style={{ marginTop: 12, width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {summary.visitedCountries.length === 0 ? <Text style={{ color: '#94A3B8', fontSize: 12 }}>No trips yet.</Text> : summary.visitedCountries.map((country) => <View key={country} style={{ backgroundColor: '#D7EDF0', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}><Text style={{ color: '#0F766E', fontWeight: '700', fontSize: 12 }}>{country}</Text></View>)}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
