import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { RatingStars } from '@/components/reviews/rating-stars';
import { FadeIn } from '@/components/ui/fade-in';
import { StatusMessage } from '@/components/ui/status-message';
import type { PlaceRecord } from '../../../lib/reviews-api';
import {
  deleteReviewById,
  fetchPlacesByIds,
  fetchReviewsByUser,
  fetchTagNamesByReviewIds,
} from '../../../lib/reviews-api';
import { supabase } from '../../../lib/supabase';
import { formatRelativeTime } from '../../../lib/reviews-utils';
import { REVIEW_COLORS } from './review-theme';
import { styles } from './my-reviews-screen.styles';

const SORT_OPTIONS = ['Newest', 'Highest', 'Lowest'] as const;
const INITIAL_VISIBLE_REVIEWS = 4;

type SortOption = (typeof SORT_OPTIONS)[number];

type ReviewItem = {
  id: string;
  placeId: string | null;
  destination: string;
  rating: number;
  timeAgo: string;
  body: string;
  avatarColor: string;
  createdAt: string | null;
  tags: string[];
};

const AVATAR_COLORS = ['#D6EEF1', '#FCE5C8', '#DDEAF9', '#E7EAF3'];

const isValidTag = (tag: string) => {
  const normalized = tag.replace(/^#/, '').trim();
  return normalized.length > 0 && normalized !== '0' && normalized !== '1';
};

export function MyReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeSort, setActiveSort] = React.useState<SortOption>('Newest');
  const [reviews, setReviews] = React.useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = React.useState(false);

  const handleBack = () => {
    const canGoBack =
      typeof (router as { canGoBack?: () => boolean }).canGoBack === 'function'
        ? (router as { canGoBack?: () => boolean }).canGoBack?.() === true
        : false;

    if (canGoBack) {
      router.back();
      return;
    }

    router.replace('/explore');
  };

  React.useEffect(() => {
    let isMounted = true;

    const loadMyReviews = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;

        if (!user) {
          throw new Error('Log in to see your reviews.');
        }

        setUserId(user.id);

        const reviewRows = await fetchReviewsByUser(user.id);
        const placeIds = Array.from(
          new Set(reviewRows.map((review) => review.place_id).filter(Boolean)),
        ) as string[];
        const reviewIds = reviewRows.map((review) => review.id);
        const placeRows = await fetchPlacesByIds(placeIds);
        const tagMap = await fetchTagNamesByReviewIds(reviewIds);
        const placeMap = placeRows.reduce<Record<string, PlaceRecord>>((acc, place) => {
          acc[place.id] = place;
          return acc;
        }, {});

        const items = reviewRows.map((review, index) => {
          const place = review.place_id ? placeMap[review.place_id] : undefined;
          const ratingValue = typeof review.rating === 'number' ? review.rating : 0;
          return {
            id: review.id,
            placeId: review.place_id ?? null,
            destination: place?.name ?? 'Unknown place',
            rating: ratingValue,
            timeAgo: formatRelativeTime(review.created_at),
            body: review.review ?? '',
            avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
            createdAt: review.created_at ?? null,
            tags: (tagMap[review.id] ?? []).filter(isValidTag),
          };
        });

        if (!isMounted) {
          return;
        }

        setReviews(items);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load reviews.';
        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadMyReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  const performDeleteReview = async (reviewId: string) => {
    if (!userId) {
      setErrorMessage('Log in to delete a review.');
      return;
    }

    try {
      await deleteReviewById(reviewId, userId);
      setReviews((current) => current.filter((review) => review.id !== reviewId));
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to delete review. Check your permissions.';
      setErrorMessage(message);
    }
  };

  const requestDeleteReview = (reviewId: string) => {
    setPendingDeleteId(reviewId);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    await performDeleteReview(pendingDeleteId);
    setPendingDeleteId(null);
  };

  const handleCancelDelete = () => {
    setPendingDeleteId(null);
  };

  const sortedReviews = React.useMemo(() => {
    if (activeSort === 'Highest') {
      return [...reviews].sort((a, b) => b.rating - a.rating);
    }

    if (activeSort === 'Lowest') {
      return [...reviews].sort((a, b) => a.rating - b.rating);
    }

    return [...reviews].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [activeSort, reviews]);

  React.useEffect(() => {
    setShowAllReviews(false);
  }, [activeSort, reviews.length]);

  const visibleReviews = showAllReviews
    ? sortedReviews
    : sortedReviews.slice(0, INITIAL_VISIBLE_REVIEWS);
  const shouldShowToggle = sortedReviews.length > INITIAL_VISIBLE_REVIEWS;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <FadeIn style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Feather name="arrow-left" size={20} color={REVIEW_COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>My Reviews</Text>
        </FadeIn>
        <View style={styles.headerDivider} />

        <FadeIn style={styles.sortSection} delay={90}>
          <Text style={styles.sortLabel}>Sort by</Text>
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map((option) => {
              const isActive = option === activeSort;
              return (
                <Pressable
                  key={option}
                  style={[styles.sortChip, isActive && styles.sortChipActive]}
                  onPress={() => setActiveSort(option)}>
                  <Text style={[styles.sortChipText, isActive && styles.sortChipTextActive]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </FadeIn>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}>
          {errorMessage ? (
            <StatusMessage message={errorMessage} style={styles.errorText} />
          ) : isLoading ? (
            <StatusMessage message="Loading your reviews..." style={styles.statusText} />
          ) : sortedReviews.length === 0 ? (
            <StatusMessage
              message="No reviews yet. Write your first review from Discover."
              style={styles.statusText}
            />
          ) : (
            visibleReviews.map((review, index) => (
              <FadeIn key={review.id} delay={160 + index * 70}>
                <Pressable
                  style={styles.reviewCard}
                  onPress={() => {
                    if (!review.placeId) {
                      setErrorMessage('This review is missing its destination.');
                      return;
                    }

                    router.push({ pathname: '/destination-reviews', params: { id: review.placeId } });
                  }}
                >
                  <View style={styles.reviewHeader}>
                    <View style={[styles.avatar, { backgroundColor: review.avatarColor }]} />
                    <View style={styles.reviewMeta}>
                      <View style={styles.titleRow}>
                        <Text style={styles.destinationTitle}>{review.destination}</Text>
                        <View style={styles.reviewActions}>
                          <Text style={styles.reviewTime}>{review.timeAgo}</Text>
                          <Pressable
                            style={styles.deleteButton}
                            onPress={(event) => {
                              event.stopPropagation();
                              requestDeleteReview(review.id);
                            }}
                          >
                            <Feather name="trash-2" size={14} color={REVIEW_COLORS.error} />
                          </Pressable>
                        </View>
                      </View>
                      <View style={styles.ratingRow}>
                        <RatingStars value={review.rating} size={14} />
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewBody} numberOfLines={2}>
                    {review.body}
                  </Text>
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
            ))
          )}

          {shouldShowToggle ? (
            <Pressable
              style={styles.viewMoreButton}
              onPress={() => setShowAllReviews((current) => !current)}
            >
              <Text style={styles.viewMoreText}>
                {showAllReviews
                  ? 'View less'
                  : `View more (${sortedReviews.length - INITIAL_VISIBLE_REVIEWS})`}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>

      </View>

      <Modal
        visible={Boolean(pendingDeleteId)}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete review?</Text>
            <Text style={styles.modalBody}>This cannot be undone.</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={handleCancelDelete}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalDeleteButton} onPress={handleConfirmDelete}>
                <Text style={styles.modalDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
