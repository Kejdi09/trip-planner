import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchRecentTrips, Trip, TripMember } from './history.dummy';
import { C, rs } from './theme';
import { styles } from './my-trips-screen.styles';

// ---------------------------------------------------------------------------
// Dot colours — cycles through primary palette per wireframe
// ---------------------------------------------------------------------------

const DOT_COLORS = [C.dot1, C.dot2, C.dot3];

// ---------------------------------------------------------------------------
// Member avatar stack
// ---------------------------------------------------------------------------

function MemberAvatarStack({
  members,
  max = 1,
}: {
  members: TripMember[];
  max?: number;
}) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <View style={styles.memberAvatarGroup}>
      {visible.map((m, i) => (
        <View
          key={m.id}
          style={[
            styles.memberAvatar,
            i === 0 && styles.memberAvatarFirst,
          ]}>
          {m.avatarUrl ? (
            <Image
              source={{ uri: m.avatarUrl }}
              style={styles.memberAvatarImage}
            />
          ) : (
            <Text style={styles.memberAvatarText}>?</Text>
          )}
        </View>
      ))}
      {overflow > 0 && (
        <View style={styles.memberOverflow}>
          <Text style={styles.memberOverflowText}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Single trip row
// ---------------------------------------------------------------------------

function TripRow({
  trip,
  dotColor,
  isLast,
}: {
  trip: Trip;
  dotColor: string;
  isLast: boolean;
}) {
  return (
    <View style={styles.tripRow}>
      {/* Timeline column */}
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Content column */}
      <View style={styles.tripContent}>
        <Text style={styles.tripDestination}>{trip.destination}</Text>
        <Text style={styles.tripMeta}>
          {trip.month}, {trip.durationDays} days
        </Text>

        {/* Members */}
        <View style={styles.tripMediaRow}>
          <MemberAvatarStack members={trip.members} max={1} />
        </View>

        {/* Photo strip */}
        {trip.images.length > 0 && (
          <View style={styles.photoStrip}>
            {trip.images.map((uri, idx) => (
              <Image
                key={idx}
                source={{ uri }}
                style={styles.photo}
                resizeMode="cover"
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function MyTripsScreen() {
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAll, setShowAll] = React.useState(false);

  React.useEffect(() => {
    fetchRecentTrips(3).then((data) => {
      setTrips(data);
      setLoading(false);
    });
  }, []);

  const handleViewAll = async () => {
    // Lazy-load remaining trips on demand
    const { fetchAllTrips } = await import('./history.dummy');
    const all = await fetchAllTrips();
    setTrips(all);
    setShowAll(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Feather name="arrow-left" size={18} color={C.text} />
          </Pressable>
          <Text style={styles.title}>My Trips</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: rs(40) }} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>

            <Text style={styles.sectionLabel}>Recent Trips</Text>

            {/* Timeline */}
            <View style={styles.timelineList}>
              {trips.map((trip, index) => (
                <TripRow
                  key={trip.id}
                  trip={trip}
                  dotColor={DOT_COLORS[index % DOT_COLORS.length]}
                  isLast={index === trips.length - 1}
                />
              ))}
            </View>

            {/* View All button — hidden once all trips are loaded */}
            {!showAll && (
              <Pressable
                style={styles.viewAllButton}
                onPress={handleViewAll}
                accessibilityRole="button">
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            )}
          </ScrollView>
        )}

      </View>
    </SafeAreaView>
  );
}
