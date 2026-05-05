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
import {
  createReviewWithTags,
  fetchFirstPlace,
  fetchPlaceById,
  fetchReviewPhotosByReviewIds,
  fetchReviewsByPlace,
  fetchTagNamesByReviewIds,
} from '../../../lib/reviews-api';
import { formatPlaceRegion } from '../../../lib/reviews-utils';
import { supabase } from '../../../lib/supabase';
import { REVIEW_COLORS } from './review-theme';
import { styles } from './write-review-screen.styles';

const PRESET_TAGS = ['#food', '#culture', '#nightlife', '#nature', '#adventure', '#relaxation'];
const MAX_PHOTOS = 6;

export function WriteReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();

  const [place, setPlace] = React.useState<PlaceRecord | null>(null);
  const [destinationRating, setDestinationRating] = React.useState(0);
  const [destinationImage, setDestinationImage] = React.useState(DEFAULT_PLACE_IMAGE);
  const [popularTags, setPopularTags] = React.useState<string[]>([]);

  const [userRating, setUserRating] = React.useState(0);
  const [reviewText, setReviewText] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = React.useState('');
  const [selectedPhotos, setSelectedPhotos] = React.useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

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

    const loadPlace = async () => {
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
          setDestinationRating(0);
          setDestinationImage(DEFAULT_PLACE_IMAGE);
          return;
        }

        const reviews = await fetchReviewsByPlace(placeRecord.id);
        const reviewIds = reviews.map((r) => r.id);
        const photos = await fetchReviewPhotosByReviewIds(reviewIds);
        const headerPhoto = photos.find((p) => Boolean(p.image_url))?.image_url;

        // Build popular tags ranked by usage frequency for this place
        const tagMap = await fetchTagNamesByReviewIds(reviewIds);
        const tagCounts: Record<string, number> = {};
        Object.values(tagMap).forEach((tags) => {
          tags.forEach((tag) => {
            const normalized = tag.replace(/^#/, '').trim();
            if (!normalized || normalized === '0' || normalized === '1') return;
            tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
          });
        });
        const topTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 8)
          .map(([tag]) => tag);

        if (!isMounted) return;

        setPlace(placeRecord);
        setDestinationRating(averageRating(reviews));
        setDestinationImage(headerPhoto ?? DEFAULT_PLACE_IMAGE);
        setPopularTags(topTags);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Unable to load destination.';
        setErrorMessage(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadDestination();
    return () => { isMounted = false; };
  }, [params.id]);

  // Popular tags (not in presets) surface first, then presets, then any user-added custom ones
  const displayTags = React.useMemo(() => {
    const popularOnly = popularTags.filter((t) => !PRESET_TAGS.includes(t));
    return Array.from(new Set([...popularOnly, ...PRESET_TAGS, ...selectedTags]));
  }, [popularTags, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
  };

  const handleAddCustomTag = () => {
    setErrorMessage(null);
    const trimmed = customTagInput.trim();
    if (!trimmed) { setErrorMessage('Enter a hashtag to add.'); return; }
    const normalized = trimmed.replace(/^#+/, '');
    if (!normalized) { setErrorMessage('Enter a hashtag to add.'); return; }
    const label = `#${normalized}`;
    if (selectedTags.includes(label)) { setErrorMessage('That hashtag is already selected.'); return; }
    setSelectedTags((current) => [...current, label]);
    setCustomTagInput('');
  };

  const handlePickPhotos = async () => {
    setErrorMessage(null);

    if (selectedPhotos.length >= MAX_PHOTOS) {
      setErrorMessage(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }

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

    const remaining = MAX_PHOTOS - selectedPhotos.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });

    if (result.canceled) return;

    const uris = result.assets.map((a) => a.uri).filter(Boolean) as string[];
    if (uris.length > 0) {
      setSelectedPhotos((current) => [...current, ...uris].slice(0, MAX_PHOTOS));
    }
  };

  const handleRemovePhoto = (uri: string) => {
    setPhotoUris((current) => current.filter((item) => item !== uri));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setErrorMessage(null);
    setStatusMessage(null);

    if (!place) { setErrorMessage('Pick a destination before posting a review.'); return; }
    if (userRating < 1) { setErrorMessage('Select a rating before posting.'); return; }
    if (!reviewText.trim()) { setErrorMessage('Write a review before posting.'); return; }

    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) { setErrorMessage('Log in to post a review.'); return; }

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
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
          {isEmpty ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No destinations yet</Text>
              <Text style={styles.emptyBody}>Add your first place before writing a review.</Text>
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

              {/* Destination card */}
              <FadeIn style={styles.summaryWrapper} delay={90}>
                <DestinationSummary
                  title={destinationTitle}
                  region={destinationRegion}
                  rating={destinationRating}
                  image={destinationImage}
                  size="card"
                />
              </FadeIn>

              {/* Rating */}
              <FadeIn style={styles.section} delay={130}>
                <Text style={styles.sectionLabel}>Your Rating</Text>
                <RatingStars value={userRating} size={28} onChange={setUserRating} />
              </FadeIn>

              {/* Review text */}
              <FadeIn style={styles.section} delay={160}>
                <Text style={styles.sectionLabel}>Your Review</Text>
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
                  textAlignVertical="top"
                  value={reviewText}
                  onChangeText={setReviewText}
                  maxLength={1400}
                />
                <Text style={styles.charCount}>{reviewText.length}/1400</Text>
              </FadeIn>

              {/* Photos */}
              {place ? (
                <FadeIn style={styles.section} delay={190}>
                  <View style={styles.sectionLabelRow}>
                    <Text style={styles.sectionLabel}>Photos</Text>
                    <Text style={styles.sectionSub}>{selectedPhotos.length}/{MAX_PHOTOS}</Text>
                  </View>

                  <View style={styles.photoGrid}>
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
                          hitSlop={6}
                        >
                          <Feather name="x" size={11} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    ))}

                    {selectedPhotos.length < MAX_PHOTOS ? (
                      <Pressable style={styles.addPhotoTile} onPress={handleAddPhoto}>
                        <Feather name="camera" size={22} color={REVIEW_COLORS.accent} />
                        <Text style={styles.addPhotoTileText}>Add</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </FadeIn>
              ) : null}

              {/* Tags */}
              <FadeIn style={styles.section} delay={220}>
                <View style={styles.sectionLabelRow}>
                  <Text style={styles.sectionLabel}>Tags</Text>
                  {selectedTags.length > 0 ? (
                    <Text style={styles.sectionSub}>{selectedTags.length} selected</Text>
                  ) : null}
                </View>

                {popularTags.length > 0 ? (
                  <View style={styles.tagGroupLabelRow}>
                    <Feather name="trending-up" size={12} color={REVIEW_COLORS.accent} />
                    <Text style={styles.tagGroupLabel}>Popular for this place</Text>
                  </View>
                ) : null}

                <View style={styles.tagRow}>
                  {displayTags.map((tag) => {
                    const isActive = selectedTags.includes(tag);
                    const isPopular = popularTags.includes(tag);
                    return (
                      <Pressable
                        key={tag}
                        style={[
                          styles.tagChip,
                          isActive && styles.tagChipActive,
                          isPopular && !isActive && styles.tagChipPopular,
                        ]}
                        onPress={() => toggleTag(tag)}
                      >
                        <Text style={[styles.tagText, isActive && styles.tagTextActive]}>
                          {tag}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Custom tag input */}
                <View style={styles.customTagRow}>
                  <TextInput
                    value={tagInput}
                    onChangeText={setTagInput}
                    style={styles.customTagInput}
                    placeholder="#your own tag"
                    placeholderTextColor={REVIEW_COLORS.textSecondary}
                    value={customTagInput}
                    onChangeText={setCustomTagInput}
                    onSubmitEditing={handleAddCustomTag}
                    returnKeyType="done"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    style={[
                      styles.customTagButton,
                      !customTagInput.trim() && styles.customTagButtonDisabled,
                    ]}
                    onPress={handleAddCustomTag}
                    disabled={!customTagInput.trim()}
                  >
                    <Text style={styles.customTagButtonText}>Add</Text>
                  </Pressable>
                </View>
              </FadeIn>
            </>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}