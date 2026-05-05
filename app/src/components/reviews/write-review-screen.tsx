import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DestinationSummary } from '@/components/reviews/destination-summary';
import { RatingStars } from '@/components/reviews/rating-stars';
import { FadeIn } from '@/components/ui/fade-in';
import { StatusMessage } from '@/components/ui/status-message';
import type { PlaceRecord } from '../../../lib/reviews-api';
import { createReviewWithTags, fetchFirstPlace, fetchPlaceById } from '../../../lib/reviews-api';
import { DEFAULT_PLACE_IMAGE, formatPlaceRegion } from '../../../lib/reviews-utils';
import { supabase } from '../../../lib/supabase';
import { REVIEW_COLORS } from './review-theme';
import { styles } from './write-review-screen.styles';

const MAX_REVIEW_LENGTH = 500;
const MAX_PHOTOS = 6;

export function WriteReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const [place, setPlace] = React.useState<PlaceRecord | null>(null);
  const [rating, setRating] = React.useState(0);
  const [reviewText, setReviewText] = React.useState('');
  const [tagInput, setTagInput] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [photoUris, setPhotoUris] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
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

    router.replace(
      place?.id ? { pathname: '/destination-reviews', params: { id: place.id } } : '/explore',
    );
  };

  React.useEffect(() => {
    let isMounted = true;

    const loadPlace = async () => {
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

          setPlace(null);
          return;
        }

        if (!isMounted) {
          return;
        }

        setPlace(placeRecord);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load destination.';
        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPlace();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const handleAddTag = () => {
    const normalized = tagInput.replace(/^#/, '').trim();
    if (!normalized) {
      return;
    }

    const label = `#${normalized}`;
    setTags((current) => (current.includes(label) ? current : [...current, label]));
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags((current) => current.filter((item) => item !== tag));
  };

  const handlePickPhotos = async () => {
    setErrorMessage(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      setErrorMessage('Allow photo access to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (result.canceled) {
      return;
    }

    const newUris = result.assets.map((asset) => asset.uri).filter(Boolean);

    setPhotoUris((current) => {
      const merged = [...current, ...newUris];
      return merged.slice(0, MAX_PHOTOS);
    });
  };

  const handleRemovePhoto = (uri: string) => {
    setPhotoUris((current) => current.filter((item) => item !== uri));
  };

  const handleSubmit = async () => {
    if (!place) {
      setErrorMessage('Select a destination before posting.');
      return;
    }

    const trimmedReview = reviewText.trim();

    if (!trimmedReview) {
      setErrorMessage('Write a review before posting.');
      return;
    }

    if (rating <= 0) {
      setErrorMessage('Add a rating to post.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        throw new Error('Log in to post a review.');
      }

      await createReviewWithTags({
        userId: user.id,
        placeId: place.id,
        rating,
        review: trimmedReview,
        tagNames: tags,
        photoUris,
      });

      setStatusMessage('Review posted!');
      router.replace({ pathname: '/destination-reviews', params: { id: place.id } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to post review.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canPost = Boolean(place) && rating > 0 && reviewText.trim().length > 0 && !isSubmitting;
  const destinationTitle = place?.name ?? 'Destination';
  const destinationRegion = place
    ? formatPlaceRegion(place.city ?? null, place.country ?? null)
    : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <FadeIn style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Feather name="arrow-left" size={20} color={REVIEW_COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Write a review</Text>
          <Pressable
            style={[styles.postButton, !canPost && styles.postButtonDisabled]}
            disabled={!canPost}
            onPress={handleSubmit}
          >
            <Text style={styles.postButtonText}>{isSubmitting ? 'Posting...' : 'Post'}</Text>
          </Pressable>
        </FadeIn>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {isLoading ? (
            <StatusMessage message="Loading destination..." style={styles.statusText} />
          ) : place ? (
            <View style={styles.summaryWrapper}>
              <DestinationSummary
                title={destinationTitle}
                region={destinationRegion}
                rating={rating > 0 ? rating : 0}
                image={DEFAULT_PLACE_IMAGE}
                size="card"
              />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No destination yet</Text>
              <Text style={styles.emptyBody}>Head to Discover to pick where you want to review.</Text>
              <Pressable style={styles.emptyButton} onPress={() => router.replace('/explore')}>
                <Text style={styles.emptyButtonText}>Back to Discover</Text>
              </Pressable>
            </View>
          )}

          {errorMessage ? <StatusMessage message={errorMessage} style={styles.errorText} /> : null}
          {statusMessage ? <StatusMessage message={statusMessage} style={styles.statusText} /> : null}

          {place ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Rating</Text>
                <RatingStars value={rating} size={22} onChange={setRating} />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Your review</Text>
                <TextInput
                  value={reviewText}
                  onChangeText={(text) => {
                    setReviewText(text);
                    setStatusMessage(null);
                  }}
                  style={styles.reviewInput}
                  placeholder="Share the highlights, tips, and anything to know before visiting."
                  placeholderTextColor={REVIEW_COLORS.textSecondary}
                  multiline
                  maxLength={MAX_REVIEW_LENGTH}
                  editable={!isSubmitting}
                />
                <Text style={styles.charCount}>{reviewText.length}/{MAX_REVIEW_LENGTH}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Tags</Text>
                <View style={styles.customTagRow}>
                  <TextInput
                    value={tagInput}
                    onChangeText={setTagInput}
                    style={styles.customTagInput}
                    placeholder="Add a tag"
                    placeholderTextColor={REVIEW_COLORS.textSecondary}
                    onSubmitEditing={handleAddTag}
                    editable={!isSubmitting}
                  />
                  <Pressable style={styles.customTagButton} onPress={handleAddTag}>
                    <Text style={styles.customTagButtonText}>Add</Text>
                  </Pressable>
                </View>
                <View style={styles.tagRow}>
                  {tags.map((tag) => (
                    <Pressable
                      key={tag}
                      style={[styles.tagChip, styles.tagChipActive]}
                      onPress={() => handleRemoveTag(tag)}
                    >
                      <Text style={[styles.tagText, styles.tagTextActive]}>{tag}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Photos</Text>
                <View style={styles.photoRow}>
                  <Pressable style={styles.addPhotoButton} onPress={handlePickPhotos}>
                    <Feather name="image" size={16} color={REVIEW_COLORS.accent} />
                    <Text style={styles.addPhotoText}>Add photos</Text>
                  </Pressable>

                  <View style={styles.photoThumbRow}>
                    {photoUris.map((uri) => (
                      <View key={uri} style={styles.photoThumb}>
                        <Image source={{ uri }} style={styles.photoImage} />
                        <Pressable style={styles.removeBadge} onPress={() => handleRemovePhoto(uri)}>
                          <Feather name="x" size={12} color={REVIEW_COLORS.buttonText} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
