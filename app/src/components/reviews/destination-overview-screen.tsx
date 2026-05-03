import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DestinationSummary } from '@/components/reviews/destination-summary';
import { FadeIn } from '@/components/ui/fade-in';
import { StatusMessage } from '@/components/ui/status-message';
import type { PlaceRecord, ReviewRecord } from '../../../lib/reviews-api';
import {
  fetchFirstPlace,
  fetchPlaceById,
  fetchReviewPhotosByReviewIds,
  fetchReviewsByPlace,
  fetchTagsByReviewIds,
} from '../../../lib/reviews-api';
import { averageRating, DEFAULT_PLACE_IMAGE, formatPlaceRegion } from '../../../lib/reviews-utils';
import { styles } from './destination-overview-screen.styles';

const DEFAULT_TAGS = ['#nature', '#adventure'];

const DEFAULT_PHOTOS = [
  'https://images.unsplash.com/photo-1505159940484-eb2b9f2588e2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80',
];

const FALLBACK_DESCRIPTION =
  "Kyoto, Japan's cultural heart, offers tranquil temples, moss gardens, and traditional wooden houses.";

export function DestinationOverviewScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const [place, setPlace] = React.useState<PlaceRecord | null>(null);
  const [rating, setRating] = React.useState(0);
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [tags, setTags] = React.useState<string[]>([]);
  const [friendsVisited, setFriendsVisited] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEmpty, setIsEmpty] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
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
          setErrorMessage(null);
          return;
        }

        const reviews = await fetchReviewsByPlace(placeRecord.id);
        const reviewIds = reviews.map((review) => review.id);
        const reviewPhotos = await fetchReviewPhotosByReviewIds(reviewIds);
        const tagRows = await fetchTagsByReviewIds(reviewIds);

        const photoUrls = reviewPhotos
          .map((photo) => photo.image_url)
          .filter(Boolean) as string[];
        const tagNames = tagRows
          .map((tag) => tag.name)
          .filter(Boolean)
          .map((tag) => `#${tag}`) as string[];

        const uniqueUserCount = new Set(
          reviews.map((review: ReviewRecord) => review.user_id).filter(Boolean),
        ).size;

        if (!isMounted) {
          return;
        }

        setIsEmpty(false);
        setPlace(placeRecord);
        setRating(averageRating(reviews));
        setPhotos(photoUrls);
        setTags(Array.from(new Set(tagNames)));
        setFriendsVisited(uniqueUserCount);
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
  const summaryImage = hasDestination ? photos[0] ?? DEFAULT_PLACE_IMAGE : DEFAULT_PLACE_IMAGE;
  const summaryDescription = hasDestination
    ? place?.description?.trim() || FALLBACK_DESCRIPTION
    : '';
  const displayTags = hasDestination ? (tags.length > 0 ? tags : DEFAULT_TAGS) : [];
  const displayPhotos = hasDestination ? (photos.length > 0 ? photos : DEFAULT_PHOTOS) : [];

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
                  onPress={() => router.push('/destination-reviews')}>
                  <Text style={styles.tabText}>Reviews</Text>
                </Pressable>
              </FadeIn>

              {errorMessage ? (
                <StatusMessage message={errorMessage} style={styles.errorText} />
              ) : isLoading ? (
                <StatusMessage message="Loading destination..." style={styles.statusText} />
              ) : null}

              <FadeIn style={styles.friendsRow} delay={120}>
                <Text style={styles.friendsLabel}>{friendsVisited} friends visited</Text>
                <View style={styles.avatarRow}>
                  <View style={[styles.avatar, { backgroundColor: '#D6EEF1' }]}> 
                    <Text style={styles.avatarText}>SM</Text>
                  </View>
                  <View style={[styles.avatar, { backgroundColor: '#FCE5C8', marginLeft: -10 }]}> 
                    <Text style={styles.avatarText}>JM</Text>
                  </View>
                  <View style={[styles.avatar, { backgroundColor: '#DDEAF9', marginLeft: -10 }]}> 
                    <Text style={styles.avatarText}>KL</Text>
                  </View>
                  <View style={styles.avatarCounter}>
                    <Text style={styles.avatarCounterText}>+1</Text>
                  </View>
                </View>
              </FadeIn>

              <FadeIn style={styles.tagRow} delay={160}>
                {displayTags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </FadeIn>

              <FadeIn style={styles.descriptionCard} delay={200}>
                <Text style={styles.descriptionText}>{summaryDescription}</Text>
              </FadeIn>

              {displayPhotos.length > 0 ? (
                <>
                  <FadeIn style={styles.sectionHeader} delay={240}>
                    <Text style={styles.sectionTitle}>Photos</Text>
                  </FadeIn>

                  <View style={styles.photoGrid}>
                    {displayPhotos.map((uri, index) => (
                      <FadeIn key={uri} delay={260 + index * 60} style={styles.photoTile}>
                        <Image
                          source={{ uri }}
                          style={styles.photoImage}
                          accessibilityLabel="Destination photo"
                        />
                      </FadeIn>
                    ))}
                  </View>
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
