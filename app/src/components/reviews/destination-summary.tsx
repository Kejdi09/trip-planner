import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { REVIEW_COLORS, REVIEW_FONTS, rs } from './review-theme';

type DestinationSummaryProps = {
  title: string;
  region: string;
  rating: number;
  image: string;
  size?: 'compact' | 'card' | 'header';
};

export function DestinationSummary({
  title,
  region,
  rating,
  image,
  size = 'compact',
}: DestinationSummaryProps) {
  const isCard = size === 'card';
  const isHeader = size === 'header';
  const starSize = isCard || isHeader ? 14 : 12;

  return (
    <View style={[styles.container, isCard && styles.containerCard]}>
      <Image
        source={{ uri: image }}
        style={[styles.image, isCard && styles.imageCard, isHeader && styles.imageHeader]}
        accessibilityLabel={`${title} photo`}
      />
      <View style={styles.textGroup}>
        <Text style={[styles.title, isCard && styles.titleCard, isHeader && styles.titleHeader]}>
          {title}
        </Text>
        <Text style={[styles.region, isHeader && styles.regionHeader]}>{region}</Text>
        <View style={[styles.ratingRow, isHeader && styles.ratingRowHeader]}>
          <Ionicons name="star" size={starSize} color={REVIEW_COLORS.star} />
          <Text style={[styles.ratingText, isHeader && styles.ratingTextHeader]}>
            {rating.toFixed(1)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
  },
  containerCard: {
    padding: rs(14),
    borderRadius: rs(18),
    backgroundColor: REVIEW_COLORS.surface,
    borderWidth: 1,
    borderColor: REVIEW_COLORS.border,
  },
  image: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(10),
    backgroundColor: REVIEW_COLORS.surfaceMuted,
  },
  imageCard: {
    width: rs(62),
    height: rs(62),
    borderRadius: rs(14),
  },
  imageHeader: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(14),
  },
  textGroup: {
    flex: 1,
  },
  title: {
    fontSize: rs(14),
    fontWeight: '700',
    color: REVIEW_COLORS.textPrimary,
    fontFamily: REVIEW_FONTS.heading,
  },
  titleCard: {
    fontSize: rs(18),
  },
  titleHeader: {
    fontSize: rs(16),
  },
  region: {
    marginTop: rs(2),
    fontSize: rs(12),
    color: REVIEW_COLORS.textSecondary,
    fontFamily: REVIEW_FONTS.body,
  },
  regionHeader: {
    fontSize: rs(13),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(4),
    gap: rs(4),
  },
  ratingRowHeader: {
    marginTop: rs(6),
    gap: rs(6),
  },
  ratingText: {
    fontSize: rs(12),
    fontWeight: '700',
    color: REVIEW_COLORS.textPrimary,
    fontFamily: REVIEW_FONTS.body,
  },
  ratingTextHeader: {
    fontSize: rs(13),
  },
});
