import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { supabase } from '../../../lib/supabase';
import { AppLoading } from '@/components/common/AppLoading';
import { styles } from './profile-screen.styles';

type ProfileActionCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
};

type Stats = {
  friends: number;
  reviews: number;
  wishlist: number;
  trips: number;
};

function ProfileActionCard({ icon, title, subtitle, onPress }: ProfileActionCardProps) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <View style={styles.actionLeft}>
        <View style={styles.actionIconWrap}>{icon}</View>
        <View>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <Feather name="chevron-right" size={22} color="#7A7A7A" />
    </Pressable>
  );
}

function SettingsRow({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.settingsRow} onPress={onPress}>
      <View style={styles.settingsLeft}>
        {icon}
        <Text style={styles.settingsText}>{label}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#7A7A7A" />
    </Pressable>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((piece) => piece[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [emailFallback, setEmailFallback] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<Stats>({ friends: 0, reviews: 0, wishlist: 0, trips: 0 });

  React.useEffect(() => {
    let mounted = true;

    const loadProfileData = async () => {
      setLoading(true);
      setErrorMessage(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        if (mounted) setErrorMessage('Unable to load authenticated user.');
        setLoading(false);
        return;
      }

      const user = userData.user;
      if (!user) {
        if (mounted) {
          setErrorMessage('No authenticated user found.');
          setProfile(null);
          setStats({ friends: 0, reviews: 0, wishlist: 0, trips: 0 });
          setLoading(false);
        }
        return;
      }

      setEmailFallback(user.email ?? null);

      const [profileRes, reviewsRes, wishlistRes, tripsRes, friendshipsRequesterRes, friendshipsReceiverRes] = await Promise.all([
        supabase.from('profiles').select('id, username, full_name, avatar_url, created_at').eq('id', user.id).maybeSingle(),
        supabase.from('reviews').select('user_id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('wishlists').select('user_id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('group_members').select('group_id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('friendships').select('requester_id', { count: 'exact', head: true }).eq('requester_id', user.id).eq('status', 'accepted'),
        supabase.from('friendships').select('receiver_id', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('status', 'accepted'),
      ]);

      if (!mounted) return;

      if (profileRes.error || reviewsRes.error || wishlistRes.error || tripsRes.error || friendshipsRequesterRes.error || friendshipsReceiverRes.error) {
        setErrorMessage('Unable to load profile data.');
      }

      setProfile((profileRes.data as ProfileRow | null) ?? null);
      setStats({
        friends: (friendshipsRequesterRes.count ?? 0) + (friendshipsReceiverRes.count ?? 0),
        reviews: reviewsRes.count ?? 0,
        wishlist: wishlistRes.count ?? 0,
        trips: tripsRes.count ?? 0,
      });
      setLoading(false);
    };

    void loadProfileData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setStatusMessage(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setStatusMessage('Unable to log out. Try again.');
      return;
    }
    router.replace('/');
  };

  const displayName = profile?.full_name || profile?.username || emailFallback || 'Unnamed user';
  const username = profile?.username ? `@${profile.username}` : '';
  const memberSince = profile?.created_at ? `Joined ${new Date(profile.created_at).toLocaleDateString()}` : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.screen}>
          <AppLoading message="Loading your profile..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}> 
          <View style={styles.profileSection}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E2E8F0' }]}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#334155' }}>{getInitials(displayName)}</Text>
              </View>
            )}

            <Text style={styles.name}>{displayName}</Text>
            {username ? <Text style={styles.username}>{username}</Text> : null}
            {memberSince ? <Text style={styles.username}>{memberSince}</Text> : null}
            {errorMessage ? <Text style={styles.logoutMessage}>{errorMessage}</Text> : null}

            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{stats.friends}</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{stats.trips}</Text>
                <Text style={styles.statLabel}>Trips</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardsSection}>
            <ProfileActionCard icon={<Feather name="bookmark" size={20} color="#D66BC7" />} title="My Wishlist" subtitle={`${stats.wishlist} saved place${stats.wishlist === 1 ? '' : 's'}`} onPress={() => router.push('/my-wishlist')} />
            <ProfileActionCard icon={<Feather name="star" size={20} color="#51C98C" />} title="My Reviews" subtitle={`${stats.reviews} review${stats.reviews === 1 ? '' : 's'} written`} onPress={() => router.push('/my-reviews')} />
            <ProfileActionCard icon={<Ionicons name="people-outline" size={20} color="#16A6C9" />} title="My Friends" subtitle={`${stats.friends} friend${stats.friends === 1 ? '' : 's'}`} onPress={() => router.push('/my-friends')} />
          </View>

          <View style={styles.settingsSection}>
            <SettingsRow icon={<MaterialCommunityIcons name="logout" size={20} color="#222222" />} label="Log out" onPress={handleLogout} />
            {statusMessage ? <Text style={styles.logoutMessage}>{statusMessage}</Text> : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
