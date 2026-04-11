import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  AntDesign,
} from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AppBottomNav, AppTab } from "@/components/ui/app-bottom-nav";
import { styles } from "./profile-screen.styles";

type ProfileActionCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
};

function ProfileActionCard({ icon, title, subtitle }: ProfileActionCardProps) {
  return (
    <Pressable style={styles.actionCard}>
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
};

function SettingsRow({ icon, label }: SettingsRowProps) {
  return (
    <Pressable style={styles.settingsRow}>
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
  const [activeTab, setActiveTab] = React.useState<AppTab>("Profile");

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
            />

            <ProfileActionCard
              icon={<Feather name="star" size={20} color="#51C98C" />}
              title="My Reviews"
              subtitle="24 reviews written"
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
                <AntDesign name="question-circle" size={18} color="#222222" />
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
            />
          </View>
        </ScrollView>

        <AppBottomNav activeTab={activeTab} onPressTab={setActiveTab} />
      </View>
    </SafeAreaView>
  );
}
