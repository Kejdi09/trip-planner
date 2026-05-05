import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DestinationSummary } from '@/components/reviews/destination-summary';
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
} from '../../../lib/reviews-api';
import { averageRating, DEFAULT_PLACE_IMAGE, formatPlaceRegion } from '../../../lib/reviews-utils';
import { REVIEW_COLORS } from './review-theme';
import { styles } from './destination-overview-screen.styles';

const FALLBACK_DESCRIPTION =
  "Kyoto, Japan's cultural heart, offers tranquil temples, moss gardens, and traditional wooden houses.";

type PhotoItem = {
  id: string;
  url: string;
  reviewerName: string;
};

const isValidTag = (tag: string) => {
  const normalized = tag.replace(/^#/, '').trim();
  return normalized.length > 0 && normalized !== '0' && normalized !== '1';
};

export function DestinationOverviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const [place, setPlace] = React.useState<PlaceRecord | null>(null);
  const [rating, setRating] = React.useState(0);
  const [photos, setPhotos] = React.useState<PhotoItem[]>([]);
  const [tags, setTags] = React.useState<string[]>([]);
  const [friendsVisited, setFriendsVisited] = React.useState(0);
  const [reviewCount, setReviewCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEmpty, setIsEmpty] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [activePhoto, setActivePhoto] = React.useState<PhotoItem | null>(null);

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

    const loadDestination = async () => {
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
          setRating(0);
          setPhotos([]);
          setTags([]);
          setFriendsVisited(0);
          setReviewCount(0);
          setErrorMessage(null);
          return;
        }

        const reviews = await fetchReviewsByPlace(placeRecord.id);
        const reviewIds = reviews.map((review) => review.id);
        const reviewPhotos = await fetchReviewPhotosByReviewIds(reviewIds);
        const tagMap = await fetchTagNamesByReviewIds(reviewIds);
        const userIds = Array.from(
          new Set(reviews.map((review) => review.user_id).filter(Boolean)),
        ) as string[];
        const profileRows = await fetchProfilesByIds(userIds);
        const profileMap = profileRows.reduce<Record<string, ProfileRecord>>((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
        const reviewById = reviews.reduce<Record<string, ReviewRecord>>((acc, review) => {
          acc[review.id] = review;
          return acc;
        }, {});

        const topRatedReviewIds = new Set(
          reviews
            .filter((review) => typeof review.rating === 'number' && review.rating >= 4)
            .map((review) => review.id),
        );

        const photoItems = reviewPhotos
          .filter((photo) => photo.review_id && topRatedReviewIds.has(photo.review_id))
          .map((photo) => {
            const review = photo.review_id ? reviewById[photo.review_id] : undefined;
            const profile = review?.user_id ? profileMap[review.user_id] : undefined;
            const reviewerName = profile?.full_name || profile?.username || 'Traveler';
            return {
              id: `${photo.review_id ?? 'review'}-${photo.image_url ?? 'photo'}`,
              url: photo.image_url ?? '',
              reviewerName,
            };
          })
          .filter((photo) => Boolean(photo.url));
        const tagCounts = Object.values(tagMap).reduce<Record<string, number>>(
          (acc, tagsForReview) => {
            tagsForReview.forEach((tag) => {
              if (!isValidTag(tag)) return;
              acc[tag] = (acc[tag] ?? 0) + 1;
            });
            return acc;
          },
        );

        const topTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 5)
          .map(([tag]) => tag);

        const uniqueUserCount = new Set(
          reviews.map((review: ReviewRecord) => review.user_id).filter(Boolean),
        ).size;

        if (!isMounted) {
          return;
        }

        setIsEmpty(false);
        setPlace(placeRecord);
        setRating(averageRating(reviews));
        setPhotos(photoItems);
        setTags(topTags);
        setFriendsVisited(uniqueUserCount);
        setReviewCount(reviews.length);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load destination.';
        setErrorMessage(message);
        setIsEmpty(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDestination();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const hasDestination = Boolean(place) && !errorMessage && !isEmpty;
  const destinationTitle = place?.name ?? 'Destination';
  const destinationRegion = hasDestination
    ? formatPlaceRegion(place?.city ?? null, place?.country ?? null)
    : '';
  const summaryImage = hasDestination ? photos[0]?.url ?? DEFAULT_PLACE_IMAGE : DEFAULT_PLACE_IMAGE;
  const summaryDescription = hasDestination
    ? place?.description?.trim() || FALLBACK_DESCRIPTION
    : '';
  const displayTags = hasDestination ? tags.filter(isValidTag) : [];
  const displayPhotos = hasDestination ? photos : [];
  const friendsLabel =
    friendsVisited === 0
      ? 'No friends visited yet'
      : `${friendsVisited} friend${friendsVisited === 1 ? '' : 's'} visited`;

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
                image={summaryImage}
                size="header"
              />
            ) : (
              <Text style={styles.headerTitle}>Destination Overview</Text>
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
                Add your first place to start exploring reviews and photos.
              </Text>
              <Pressable style={styles.emptyButton} onPress={() => router.replace('/explore')}>
                <Text style={styles.emptyButtonText}>Back to Discover</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <FadeIn style={styles.tabRow} delay={80}>
                <Pressable style={[styles.tabButton, styles.tabButtonActive]}>
                  <Text style={[styles.tabText, styles.tabTextActive]}>Overview</Text>
                </Pressable>
                <Pressable
                  style={styles.tabButton}
                  onPress={() =>
                    router.push(
                      place?.id
                        ? { pathname: '/destination-reviews', params: { id: place.id } }
                        : '/destination-reviews',
                    )
                  }>
                  <Text style={styles.tabText}>Reviews</Text>
                </Pressable>
              </FadeIn>

              {errorMessage ? (
                <StatusMessage message={errorMessage} style={styles.errorText} />
              ) : isLoading ? (
                <StatusMessage message="Loading destination..." style={styles.statusText} />
              ) : hasDestination && reviewCount === 0 ? (
                <StatusMessage
                  message="No reviews yet. Be the first to share your experience."
                  style={styles.statusText}
                />
              ) : null}

              <FadeIn style={styles.friendsRow} delay={120}>
                <Text style={styles.friendsLabel}>{friendsLabel}</Text>
              </FadeIn>

              <FadeIn style={styles.tagRow} delay={160}>
                {displayTags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </FadeIn>

              {!isLoading && displayTags.length === 0 ? (
                <Text style={styles.sectionHint}>No hashtags yet.</Text>
              ) : null}

              <FadeIn style={styles.descriptionCard} delay={200}>
                <Text style={styles.descriptionText}>{summaryDescription}</Text>
              </FadeIn>

              {!isLoading && !errorMessage ? (
                <>
                  <FadeIn style={styles.sectionHeader} delay={240}>
                    <Text style={styles.sectionTitle}>Photos</Text>
                  </FadeIn>

                  {displayPhotos.length > 0 ? (
                    <View style={styles.photoGrid}>
                      {displayPhotos.map((photo, index) => (
                        <FadeIn key={photo.id} delay={260 + index * 60} style={styles.photoTile}>
                          <Pressable
                            style={styles.photoTilePressable}
                            accessibilityRole="button"
                            accessibilityHint="Open review photo"
                            onPress={() => setActivePhoto(photo)}
                          >
                            <Image
                              source={{ uri: photo.url }}
                              style={styles.photoImage}
                              accessibilityLabel={`Photo by ${photo.reviewerName}`}
                            />
                            <View style={styles.photoOverlay}>
                              <Text style={styles.photoName}>{photo.reviewerName}</Text>
                            </View>
                          </Pressable>
                        </FadeIn>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.sectionHint}>No 4+ star photos yet.</Text>
                  )}
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={Boolean(activePhoto)}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePhoto(null)}
      >
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
                  accessibilityLabel={`Photo by ${activePhoto.reviewerName}`}
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
