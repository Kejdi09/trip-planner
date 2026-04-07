import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { DISCOVER_THEME, styles } from '@/components/discover-screen.styles';
import type { Place } from '@/components/discover/types';

const { colors } = DISCOVER_THEME;

type PlaceCardProps = {
  place: Place;
  isSaved: boolean;
  onToggleSaved: () => void;
};

export function PlaceCard({ place, isSaved, onToggleSaved }: PlaceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: place.image }} style={styles.cardImage} />
        <View style={styles.ratingPill}>
          <View style={styles.ratingIconWrap}>
            <Ionicons name="star" size={12} color="#F4B400" />
          </View>
          <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTextGroup}>
          <Text style={styles.cardTitle}>{place.title}</Text>
          <Text style={styles.cardRegion}>{place.region}</Text>
          <Text style={styles.cardVisited}>{place.visited}</Text>
        </View>

        <View style={styles.cardActionGroup}>
          <Pressable style={styles.plusButton}>
            <Feather name="plus" size={24} color={colors.primary} />
          </Pressable>
          <Pressable style={styles.saveButton} onPress={onToggleSaved}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
