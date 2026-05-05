import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DestinationSummary } from '@/components/reviews/destination-summary';
import { RatingStars } from '@/components/reviews/rating-stars';
import { FadeIn } from '@/components/ui/fade-in';
import { StatusMessage } from '@/components/ui/status-message';
import type { PlaceRecord, ProfileRecord, ReviewRecord } from '../../../lib/reviews-api';
import {
  fetchFirstPlace,
  fetchPlaceById,
  fetchProfilesByIds,
  fetchReviewPhotosByReviewIds,
  fetchReviewsByPlace,
} from '../../../lib/reviews-api';
import {
  averageRating,
  DEFAULT_PLACE_IMAGE,
  formatPlaceRegion,
  formatRelativeTime,
  getInitials,
} from '../../../lib/reviews-utils';
import { styles } from './destination-reviews-screen.styles';

const SORT_OPTIONS = ['Newest', 'Highest', 'Lowest'] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

type ReviewItem = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  timeAgo: string;
  body: string;
  avatarColor: string;
};

const AVATAR_COLORS = ['#D6EEF1', '#FCE5C8', '#DDEAF9', '#E7EAF3'];

export function DestinationReviewsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const [activeSort, setActiveSort] = React.useState<SortOption>('Newest');
  const [place, setPlace] = React.useState<PlaceRecord | null>(null);
  const [reviews, setReviews] = React.useState<ReviewRecord[]>([]);
  const [profiles, setProfiles] = React.useState<Record<string, ProfileRecord>>({});
  const [headerImage, setHeaderImage] = React.useState(DEFAULT_PLACE_IMAGE);
  const [rating, setRating] = React.useState(0);
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

    const loadDestinationReviews = async () => {
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
          setProfiles({});
          setHeaderImage(DEFAULT_PLACE_IMAGE);
          setRating(0);
          setErrorMessage(null);
          return;
        }

        const reviewRows = await fetchReviewsByPlace(placeRecord.id);
        const reviewIds = reviewRows.map((review) => review.id);
        const photos = await fetchReviewPhotosByReviewIds(reviewIds);
        const headerPhoto = photos.find((photo) => Boolean(photo.image_url))?.image_url;

        const userIds = Array.from(
          new Set(reviewRows.map((review) => review.user_id).filter(Boolean)),
        ) as string[];
        const profileRows = await fetchProfilesByIds(userIds);
        const profileMap = profileRows.reduce<Record<string, ProfileRecord>>((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});

        if (!isMounted) {
          return;
        }

        setIsEmpty(false);
        setPlace(placeRecord);
        setReviews(reviewRows);
        setProfiles(profileMap);
        setHeaderImage(headerPhoto ?? DEFAULT_PLACE_IMAGE);
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

    void loadDestinationReviews();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const hasDestination = Boolean(place) && !errorMessage && !isEmpty;
  const destinationTitle = place?.name ?? 'Destination';
  const destinationRegion = hasDestination
    ? formatPlaceRegion(place?.city ?? null, place?.country ?? null)
    : '';

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
      };
    });

    if (activeSort === 'Highest') {
      return [...items].sort((a, b) => b.rating - a.rating);
    }

    if (activeSort === 'Lowest') {
      return [...items].sort((a, b) => a.rating - b.rating);
    }

    const reviewById = reviews.reduce<Record<string, ReviewRecord>>((acc, review) => {
      acc[review.id] = review;
      return acc;
    }, {});

    return [...items].sort((a, b) => {
      const dateA = reviewById[a.id]?.created_at ?? '';
      const dateB = reviewById[b.id]?.created_at ?? '';
      return dateB.localeCompare(dateA);
    });
  }, [activeSort, profiles, reviews]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <FadeIn style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Feather name="arrow-left" size={20} color="#1A1C20" />
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
              <Text style={styles.headerTitle}>Reviews</Text>
            )}
          </View>
        </FadeIn>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
          {isEmpty ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No destinations yet</Text>
              <Text style={styles.emptyBody}>
                Add your first place to start collecting reviews.
              </Text>
              <Pressable style={styles.emptyButton} onPress={() => router.replace('/explore')}>
                <Text style={styles.emptyButtonText}>Back to Discover</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <FadeIn style={styles.tabRow} delay={80}>
                <Pressable
                  style={styles.tabButton}
                  onPress={() => router.push('/destination-overview')}>
                  <Text style={styles.tabText}>Overview</Text>
                </Pressable>
                <Pressable style={[styles.tabButton, styles.tabButtonActive]}>
                  <Text style={[styles.tabText, styles.tabTextActive]}>Reviews</Text>
                </Pressable>
              </FadeIn>

              <FadeIn style={styles.sortSection} delay={120}>
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

              {errorMessage ? (
                <StatusMessage message={errorMessage} style={styles.errorText} />
              ) : isLoading ? (
                <StatusMessage message="Loading reviews..." style={styles.statusText} />
              ) : reviewItems.length === 0 ? (
                <StatusMessage message="No reviews yet." style={styles.statusText} />
              ) : hasDestination ? (
                reviewItems.map((review, index) => (
                  <FadeIn key={review.id} delay={160 + index * 70}>
                    <View style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={[styles.avatar, { backgroundColor: review.avatarColor }]}>
                          <Text style={styles.avatarText}>{review.initials}</Text>
                        </View>
                        <View style={styles.reviewMeta}>
                          <View style={styles.titleRow}>
                            <Text style={styles.reviewerName}>{review.name}</Text>
                            <Text style={styles.reviewTime}>{review.timeAgo}</Text>
                          </View>
                          <View style={styles.ratingRow}>
                            <RatingStars value={review.rating} size={12} />
                          </View>
                        </View>
                      </View>
                      <Text style={styles.reviewBody} numberOfLines={2}>
                        {review.body}
                      </Text>
                    </View>
                  </FadeIn>
                ))
              ) : null}
            </>
          )}

          {hasDestination && reviewItems.length > 0 ? (
            <Pressable style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>View More</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
