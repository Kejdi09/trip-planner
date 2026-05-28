import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, FlatList, Image, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DestinationSummary } from '@/components/reviews/destination-summary';
import { RatingStars } from '@/components/reviews/rating-stars';
import { FadeIn } from '@/components/ui/fade-in';
import { StatusMessage } from '@/components/ui/status-message';
import type { PlaceRecord, ProfileRecord, ReviewRecord } from '../../../lib/reviews-api';
import {
  fetchFirstPlace,
  fetchPlaceById,
  fetchTagNamesByReviewIds,
  fetchProfilesByIds,
  fetchReviewPhotosByReviewIds,
  fetchReviewsByPlace,
  // FIX 3: Removed unused fetchReviewTagsByReviewIds import
} from '../../../lib/reviews-api';
import {
  averageRating,
  DEFAULT_PLACE_IMAGE,
  formatPlaceRegion,
  formatRelativeTime,
  getInitials,
} from '../../../lib/reviews-utils';
import { REVIEW_COLORS } from './review-theme';
import { styles } from './destination-reviews-screen.styles';

const SORT_OPTIONS = ['Newest', 'Highest', 'Lowest'] as const;
const INITIAL_VISIBLE_REVIEWS = 3;

type SortOption = (typeof SORT_OPTIONS)[number];

type ReviewItem = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  timeAgo: string;
  body: string;
  avatarColor: string;
  tags: string[];
  photos: string[];
};

type ReviewGallery = {
  photos: string[];
  index: number;
  reviewerName: string;
};

