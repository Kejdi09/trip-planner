import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Place } from '@/components/ui/types';

const CARD_THEME = {
  spacing: 8,
  borderRadius: 25,
  colors: {
    primary: '#008D9B',
    background: '#FFFFFF',
    textPrimary: '#000000',
    textSecondary: '#A19D9D',
    cardBorder: '#CFCFCF',
    cardShadow: '#000000',
    ratingIconBackground: '#FFF4CC',
    plusBackground: '#D7EDF0',
  },
} as const;

const { spacing, borderRadius, colors } = CARD_THEME;

type PlaceCardProps = {
  place: Place;
  isSaved: boolean;
  onToggleSaved: () => void;
  onPressAdd?: () => void;
  showAddButton?: boolean;
};

export function PlaceCard({
  place,
  isSaved,
  onToggleSaved,
  onPressAdd,
  showAddButton = true,
}: PlaceCardProps) {
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
          {showAddButton ? (
            <Pressable style={styles.plusButton} onPress={onPressAdd}>
              <Feather name="plus" size={24} color={colors.primary} />
            </Pressable>
          ) : null}
          <Pressable style={styles.saveButton} onPress={onToggleSaved}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  imageWrapper: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 190,
  },
  ratingPill: {
    position: 'absolute',
    left: spacing * 2,
    bottom: spacing,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing,
    paddingVertical: spacing * 0.75,
    gap: spacing * 0.5,
  },
  ratingIconWrap: {
    height: 20,
    width: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ratingIconBackground,
  },
  ratingText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  cardBody: {
    paddingHorizontal: spacing * 3,
    paddingTop: spacing * 2,
    paddingBottom: spacing * 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTextGroup: {
    gap: spacing * 0.5,
    flexShrink: 1,
    paddingRight: spacing,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  cardRegion: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  cardVisited: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  cardActionGroup: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 70,
    gap: spacing * 1.5,
    paddingTop: spacing * 0.5,
  },
  plusButton: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: colors.plusBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    minHeight: 32,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
