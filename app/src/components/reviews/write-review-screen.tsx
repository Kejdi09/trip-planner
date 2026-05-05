import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DestinationSummary } from '@/components/reviews/destination-summary';
import { RatingStars } from '@/components/reviews/rating-stars';
import { FadeIn } from '@/components/ui/fade-in';
import { StatusMessage } from '@/components/ui/status-message';
import type { PlaceRecord } from '../../../lib/reviews-api';
import {
  createReviewWithTags,
  fetchFirstPlace,
  fetchPlaceById,
  fetchReviewPhotosByReviewIds,
  fetchReviewsByPlace,
} from '../../../lib/reviews-api';
import { supabase } from '../../../lib/supabase';
import { averageRating, DEFAULT_PLACE_IMAGE, formatPlaceRegion } from '../../../lib/reviews-utils';
import { REVIEW_COLORS } from './review-theme';
import { styles } from './write-review-screen.styles';

const TAGS = ['#food', '#culture', '#nightlife', '#nature', '#adventure', '#relaxation'];

export function WriteReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const [place, setPlace] = React.useState<PlaceRecord | null>(null);
  const [destinationRating, setDestinationRating] = React.useState(0);
  const [destinationImage, setDestinationImage] = React.useState(DEFAULT_PLACE_IMAGE);
  const [userRating, setUserRating] = React.useState(0);
  const [reviewText, setReviewText] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [selectedPhotos, setSelectedPhotos] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEmpty, setIsEmpty] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

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
          setDestinationRating(0);
          setDestinationImage(DEFAULT_PLACE_IMAGE);
          setErrorMessage(null);
          return;
        }

        const reviews = await fetchReviewsByPlace(placeRecord.id);
        const reviewIds = reviews.map((review) => review.id);
        const photos = await fetchReviewPhotosByReviewIds(reviewIds);
        const headerPhoto = photos.find((photo) => Boolean(photo.image_url))?.image_url;

        if (!isMounted) {
          return;
        }

        setIsEmpty(false);
        setPlace(placeRecord);
        setDestinationRating(averageRating(reviews));
        setDestinationImage(headerPhoto ?? DEFAULT_PLACE_IMAGE);
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

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  };

  const handleAddPhoto = async () => {
    setErrorMessage(null);

    if (Platform.OS === 'web') {
      setErrorMessage('Photo picker is not available on web. Use the mobile app.');
      return;
    }

    const ImagePicker = await import('expo-image-picker');

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrorMessage('Photo access is required to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const uris = result.assets
      .map((asset) => asset.uri)
      .filter(Boolean) as string[];

    if (uris.length > 0) {
      setSelectedPhotos((current) => [...current, ...uris]);
    }
  };

  const handleRemovePhoto = (uri: string) => {
    setSelectedPhotos((current) => current.filter((item) => item !== uri));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setErrorMessage(null);
    setStatusMessage(null);

    if (!place) {
      setErrorMessage('Pick a destination before posting a review.');
      return;
    }

    if (userRating < 1) {
      setErrorMessage('Select a rating before posting.');
      return;
    }

    if (!reviewText.trim()) {
      setErrorMessage('Write a review before posting.');
      return;
    }

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setErrorMessage('Log in to post a review.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createReviewWithTags({
        userId: user.id,
        placeId: place.id,
        rating: userRating,
        review: reviewText.trim(),
        tagNames: selectedTags,
      });

      setStatusMessage('Review posted successfully.');
      router.replace({ pathname: '/destination-reviews', params: { id: place.id } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to post review right now.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const destinationTitle = place?.name ?? 'Destination';
  const destinationRegion = formatPlaceRegion(place?.city ?? null, place?.country ?? null);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <FadeIn style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Feather name="arrow-left" size={20} color={REVIEW_COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Write Review</Text>
          <Pressable
            style={[styles.postButton, isSubmitting && styles.postButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.postButtonText}>Post</Text>
          </Pressable>
        </FadeIn>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
          {isEmpty ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No destinations yet</Text>
              <Text style={styles.emptyBody}>
                Add your first place before writing a review.
              </Text>
              <Pressable style={styles.emptyButton} onPress={() => router.replace('/explore')}>
                <Text style={styles.emptyButtonText}>Back to Discover</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {errorMessage ? (
                <StatusMessage message={errorMessage} style={styles.errorText} />
              ) : statusMessage ? (
                <StatusMessage message={statusMessage} style={styles.statusText} />
              ) : isLoading ? (
                <StatusMessage message="Loading destination..." style={styles.statusText} />
              ) : null}

              <FadeIn style={styles.summaryWrapper} delay={90}>
                <DestinationSummary
                  title={destinationTitle}
                  region={destinationRegion}
                  rating={destinationRating}
                  image={destinationImage}
                  size="card"
                />
              </FadeIn>

              <FadeIn style={styles.section} delay={130}>
                <Text style={styles.sectionLabel}>Your Rating</Text>
                <RatingStars value={userRating} size={24} onChange={setUserRating} />
              </FadeIn>

              <FadeIn style={styles.section} delay={170}>
                <Text style={styles.sectionLabel}>Your Review</Text>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Share your experience..."
                  placeholderTextColor={REVIEW_COLORS.textSecondary}
                  multiline
                  textAlignVertical="top"
                  value={reviewText}
                  onChangeText={setReviewText}
                />
                <Text style={styles.charCount}>{reviewText.length}/1400 characters</Text>
              </FadeIn>

              {place ? (
                <FadeIn style={styles.section} delay={210}>
                  <Text style={styles.sectionLabel}>Add Photos</Text>
                  <View style={styles.photoRow}>
                    <Pressable style={styles.addPhotoButton} onPress={handleAddPhoto}>
                      <Feather name="plus" size={20} color={REVIEW_COLORS.accent} />
                      <Text style={styles.addPhotoText}>Add Photos</Text>
                    </Pressable>
                    <View style={styles.photoThumbRow}>
                      {selectedPhotos.map((uri) => (
                        <View key={uri} style={styles.photoThumb}>
                          <Image
                            source={{ uri }}
                            style={styles.photoImage}
                            accessibilityLabel="Review photo"
                          />
                          <Pressable
                            style={styles.removeBadge}
                            onPress={() => handleRemovePhoto(uri)}
                          >
                            <Feather name="x" size={12} color="#FFFFFF" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </View>
                </FadeIn>
              ) : null}

              <FadeIn style={styles.section} delay={250}>
                <Text style={styles.sectionLabel}>Add Tags</Text>
                <View style={styles.tagRow}>
                  {TAGS.map((tag) => {
                    const isActive = selectedTags.includes(tag);
                    return (
                      <Pressable
                        key={tag}
                        style={[styles.tagChip, isActive && styles.tagChipActive]}
                        onPress={() => toggleTag(tag)}>
                        <Text style={[styles.tagText, isActive && styles.tagTextActive]}>
                          {tag}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable style={styles.tagChip}>
                    <Text style={styles.tagText}>+ Custom</Text>
                  </Pressable>
                </View>
              </FadeIn>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