const isValidTag = (tag: string) => {
  const normalized = tag.replace(/^#/, '').trim();
  return normalized.length > 0 && normalized !== '0' && normalized !== '1';
};

const AVATAR_COLORS = ['#D6EEF1', '#FCE5C8', '#DDEAF9', '#E7EAF3'];

export function DestinationReviewsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const fallbackWidth = Dimensions.get('window').width || 360;
  const galleryWidth = windowWidth > 0 ? windowWidth : fallbackWidth;
  const [activeSort, setActiveSort] = React.useState<SortOption>('Newest');
  const [place, setPlace] = React.useState<PlaceRecord | null>(null);
  const [reviews, setReviews] = React.useState<ReviewRecord[]>([]);
  const [profiles, setProfiles] = React.useState<Record<string, ProfileRecord>>({});
  const [tagsByReviewId, setTagsByReviewId] = React.useState<Record<string, string[]>>({});
  const [photosByReviewId, setPhotosByReviewId] = React.useState<Record<string, string[]>>({});
  const [headerImage, setHeaderImage] = React.useState(DEFAULT_PLACE_IMAGE);
  const [rating, setRating] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEmpty, setIsEmpty] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = React.useState(false);
  const [expandedReviews, setExpandedReviews] = React.useState<string[]>([]);
  const [activeGallery, setActiveGallery] = React.useState<ReviewGallery | null>(null);
  const galleryItemSize = Math.max(galleryWidth, 1);

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
          // FIX 4: was setReviewTags (doesn't exist) → correct setter
          setTagsByReviewId({});
          setHeaderImage(DEFAULT_PLACE_IMAGE);
          setRating(0);
          setErrorMessage(null);
          return;
        }

        const reviewRows = await fetchReviewsByPlace(placeRecord.id);
        const reviewIds = reviewRows.map((review) => review.id);
        const photos = await fetchReviewPhotosByReviewIds(reviewIds);
        // FIX 5: Removed duplicate tagMap declaration (fetchReviewTagsByReviewIds result).
        // Keep only fetchTagNamesByReviewIds which gives the display-ready tag names.
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
        setTagsByReviewId(tagMap);
        setPhotosByReviewId(photoMap);
        const resolvedHeaderImage = placeRecord.image_url || headerPhoto || DEFAULT_PLACE_IMAGE;
        setHeaderImage(resolvedHeaderImage);
        setRating(averageRating(reviewRows));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load reviews.';
        setErrorMessage(message);
        setIsEmpty(false);
        // FIX 6: was setReviewTags (doesn't exist) → correct setter
        setTagsByReviewId({});
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
      // FIX 7: was reviewTags (doesn't exist) → tagsByReviewId; also removed unused tagNames variable
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
  }, [activeSort, profiles, reviews, tagsByReviewId, photosByReviewId]);

  React.useEffect(() => {
    setShowAllReviews(false);
    setExpandedReviews([]);
  }, [activeSort, reviews.length]);

  const visibleReviews = showAllReviews
    ? reviewItems
    : reviewItems.slice(0, INITIAL_VISIBLE_REVIEWS);

  const shouldShowToggle = reviewItems.length > INITIAL_VISIBLE_REVIEWS;

  const handleToggleReview = (reviewId: string) => {
    setExpandedReviews((current) =>
      current.includes(reviewId)
        ? current.filter((id) => id !== reviewId)
        : [...current, reviewId],
    );
  };

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
                  onPress={() =>
                    router.push(
                      place?.id
                        ? { pathname: '/destination-overview', params: { id: place.id } }
                        : '/destination-overview',
                    )
                  }>
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
                    }
                  >
                    <Feather name="edit-3" size={16} color={REVIEW_COLORS.buttonText} />
                    <Text style={styles.writeReviewText}>Write a review</Text>
                  </Pressable>
                </FadeIn>
              ) : null}

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
                visibleReviews.map((review, index) => {
                  const isExpanded = expandedReviews.includes(review.id);
                  const hasPhotos = review.photos.length > 0;

                  return (
                    <FadeIn key={review.id} delay={160 + index * 70}>
                      <View style={[styles.reviewCard, isExpanded && styles.reviewCardExpanded]}>
                        <Pressable
                          style={styles.reviewToggle}
                          accessibilityRole="button"
                          accessibilityHint="Expand or collapse review"
                          hitSlop={6}
                          onPress={() => handleToggleReview(review.id)}
                        >
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
                                  <Feather
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={14}
                                    color={REVIEW_COLORS.textSecondary}
                                  />
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
                        </Pressable>

                        {isExpanded && hasPhotos ? (
                          <View style={styles.reviewPhotoGrid}>
                            {review.photos.map((uri, photoIndex) => (
                              <Pressable
                                key={`${review.id}-${photoIndex}`}
                                style={styles.reviewPhotoTile}
                                accessibilityRole="button"
                                accessibilityHint="Open review photo"
                                onPress={() =>
                                  setActiveGallery({
                                    photos: review.photos,
                                    index: photoIndex,
                                    reviewerName: review.name,
                                  })
                                }
                              >
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
                      </View>
                    </FadeIn>
                  );
                })
              ) : null}
            </>
          )}

          {hasDestination && shouldShowToggle ? (
            <Pressable
              style={styles.viewMoreButton}
              onPress={() => setShowAllReviews((current) => !current)}
            >
              <Text style={styles.viewMoreText}>
                {showAllReviews ? 'View less' : `View more (${reviewItems.length - INITIAL_VISIBLE_REVIEWS})`}
              </Text>
            </Pressable>
          ) : null}

        </ScrollView>
      </View>

      <Modal
        visible={Boolean(activeGallery)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveGallery(null)}
      >
        <View style={styles.galleryBackdrop}>
          <View style={[styles.galleryHeader, { paddingTop: insets.top + 12 }]}>
            <Pressable style={styles.galleryClose} onPress={() => setActiveGallery(null)}>
              <Feather name="x" size={18} color={REVIEW_COLORS.buttonText} />
            </Pressable>
            <Text style={styles.galleryCounter}>
              {activeGallery ? activeGallery.index + 1 : 0} / {activeGallery?.photos.length ?? 0}
            </Text>
          </View>

          <FlatList
            data={activeGallery?.photos ?? []}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.galleryList}
            keyExtractor={(item, index) => `${index}-${item}`}
            initialScrollIndex={activeGallery?.index ?? 0}
            getItemLayout={(_, index) => ({
              length: galleryItemSize,
              offset: galleryItemSize * index,
              index,
            })}
            onMomentumScrollEnd={(event) => {
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / galleryItemSize);
              setActiveGallery((current) => (current ? { ...current, index: nextIndex } : current));
            }}
            renderItem={({ item }) => (
              <View style={[styles.gallerySlide, { width: galleryItemSize }]}>
                <Image
                  source={{ uri: item }}
                  style={styles.galleryImage}
                  resizeMode="contain"
                  accessibilityLabel={`Review photo by ${activeGallery?.reviewerName ?? 'Reviewer'}`}
                />
              </View>
            )}
          />

          {activeGallery ? (
            <View style={[styles.galleryFooter, { paddingBottom: insets.bottom + 14 }]}>
              <Text style={styles.galleryName}>{activeGallery.reviewerName}</Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}