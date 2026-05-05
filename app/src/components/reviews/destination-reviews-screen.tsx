import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DestinationSummary } from '@/components/reviews/destination-summary';
import { RatingStars } from '@/components/reviews/rating-stars';
import { FadeIn } from '@/components/ui/fade-in';
import { StatusMessage } from '@/components/ui/status-message';
import type { PlaceRecord, ProfileRecord } from '../../../lib/reviews-api';
import {
  fetchFirstPlace,
  fetchPlaceById,
  fetchProfilesByIds,
  fetchReviewPhotosByReviewIds,
  fetchReviewsByPlace,
} from '../../../lib/reviews-api';
import { averageRating, formatPlaceRegion, formatRelativeTime, getInitials } from '../../../lib/reviews-utils';
import { REVIEW_COLORS } from './review-theme';
import { styles } from '@/components/reviews/destination-reviews-screen.styles';

const SORT_OPTIONS = ['Newest', 'Highest', 'Lowest'] as const;
const AVATAR_COLORS = ['#D6EEF1', '#FCE5C8', '#DDEAF9', '#E7EAF3'];

type SortOption = (typeof SORT_OPTIONS)[number];

type ReviewItem = {
  id: string;
  reviewerName: string;
  rating: number;
  timeAgo: string;
  body: string;
  avatarColor: string;
  createdAt: string | null;
  tags: string[];
  photos: string[];
};

