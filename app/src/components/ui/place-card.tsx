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
  onPressDetails?: () => void;
  showAddButton?: boolean;
};

export function PlaceCard({
  place,
  isSaved,
  onToggleSaved,
  onPressAdd,
  onPressDetails,
  showAddButton = true,
}: PlaceCardProps) {
  const handleCardPress = () => {
    onPressDetails?.();
  };

  const handleAddPress = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    onPressAdd?.();
  };

  const handleSavePress = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    onToggleSaved();
  };

  return (
    <Pressable style={styles.card} onPress={handleCardPress}>
      <View style={styles.imageWrapper}>
        {place.image ? (
          <Image source={{ uri: place.image }} style={styles.cardImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Feather name="map-pin" size={26} color="#0F766E" />
            <Text style={styles.imagePlaceholderText} numberOfLines={2}>
              {place.title}
            </Text>
            <Text style={styles.imagePlaceholderSubtext} numberOfLines={1}>
              {place.region}
            </Text>
          </View>
        )}
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
            <Pressable style={styles.plusButton} onPress={handleAddPress}>
              <Feather name="plus" size={24} color={colors.primary} />
            </Pressable>
          ) : null}
          <Pressable style={styles.saveButton} onPress={handleSavePress}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>
    </Pressable>
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
  imagePlaceholder: {
    width: '100%',
    height: 190,
    backgroundColor: '#E8F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing,
    paddingHorizontal: spacing * 2,
  },
  imagePlaceholderText: {
    color: '#134E4A',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  imagePlaceholderSubtext: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
