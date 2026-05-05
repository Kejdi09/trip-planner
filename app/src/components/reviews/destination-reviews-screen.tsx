import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
  fetchReviewsByPlace,
} from '../../../lib/reviews-api';
import { averageRating, DEFAULT_PLACE_IMAGE, formatPlaceRegion, formatRelativeTime, getInitials } from '../../../lib/reviews-utils';
import { REVIEW_COLORS } from './review-theme';
import { styles } from './destination-reviews-screen.styles';

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
};

export function DestinationReviewsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const [place, setPlace] = React.useState<PlaceRecord | null>(null);
  const [reviews, setReviews] = React.useState<ReviewItem[]>([]);
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

    if (canGoBack) {
      router.back();
      return;
    }

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
          if (!isMounted) {
            return;
          }

          setIsEmpty(true);
          setPlace(null);
          setReviews([]);
          setRating(0);
          setErrorMessage(null);
          return;
        }

        const reviewRows = await fetchReviewsByPlace(placeRecord.id);
        const userIds = Array.from(
          new Set(reviewRows.map((review) => review.user_id).filter(Boolean)),
        ) as string[];
        const profileRows = await fetchProfilesByIds(userIds);
        const profileMap = profileRows.reduce<Record<string, ProfileRecord>>((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});

        const items = reviewRows.map((review, index) => {
          const profile = review.user_id ? profileMap[review.user_id] : undefined;
          const reviewerName = profile?.full_name || profile?.username || 'Traveler';
          return {
            id: review.id,
            reviewerName,
            rating: typeof review.rating === 'number' ? review.rating : 0,
            timeAgo: formatRelativeTime(review.created_at),
            body: review.review ?? '',
            avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
            createdAt: review.created_at ?? null,
          };
        });

        if (!isMounted) {
          return;
        }

        setIsEmpty(false);
        setPlace(placeRecord);
        setReviews(items);
        setRating(averageRating(reviewRows));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load reviews.';
        setErrorMessage(message);
        setIsEmpty(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadReviews();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const sortedReviews = React.useMemo(() => {
    if (activeSort === 'Highest') {
      return [...reviews].sort((a, b) => b.rating - a.rating);
    }

    if (activeSort === 'Lowest') {
      return [...reviews].sort((a, b) => a.rating - b.rating);
    }

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
                image={DEFAULT_PLACE_IMAGE}
                size="header"
              />
            ) : (
              <Text style={styles.headerTitle}>Destination Reviews</Text>
            )}
          </View>
        </FadeIn>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
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

              <FadeIn style={styles.writeReviewRow} delay={100}>
                <Pressable
                  style={styles.writeReviewButton}
                  onPress={() =>
                    router.push(
                      place?.id ? { pathname: '/write-review', params: { id: place.id } } : '/write-review',
                    )
                  }
                >
                  <Feather name="edit-3" size={16} color={REVIEW_COLORS.buttonText} />
                  <Text style={styles.writeReviewText}>Write a review</Text>
                </Pressable>
              </FadeIn>

              <FadeIn style={styles.sortSection} delay={140}>
                <Text style={styles.sortLabel}>Sort by</Text>
                <View style={styles.sortRow}>
                  {SORT_OPTIONS.map((option) => {
                    const isActive = option === activeSort;
                    return (
                      <Pressable
                        key={option}
                        style={[styles.sortChip, isActive && styles.sortChipActive]}
                        onPress={() => setActiveSort(option)}
                      >
                        <Text style={[styles.sortChipText, isActive && styles.sortChipTextActive]}>
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </FadeIn>

              {errorMessage ? (
                <StatusMessage message={errorMessage} style={styles.errorText} />
              ) : isLoading ? (
                <StatusMessage message="Loading reviews..." style={styles.statusText} />
              ) : sortedReviews.length === 0 ? (
                <StatusMessage
                  message="No reviews yet. Be the first to share your experience."
                  style={styles.statusText}
                />
              ) : null}

              {sortedReviews.map((review, index) => (
                <FadeIn key={review.id} delay={180 + index * 60}>
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={[styles.avatar, { backgroundColor: review.avatarColor }]}>
                        <Text style={styles.avatarText}>{getInitials(review.reviewerName)}</Text>
                      </View>
                      <View style={styles.reviewMeta}>
                        <View style={styles.titleRow}>
                          <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                          <Text style={styles.reviewTime}>{review.timeAgo}</Text>
                        </View>
                        <View style={styles.ratingRow}>
                          <RatingStars value={review.rating} size={14} />
                        </View>
                      </View>
                    </View>
                    {review.body ? (
                      <Text style={styles.reviewBody} numberOfLines={4}>
                        {review.body}
                      </Text>
                    ) : null}
                  </View>
                </FadeIn>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
