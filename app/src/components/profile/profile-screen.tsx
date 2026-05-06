import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  AntDesign,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { supabase } from "../../../lib/supabase";
import { styles } from "./profile-screen.styles";

type ProfileActionCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
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

type SettingsRowProps = {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
};

function SettingsRow({ icon, label, onPress }: SettingsRowProps) {
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

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [reviewCount, setReviewCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadReviewCount = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user || !isMounted) {
        return;
      }

      const { count } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!isMounted) return;
      setReviewCount(typeof count === 'number' ? count : 0);
    };

    void loadReviewCount();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setStatusMessage(null);

    const { error } = await supabase.auth.signOut();
    if (error) {
      setStatusMessage("Unable to log out. Try again.");
      return;
    }

    router.replace("/");
  };
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable style={styles.headerIconButton}>
            <Feather name="settings" size={22} color="#222222" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 120 },
          ]}
        >
          <View style={styles.profileSection}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=300&q=80",
              }}
              style={styles.avatar}
            />

            <Text style={styles.name}>Thomas Kroj</Text>
            <Text style={styles.username}>@tkroj</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>156</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBlock}>
                <Text style={styles.statValue}>28</Text>
                <Text style={styles.statLabel}>Trips</Text>
              </View>
            </View>

            <Pressable style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit profile</Text>
            </Pressable>
          </View>

          <View style={styles.cardsSection}>
            <ProfileActionCard
              icon={<Feather name="bookmark" size={20} color="#D66BC7" />}
              title="My Wishlist"
              subtitle="12 saved places"
              onPress={() => router.push("/my-wishlist")}
            />

            <ProfileActionCard
              icon={<Feather name="star" size={20} color="#51C98C" />}
              title="My Reviews"
              subtitle={
                reviewCount === null
                  ? 'Loading reviews...'
                  : `${reviewCount} review${reviewCount === 1 ? '' : 's'} written`
              }
              onPress={() => router.push("/my-reviews")}
            />

            <ProfileActionCard
              icon={
                <Ionicons name="people-outline" size={20} color="#16A6C9" />
              }
              title="My Friends"
              subtitle="Top: Eden"
            />
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsHeading}>SETTINGS</Text>

            <SettingsRow
              icon={
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="#222222"
                />
              }
              label="Notifications"
            />

            <SettingsRow
              icon={
                <AntDesign name="questioncircleo" size={18} color="#222222" />
              }
              label="Help & Support"
            />

            <SettingsRow
              icon={
                <MaterialCommunityIcons
                  name="logout"
                  size={20}
                  color="#222222"
                />
              }
              label="Log out"
              onPress={handleLogout}
            />
            {statusMessage ? (
              <Text style={styles.logoutMessage}>{statusMessage}</Text>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