const isValidTag = (tag: string) => {
  const normalized = tag.replace(/^#/, '').trim();
  return normalized.length > 0 && normalized !== '0' && normalized !== '1';
};

export function DestinationReviewsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const [place, setPlace] = React.useState<PlaceRecord | null>(null);
  const [reviews, setReviews] = React.useState<ReviewItem[]>([]);
  const [headerImage, setHeaderImage] = React.useState<string | null>(null);
  const [rating, setRating] = React.useState(0);
  const [activeSort, setActiveSort] = React.useState<SortOption>('Newest');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEmpty, setIsEmpty] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleBack = () => {
    const canGoBack =
      typeof (router as { canGoBack?: () => boolean }).canGoBack === 'function'
        ? (router as { canGoBack?: () => boolean }).canGoBack?.() === true
        : false;
    if (canGoBack) { router.back(); return; }
    router.replace('/explore');
  };

  React.useEffect(() => {
    let isMounted = true;

    const loadReviews = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const placeRecord = params.id
          ? await fetchPlaceById(String(params.id))
          : await fetchFirstPlace();

        if (!placeRecord) {
          if (!isMounted) return;
          setIsEmpty(true);
          setPlace(null);
          setReviews([]);
          setProfiles({});
          setTagsByReviewId({});
          setHeaderImage(DEFAULT_PLACE_IMAGE);
          setRating(0);
          setHeaderImage(null);
          setErrorMessage(null);
          return;
        }

        const reviewRows = await fetchReviewsByPlace(placeRecord.id);
        const reviewIds = reviewRows.map((review) => review.id);
        const photos = await fetchReviewPhotosByReviewIds(reviewIds);
        const tagMap = await fetchTagNamesByReviewIds(reviewIds);
        const headerPhoto = photos.find((photo) => Boolean(photo.image_url))?.image_url;
        const photoMap = photos.reduce<Record<string, string[]>>((acc, photo) => {
          if (photo.review_id && photo.image_url) {
            acc[photo.review_id] = acc[photo.review_id]
              ? [...acc[photo.review_id], photo.image_url]
              : [photo.image_url];
          }
          return acc;
        }, {});

        const userIds = Array.from(
          new Set(reviewRows.map((review) => review.user_id).filter(Boolean)),
        ) as string[];

        const [profileRows, tagMap, reviewPhotos] = await Promise.all([
          fetchProfilesByIds(userIds),
          fetchTagNamesByReviewIds(reviewIds),
          fetchReviewPhotosByReviewIds(reviewIds),
        ]);

        const profileMap = profileRows.reduce<Record<string, ProfileRecord>>((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});

        if (!isMounted) return;

        setIsEmpty(false);
        setPlace(placeRecord);
        setReviews(items);
        setHeaderImage(headerPhoto);
        setRating(averageRating(reviewRows));
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load reviews.';
        setErrorMessage(message);
        setIsEmpty(false);
        setTagsByReviewId({});
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadDestinationReviews();
    return () => { isMounted = false; };
  }, [params.id]);

  const hasDestination = Boolean(place) && !errorMessage && !isEmpty;
  const destinationTitle = place?.name ?? 'Destination';
  const destinationRegion = hasDestination
    ? formatPlaceRegion(place?.city ?? null, place?.country ?? null)
    : '';

  // BATCH 1: Rating breakdown per star (1–5)
  const ratingBreakdown = React.useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const v = typeof r.rating === 'number' ? Math.round(r.rating) : 0;
      if (v >= 1 && v <= 5) counts[v]++;
    });
    return counts;
  }, [reviews]);

  const reviewItems = React.useMemo<ReviewItem[]>(() => {
    const items = reviews.map((review, index) => {
      const profile = review.user_id ? profiles[review.user_id] : undefined;
      const name = profile?.full_name || profile?.username || 'User';
      const ratingValue = typeof review.rating === 'number' ? review.rating : 0;
      return {
        id: review.id,
        name,
        initials: getInitials(name),
        rating: ratingValue,
        timeAgo: formatRelativeTime(review.created_at),
        body: review.review ?? '',
        avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
        tags: (tagsByReviewId[review.id] ?? []).filter(isValidTag),
        photos: photosByReviewId[review.id] ?? [],
      };
    });

    if (activeSort === 'Highest') return [...items].sort((a, b) => b.rating - a.rating);
    if (activeSort === 'Lowest') return [...items].sort((a, b) => a.rating - b.rating);

    return [...reviews].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [activeSort, reviews]);

  const hasDestination = Boolean(place) && !errorMessage && !isEmpty;
  const destinationTitle = place?.name ?? 'Destination';
  const destinationRegion = hasDestination
    ? formatPlaceRegion(place?.city ?? null, place?.country ?? null)
    : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <FadeIn style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Feather name="arrow-left" size={20} color={REVIEW_COLORS.textPrimary} />
          </Pressable>
          <View style={styles.headerSummary}>
            {hasDestination ? (
              <DestinationSummary
                title={destinationTitle}
                region={destinationRegion}
                rating={rating}
                image={headerImage}
                size="header"
              />
            ) : (
              <Text style={styles.headerTitle}>Destination Reviews</Text>
            )}
          </View>
        </FadeIn>

        {/* BATCH 1: Sticky sort bar lives outside ScrollView so it stays fixed */}
        {!isEmpty && (
          <View style={stickyStyles.sortBar}>
            <Text style={stickyStyles.sortLabel}>Sort by</Text>
            <View style={stickyStyles.sortRow}>
              {SORT_OPTIONS.map((option) => {
                const isActive = option === activeSort;
                return (
                  <Pressable
                    key={option}
                    style={[stickyStyles.sortChip, isActive && stickyStyles.sortChipActive]}
                    onPress={() => setActiveSort(option)}>
                    <Text style={[stickyStyles.sortChipText, isActive && stickyStyles.sortChipTextActive]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 64 }]}
        >
          {isEmpty ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No destinations yet</Text>
              <Text style={styles.emptyBody}>
                Add your first place to start collecting reviews from your crew.
              </Text>
              <Pressable style={styles.emptyButton} onPress={() => router.replace('/explore')}>
                <Text style={styles.emptyButtonText}>Back to Discover</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <FadeIn style={styles.tabRow} delay={60}>
                <Pressable
                  style={styles.tabButton}
                  onPress={() =>
                    router.push(
                      place?.id
                        ? { pathname: '/destination-overview', params: { id: place.id } }
                        : '/destination-overview',
                    )
                  }
                >
                  <Text style={styles.tabText}>Overview</Text>
                </Pressable>
                <Pressable style={[styles.tabButton, styles.tabButtonActive]}>
                  <Text style={[styles.tabText, styles.tabTextActive]}>Reviews</Text>
                </Pressable>
              </FadeIn>

              {hasDestination && !isLoading ? (
                <FadeIn style={styles.writeReviewRow} delay={100}>
                  <Pressable
                    style={styles.writeReviewButton}
                    onPress={() =>
                      router.push(
                        place?.id ? { pathname: '/write-review', params: { id: place.id } } : '/write-review',
                      )
                    }>
                    <Feather name="edit-3" size={16} color={REVIEW_COLORS.buttonText} />
                    <Text style={styles.writeReviewText}>Write a review</Text>
                  </Pressable>
                </FadeIn>
              ) : null}

              {/* BATCH 1: Inline rating summary with bar chart */}
              {hasDestination && !isLoading && reviewItems.length > 0 ? (
                <FadeIn style={ratingStyles.card} delay={110}>
                  <View style={ratingStyles.left}>
                    <Text style={ratingStyles.bigRating}>{rating.toFixed(1)}</Text>
                    <RatingStars value={Math.round(rating)} size={13} />
                    <Text style={ratingStyles.reviewCount}>{reviewItems.length} review{reviewItems.length === 1 ? '' : 's'}</Text>
                  </View>
                  <View style={ratingStyles.bars}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingBreakdown[star] ?? 0;
                      const pct = reviewItems.length > 0 ? count / reviewItems.length : 0;
                      return (
                        <View key={star} style={ratingStyles.barRow}>
                          <Text style={ratingStyles.barLabel}>{star}</Text>
                          <View style={ratingStyles.barTrack}>
                            <View style={[ratingStyles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
                          </View>
                          <Text style={ratingStyles.barCount}>{count}</Text>
                        </View>
                      );
                    })}
                  </View>
                </FadeIn>
              ) : null}

              {errorMessage ? (
                <StatusMessage message={errorMessage} style={styles.errorText} />
              ) : isLoading ? (
                <StatusMessage message="Loading reviews..." style={styles.statusText} />
              ) : reviewItems.length === 0 ? (
                <StatusMessage message="No reviews yet." style={styles.statusText} />
              ) : hasDestination ? (
                visibleReviews.map((review, index) => {
                  const isExpanded = expandedReviews.includes(review.id);
                  const hasPhotos = review.photos.length > 0;

                  return (
                    <FadeIn key={review.id} delay={160 + index * 70}>
                      <Pressable
                        style={[styles.reviewCard, isExpanded && styles.reviewCardExpanded]}
                        accessibilityRole="button"
                        accessibilityHint="Expand or collapse review"
                        hitSlop={6}
                        onPress={() => handleToggleReview(review.id)}>
                        <View style={styles.reviewHeader}>
                          <View style={[styles.avatar, { backgroundColor: review.avatarColor }]}>
                            <Text style={styles.avatarText}>{review.initials}</Text>
                          </View>
                          <View style={styles.reviewMeta}>
                            <View style={styles.titleRow}>
                              <Text style={styles.reviewerName}>{review.name}</Text>
                              <View style={styles.reviewMetaRight}>
                                {hasPhotos ? (
                                  <View style={styles.photoBadge}>
                                    <Feather name="image" size={12} color={REVIEW_COLORS.buttonText} />
                                    <Text style={styles.photoBadgeText}>{review.photos.length}</Text>
                                  </View>
                                ) : null}
                                <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={REVIEW_COLORS.textSecondary} />
                                <Text style={styles.reviewTime}>{review.timeAgo}</Text>
                              </View>
                            </View>
                            <View style={styles.ratingRow}>
                              <RatingStars value={review.rating} size={12} />
                            </View>
                          </View>
                        </View>
                        <Text style={styles.reviewBody} numberOfLines={isExpanded ? undefined : 2}>
                          {review.body}
                        </Text>
                        {isExpanded && hasPhotos ? (
                          <View style={styles.reviewPhotoGrid}>
                            {review.photos.map((uri) => (
                              <Pressable
                                key={`${review.id}-${uri}`}
                                style={styles.reviewPhotoTile}
                                accessibilityRole="button"
                                accessibilityHint="Open review photo"
                                onPress={() => setActivePhoto({ url: uri, reviewerName: review.name })}>
                                <Image
                                  source={{ uri }}
                                  style={styles.reviewPhotoImage}
                                  accessibilityLabel={`Review photo by ${review.name}`}
                                />
                              </Pressable>
                            ))}
                          </View>
                        ) : null}
                        {review.tags.length > 0 ? (
                          <View style={styles.reviewTagsRow}>
                            {review.tags.map((tag) => (
                              <View key={`${review.id}-${tag}`} style={styles.reviewTagChip}>
                                <Text style={styles.reviewTagText}>{tag}</Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </Pressable>
                    </FadeIn>
                  );
                })
              ) : null}
            </>
          )}

          {hasDestination && shouldShowToggle ? (
            <Pressable
              style={styles.viewMoreButton}
              onPress={() => setShowAllReviews((current) => !current)}>
              <Text style={styles.viewMoreText}>
                {showAllReviews ? 'View less' : `View more (${reviewItems.length - INITIAL_VISIBLE_REVIEWS})`}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>

      <Modal
        visible={Boolean(activePhoto)}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePhoto(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Pressable style={styles.modalClose} onPress={() => setActivePhoto(null)}>
              <Feather name="x" size={20} color={REVIEW_COLORS.textPrimary} />
            </Pressable>
            {activePhoto ? (
              <>
                <Image
                  source={{ uri: activePhoto.url }}
                  style={styles.modalImage}
                  accessibilityLabel={`Review photo by ${activePhoto.reviewerName}`}
                />
                <Text style={styles.modalName}>{activePhoto.reviewerName}</Text>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// BATCH 1: Sticky sort bar styles
const stickyStyles = StyleSheet.create({
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CFCFCF',
    backgroundColor: '#FFFFFF',
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A19D9D',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E3E8EC',
  },
  sortChipActive: {
    backgroundColor: '#008D9B',
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#091018',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
});

// BATCH 1: Rating breakdown card styles
const ratingStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#E3E8EC',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  left: {
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
  },
  bigRating: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
  reviewCount: {
    fontSize: 11,
    color: '#A19D9D',
    fontWeight: '600',
    marginTop: 2,
  },
  bars: {
    flex: 1,
    gap: 5,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A19D9D',
    width: 10,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#CFCFCF',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#008D9B',
  },
  barCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A19D9D',
    width: 16,
    textAlign: 'right',
  },
});