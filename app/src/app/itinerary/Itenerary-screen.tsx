import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  PanResponder,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createItineraryItem, deleteItineraryItem, fetchItinerary, getActiveUserId, updateItineraryItem } from "../../../lib/groups-api";
import { API_BASE_URL, APP_ENV } from "../../../lib/app-config";
import { addDaysToDateOnly, dateOnlyDiff, parseDateOnly } from "../../../lib/date-utils";


type TimeBlock = "morning" | "afternoon" | "evening" | "unscheduled";

type TripPlace = {
  id: string;
  name: string;
  city: string;
  country: string;
  day: number;
  timeBlock: TimeBlock;
  startTime?: string;
  endTime?: string;
  description?: string;
  sortOrder?: number;
  pending?: boolean;
};

type AddPlaceInput = {
  name: string;
  city?: string;
  country?: string;
  day?: number;
  timeBlock?: TimeBlock;
  startTime?: string;
  endTime?: string;
  description?: string;
  sortOrder?: number;
  pending?: boolean;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const INTEREST_OPTIONS = [
  "History",
  "Food",
  "Nature",
  "Beaches",
  "Museums",
  "Nightlife",
  "Shopping",
  "Architecture",
  "Local culture",
  "Adventure",
  "Relaxation",
  "Family friendly",
  "Budget friendly",
];


function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDayDateLabel(startDate: string, dayNumber: number) {
  const dateOnly = addDaysToDateOnly(startDate, dayNumber - 1);
  const date = dateOnly ? parseDateOnly(dateOnly) : null;

  if (!date) {
    return { month: "", day: String(dayNumber) };
  }

  return {
    month: date.toLocaleDateString("en-US", { month: "short" }),
    day: date.getDate().toString(),
  };
}

function clampDay(day: number, totalDays: number) {
  if (!Number.isFinite(day)) return 1;
  return Math.min(Math.max(1, Math.floor(day)), Math.max(1, totalDays));
}

export default function TripDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string }>();
  const groupId = params.groupId ? String(params.groupId) : null;

  useWindowDimensions();

  const currentUserId = React.useMemo(() => getActiveUserId(), []);
  const [tripContext, setTripContext] = useState<any>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const trip = {
    title: tripContext?.groupName ?? '',
    city: tripContext?.destination?.city ?? '',
    country: tripContext?.destination?.country ?? '',
    startDate: tripContext?.dates?.startDate ?? '',
    endDate: tripContext?.dates?.endDate ?? '',
    totalDays: tripContext?.dates?.totalDays ?? 1,
  };

  const goToPreviousDay = useCallback(() => {
    setSelectedDay((current) => Math.max(1, current - 1));
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDay((current) => Math.min(trip.totalDays, current + 1));
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 25 && Math.abs(gesture.dy) < 20;
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -50) {
          goToNextDay();
        }

        if (gesture.dx > 50) {
          goToPreviousDay();
        }
      },
    }),
  ).current;
  const [selectedDay, setSelectedDay] = useState(1);
  const [places, setPlaces] = useState<TripPlace[]>([]);
  const [draggingPlaceId, setDraggingPlaceId] = useState<string | null>(null);
  const dragYRef = useRef<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isInterestsModalVisible, setIsInterestsModalVisible] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [placeName, setPlaceName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    if (!groupId || !currentUserId) { setContextLoading(false); return; }
    const loadContext = async () => {
      try {
        setContextLoading(true); setContextError(null);
        const params = new URLSearchParams({ groupId, userId: currentUserId });
        const response = await fetch(`${API_BASE_URL}/api/itinerary-context?${params.toString()}`, { headers: { 'x-app-env': APP_ENV } });
        const raw = await response.text();
        let payload: any = null;
        try {
          payload = raw ? JSON.parse(raw) : null;
        } catch {
          throw new Error(`Itinerary context request did not return JSON (${response.status}): ${raw.slice(0, 200)}`);
        }
        if (!response.ok) throw new Error(payload?.error?.message ?? `Itinerary context request failed (${response.status})`);
        setTripContext(payload);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unable to load itinerary context';
        setContextError(msg.includes('date range') ? 'Select trip dates in voting before generating an itinerary.' : msg);
      } finally { setContextLoading(false); }
    };
    void loadContext();
  }, [groupId, currentUserId]);

  const loadItineraryItems = useCallback(async () => {
    if (!groupId) return;
    try {
      const { items } = await fetchItinerary(groupId, currentUserId);
      const mapped = items.map((item, index) => ({
        id: item.id,
        name: item.title,
        city: trip.city,
        country: trip.country,
        day: clampDay((dateOnlyDiff(trip.startDate, item.date) ?? 0) + 1, trip.totalDays),
        timeBlock: 'unscheduled' as TimeBlock,
        startTime: item.time ?? undefined,
        description: undefined,
        sortOrder: item.sort_order ?? index,
        pending: false,
      }));
      setPlaces(mapped);
    } catch (error) {
      console.warn('[itinerary] failed to load saved itinerary', error);
    }
  }, [groupId, currentUserId, trip.city, trip.country, trip.startDate, trip.totalDays]);

  React.useEffect(() => {
    void loadItineraryItems();
  }, [loadItineraryItems]);

  const selectedDayPlaces = useMemo(() => {
    return places
      .filter((place) => place.day === selectedDay)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [places, selectedDay]);

  const getNextSortOrderForDay = useCallback((day: number) => {
    const dayPlaces = places.filter((place) => place.day === day);
    if (dayPlaces.length === 0) return 0;
    return Math.max(...dayPlaces.map((place) => place.sortOrder ?? 0)) + 1;
  }, [places]);

  const persistDayOrder = useCallback((orderedPlaces: TripPlace[]) => {
    if (!groupId) return;
    orderedPlaces.forEach((place, index) => {
      if (!UUID_RE.test(place.id)) return;
      void updateItineraryItem(groupId, place.id, { sortOrder: index }, currentUserId).catch((error) => {
        console.warn('[itinerary] failed to persist item order', error);
      });
    });
  }, [groupId, currentUserId]);

  const movePlaceWithinDay = useCallback((placeId: string, direction: -1 | 1) => {
    const ordered = places
      .filter((place) => place.day === selectedDay)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const index = ordered.findIndex((place) => place.id === placeId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;

    const reordered = [...ordered];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);
    const orderById = new Map(reordered.map((place, sortOrder) => [place.id, sortOrder]));

    setPlaces((current) => current.map((place) => (
      orderById.has(place.id) ? { ...place, sortOrder: orderById.get(place.id) } : place
    )));
    persistDayOrder(reordered);
  }, [places, selectedDay, persistDayOrder]);

  const handleDragMove = useCallback((placeId: string, pageY?: number) => {
    if (draggingPlaceId !== placeId || typeof pageY !== 'number') return;
    if (dragYRef.current === null) {
      dragYRef.current = pageY;
      return;
    }

    const delta = pageY - dragYRef.current;
    if (delta > 74) {
      movePlaceWithinDay(placeId, 1);
      dragYRef.current = pageY;
    } else if (delta < -74) {
      movePlaceWithinDay(placeId, -1);
      dragYRef.current = pageY;
    }
  }, [draggingPlaceId, movePlaceWithinDay]);

  const stopDraggingPlace = useCallback(() => {
    setDraggingPlaceId(null);
    dragYRef.current = null;
  }, []);

  const addPlaceToItinerary = useCallback(
    async (input: AddPlaceInput) => {
      const cleanedName = input.name.trim();

      if (!cleanedName) {
        Alert.alert("Missing place", "Please enter the name of a place.");
        return null;
      }

      const day = clampDay(input.day ?? selectedDay, trip.totalDays);
      const sortOrder = input.day ? getNextSortOrderForDay(day) : getNextSortOrderForDay(selectedDay);
      const localId = createId();
      const newPlace: TripPlace = {
        id: localId,
        name: cleanedName,
        city: input.city ?? trip.city,
        country: input.country ?? trip.country,
        day,
        timeBlock: input.timeBlock ?? "unscheduled",
        startTime: input.startTime,
        endTime: input.endTime,
        description: input.description,
        sortOrder,
        pending: Boolean(groupId && trip.startDate),
      };

      setPlaces((current) => [...current, newPlace]);

      if (groupId && trip.startDate) {
        const date = addDaysToDateOnly(trip.startDate, newPlace.day - 1);
        if (date) {
          try {
            const saved = await createItineraryItem(groupId, newPlace.name, date, newPlace.startTime ?? null, currentUserId, sortOrder);
            setPlaces((current) => current.map((place) => (
              place.id === localId
                ? { ...place, id: saved.id, sortOrder: saved.sort_order ?? sortOrder, pending: false }
                : place
            )));
            return saved.id;
          } catch (error) {
            setPlaces((current) => current.filter((place) => place.id !== localId));
            Alert.alert("Could not save place", error instanceof Error ? error.message : "Please try again.");
            return null;
          }
        }
      }

      return localId;
    },
    [groupId, selectedDay, trip.city, trip.country, trip.startDate, trip.totalDays, currentUserId, getNextSortOrderForDay],
  );


  const removePlaceFromItinerary = useCallback(async (placeId: string) => {
    const previous = places;
    setPlaces((current) => current.filter((place) => place.id !== placeId));

    if (!groupId || !UUID_RE.test(placeId)) {
      return;
    }

    try {
      await deleteItineraryItem(groupId, placeId, currentUserId);
    } catch (error) {
      setPlaces(previous);
      Alert.alert("Could not delete place", error instanceof Error ? error.message : "Please try again.");
    }
  }, [groupId, currentUserId, places]);

  const handleConfirmAddPlace = () => {
    const cleanedName = placeName.trim();

    if (!cleanedName) {
      Alert.alert("Missing place", "Please enter the name of a place.");
      return;
    }

    setIsModalVisible(false);
    setPlaceName("");

    void addPlaceToItinerary({
      name: cleanedName,
      day: selectedDay,
      timeBlock: "unscheduled",
    });
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    );
  };

  const openInterestsModal = () => {
    if (!trip.startDate || !trip.endDate) {
      Alert.alert("Missing dates", "Select trip dates in voting before generating an itinerary.");
      return;
    }
    setIsInterestsModalVisible(true);
  };

  const generateItineraryFromAI = async (interests: string[]) => {
    try {
      setIsGenerating(true);

      const response = await fetch(
        `${API_BASE_URL}/api/generate-itinerary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupId,
            userId: currentUserId,
            interests,
          }),
        },
      );

      const rawBody = await response.text();
      let itinerary: any = null;
      try {
        itinerary = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        throw new Error(`AI itinerary returned an invalid response (${response.status}).`);
      }

      if (!response.ok) {
        const apiMessage = itinerary?.error?.message || itinerary?.message || "Failed to generate itinerary";
        throw new Error(apiMessage);
      }
      console.log("AI itinerary:", itinerary);

      const aiPlaces: AddPlaceInput[] = [];
      const destinationText = String(itinerary.destination || "");
      const [destCity, destCountry] = destinationText.split(",").map((part: string) => part.trim());

      console.log("AI itinerary response:", JSON.stringify(itinerary, null, 2));

      const days = Array.isArray(itinerary.days) ? itinerary.days : [];

      days.forEach((day: any, index: number) => {
        const dayNumber = clampDay(Number(day.day ?? index + 1), trip.totalDays);

        const placesForDay =
          day.places || day.items || day.activities || day.schedule || [];

        if (!Array.isArray(placesForDay)) return;

        placesForDay.forEach((place: any) => {
          const name = place.name || place.place || place.title;

          if (!name) return;

          aiPlaces.push({
            name,
            city: destCity || trip.city,
            country: destCountry || trip.country,
            day: dayNumber,
            timeBlock: place.timeBlock ?? place.period ?? "unscheduled",
            startTime: place.startTime ?? place.time,
            endTime: place.endTime,
            description: place.description ?? place.notes ?? "",
          });
        });
      });

      console.log("AI places parsed:", aiPlaces);

      if (aiPlaces.length === 0) {
        Alert.alert(
          "AI returned no places",
          "The itinerary response did not contain usable places.",
        );
        return;
      }

      const existingNames = new Set(places.map((place) => place.name.trim().toLowerCase()));
      const uniquePlaces = aiPlaces.filter((place) => {
        const key = place.name.trim().toLowerCase();
        if (!key || existingNames.has(key)) return false;
        existingNames.add(key);
        return true;
      });

      if (uniquePlaces.length === 0) {
        Alert.alert("No new places", "The AI suggestions were duplicates of places already in this itinerary.");
        return;
      }

      if (groupId && trip.startDate) {
        const nextSortOrderByDay = new Map<number, number>();
        for (const place of uniquePlaces) {
          const day = clampDay(place.day || 1, trip.totalDays);
          const date = addDaysToDateOnly(trip.startDate, day - 1);
          if (!date) continue;
          const sortOrder = nextSortOrderByDay.get(day) ?? getNextSortOrderForDay(day);
          await createItineraryItem(groupId, place.name, date, place.startTime ?? null, currentUserId, sortOrder);
          nextSortOrderByDay.set(day, sortOrder + 1);
        }
        await loadItineraryItems();
      } else {
        setPlaces((current) => [...current, ...uniquePlaces.map((place, index) => ({
          id: createId(),
          name: place.name,
          city: place.city || trip.city,
          country: place.country || trip.country,
          day: clampDay(place.day || 1, trip.totalDays),
          timeBlock: place.timeBlock || "unscheduled",
          startTime: place.startTime,
          endTime: place.endTime,
          description: place.description,
          sortOrder: index,
        }))]);
      }
      setSelectedDay(clampDay(uniquePlaces[0].day ?? 1, trip.totalDays));
    } catch (error) {
      Alert.alert("AI error", error instanceof Error ? error.message : "Could not generate itinerary.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (contextLoading) { return <SafeAreaView style={styles.safeArea}><View style={styles.screen}><Text style={{ padding: 24 }}>Loading trip context...</Text></View></SafeAreaView>; }

  if (contextError) { return <SafeAreaView style={styles.safeArea}><View style={styles.screen}><Text style={{ padding: 24, color: "#BE123C" }}>{contextError}</Text></View></SafeAreaView>; }

  const renderDayTabs = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayTabsScroll}
        contentContainerStyle={styles.dayTabs}
      >
        {Array.from({ length: trip.totalDays }).map((_, index) => {
          const dayNumber = index + 1;
          const dateLabel = getDayDateLabel(trip.startDate, dayNumber);
          const isActive = selectedDay === dayNumber;

          return (
            <Pressable
              key={dayNumber}
              onPress={() => setSelectedDay(dayNumber)}
              style={[styles.dayTab, isActive && styles.dayTabActive]}
            >
              <Text
                style={[
                  styles.dayTabTitle,
                  isActive && styles.dayTabTitleActive,
                ]}
              >
                Day
              </Text>
              <Text
                style={[
                  styles.dayTabNumber,
                  isActive && styles.dayTabTitleActive,
                ]}
              >
                {dayNumber}
              </Text>
              <Text
                style={[
                  styles.dayTabDate,
                  isActive && styles.dayTabTitleActive,
                ]}
              >
                {dateLabel.month}
              </Text>
              <Text
                style={[
                  styles.dayTabDate,
                  isActive && styles.dayTabTitleActive,
                ]}
              >
                {dateLabel.day}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  };

  const renderPlaceCard = (place: TripPlace) => {
    const orderedIndex = selectedDayPlaces.findIndex((item) => item.id === place.id);
    const canMoveUp = orderedIndex > 0;
    const canMoveDown = orderedIndex >= 0 && orderedIndex < selectedDayPlaces.length - 1;

    return (
      <Pressable
        key={place.id}
        delayLongPress={260}
        onLongPress={(event) => {
          setDraggingPlaceId(place.id);
          dragYRef.current = event.nativeEvent.pageY;
        }}
        onTouchMove={(event) => handleDragMove(place.id, event.nativeEvent.pageY)}
        onTouchEnd={stopDraggingPlace}
        onTouchCancel={stopDraggingPlace}
        style={[
          styles.placeCard,
          place.pending && styles.placeCardPending,
          draggingPlaceId === place.id && styles.placeCardDragging,
        ]}
      >
        <View style={styles.placeIconWrap}>
          <Feather name="map-pin" size={22} color="#008D9B" />
        </View>

        <View style={styles.placeInfo}>
          <Text style={styles.placeName} numberOfLines={2}>
            {place.name}
          </Text>

          {place.startTime && place.endTime ? (
            <Text style={styles.placeTime}>
              {place.startTime} - {place.endTime}
            </Text>
          ) : (
            <Text style={styles.placeTime}>{place.pending ? 'Saving...' : ''}</Text>
          )}

          {!!place.description && (
            <Text style={styles.placeDescription} numberOfLines={3}>
              {place.description}
            </Text>
          )}
        </View>

        <View style={styles.placeActions}>
          <Pressable
            style={[styles.reorderButton, !canMoveUp && styles.reorderButtonDisabled]}
            onPress={() => canMoveUp && movePlaceWithinDay(place.id, -1)}
            disabled={!canMoveUp}
          >
            <Feather name="chevron-up" size={15} color={canMoveUp ? '#008D9B' : '#B8C0C5'} />
          </Pressable>
          <Pressable
            style={[styles.reorderButton, !canMoveDown && styles.reorderButtonDisabled]}
            onPress={() => canMoveDown && movePlaceWithinDay(place.id, 1)}
            disabled={!canMoveDown}
          >
            <Feather name="chevron-down" size={15} color={canMoveDown ? '#008D9B' : '#B8C0C5'} />
          </Pressable>
          <Pressable
            style={styles.removePlaceButton}
            onPress={() => void removePlaceFromItinerary(place.id)}
          >
            <Feather name="x" size={16} color="#F15474" />
          </Pressable>
        </View>
      </Pressable>
    );
  };


  const renderEmptyItinerary = () => {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Feather name="map-pin" size={24} color="#008D9B" />
        </View>
        <Text style={styles.emptyTitle}>No places added yet</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.phoneFrame}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.replace({ pathname: '/group-hub', params: groupId ? { groupId } : undefined })}>
            <Feather name="arrow-left" size={23} color="#111827" />
          </Pressable>

          <View style={styles.headerTextWrap}>
            <Text style={styles.tripTitle}>{trip.title}</Text>
            <Text style={styles.tripLocation}>
              {trip.city}, {trip.country}
            </Text>
          </View>

          <Pressable style={styles.chatButton}>
            <Feather name="message-circle" size={20} color="#008D9B" />
          </Pressable>
        </View>


        {renderDayTabs()}

        <View style={styles.tabIndicatorTrack}>
          <View
            style={[
              styles.tabIndicator,
              { width: `${(selectedDay / trip.totalDays) * 100}%` },
            ]}
          />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
          {...panResponder.panHandlers}
        >
          <View style={styles.timelineRow}>
            <View style={styles.timeline}>
              <View style={styles.timelineDotMorning} />
              <View style={styles.timelineLine} />
              <View style={styles.timelineDotAfternoon} />
              <View style={styles.timelineLine} />
              <View style={styles.timelineDotEvening} />
            </View>

            <View style={styles.itineraryContent}>
              <Text style={styles.sectionLabel}>
                PLACES FOR DAY {selectedDay}
              </Text>

              {selectedDayPlaces.length === 0
                ? renderEmptyItinerary()
                : selectedDayPlaces.map(renderPlaceCard)}

              <Pressable
                style={styles.addPlaceButton}
                onPress={() => setIsModalVisible(true)}
              >
                <Feather name="plus" size={16} color="#111827" />
                <Text style={styles.addPlaceButtonText}>Add Place</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={styles.aiSuggestion}>
          <View style={styles.aiHeader}>
            <Feather name="star" size={25} color="#111827" />
            <View>
              <Text style={styles.aiTitle}>AI Suggestion</Text>
              <Text style={styles.aiSubtitle}>
                AI-generated places will appear here later.
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.aiButton}
            onPress={openInterestsModal}
            disabled={isGenerating}
          >
            <Text style={styles.aiButtonText}>
              {isGenerating ? "Generating..." : "Generate AI Itinerary"}
            </Text>
          </Pressable>
        </View>

      </View>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Feather name="map-pin" size={22} color="#008D9B" />
            </View>

            <Text style={styles.modalTitle}>Add place</Text>
            <Text style={styles.modalSubtitle}>
              Enter the name of the place you want to add.
            </Text>

            <TextInput
              value={placeName}
              onChangeText={setPlaceName}
              placeholder="Example: Park Güell"
              placeholderTextColor="#9CA3AF"
              autoFocus
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setPlaceName("");
                  setIsModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.confirmButton}
                onPress={handleConfirmAddPlace}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isInterestsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isGenerating && setIsInterestsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Feather name="sliders" size={22} color="#008D9B" />
            </View>

            <Text style={styles.modalTitle}>What are you into?</Text>
            <Text style={styles.modalSubtitle}>
              Pick a few interests so the AI can tailor your trip.
            </Text>

            <View style={styles.interestGrid}>
              {INTEREST_OPTIONS.map((interest) => {
                const selected = selectedInterests.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    style={[styles.interestChip, selected && styles.interestChipSelected]}
                    onPress={() => toggleInterest(interest)}
                    disabled={isGenerating}
                  >
                    <Text style={[styles.interestChipText, selected && styles.interestChipTextSelected]}>
                      {interest}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                disabled={isGenerating}
                onPress={() => setIsInterestsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.confirmButton, isGenerating && styles.confirmButtonDisabled]}
                disabled={isGenerating}
                onPress={() => {
                  setIsInterestsModalVisible(false);
                  void generateItineraryFromAI(selectedInterests);
                }}
              >
                <Text style={styles.confirmButtonText}>{isGenerating ? "Generating..." : "Generate"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  dayTabsScroll: {
    flexGrow: 0,
    height: 86,
    maxHeight: 86,
  },
  phoneFrame: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  removePlaceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFE3E8",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 23,
  },
  tripLocation: {
    marginTop: 3,
    fontSize: 12,
    color: "#7C8790",
    fontWeight: "600",
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E7FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  brandRow: {
    paddingHorizontal: 28,
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  brandBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#008D9B",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#F5F7F8",
  },
  dateText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
  },
  groupRow: {
    paddingHorizontal: 28,
    marginTop: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginRight: -7,
  },
  avatarOne: {
    backgroundColor: "#D8C2A4",
  },
  avatarTwo: {
    backgroundColor: "#5FB9AD",
  },
  avatarThree: {
    backgroundColor: "#406A9A",
  },
  moreAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EEF2F3",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  moreAvatarText: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "800",
  },
  leaveButton: {
    backgroundColor: "#FFE3E8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  leaveButtonText: {
    color: "#F15474",
    fontSize: 12,
    fontWeight: "800",
  },
  dayTabs: {
    paddingHorizontal: 22,
    gap: 10,
  },
  dayTab: {
    width: 63,
    height: 76,
    borderRadius: 14,
    backgroundColor: "#EAF1F4",
    alignItems: "center",
    justifyContent: "center",
  },
  dayTabActive: {
    backgroundColor: "#008D9B",
  },
  dayTabTitle: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "800",
  },
  dayTabNumber: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "800",
  },
  dayTabDate: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "700",
  },
  dayTabTitleActive: {
    color: "#FFFFFF",
  },
  tabIndicatorTrack: {
    height: 8,
    marginTop: 10,
    marginHorizontal: 24,
    backgroundColor: "#D8DEE2",
    borderRadius: 999,
  },
  tabIndicator: {
    width: "54%",
    height: 8,
    backgroundColor: "#8A8F94",
    borderRadius: 999,
  },
  content: {
    flex: 1,
    marginTop: 8,
  },
  contentInner: {
    paddingHorizontal: 22,
    paddingBottom: 190,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 14,
  },
  timeline: {
    width: 12,
    alignItems: "center",
    paddingTop: 8,
  },
  timelineLine: {
    width: 2,
    height: 98,
    backgroundColor: "#DCE3E6",
  },
  timelineDotMorning: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#43CFA4",
  },
  timelineDotAfternoon: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#008D9B",
  },
  timelineDotEvening: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#D47A53",
  },
  itineraryContent: {
    flex: 1,
  },
  sectionLabel: {
    color: "#008D9B",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  emptyState: {
    backgroundColor: "#F7FAFB",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3EAED",
    padding: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E7FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },
  emptySubtitle: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "600",
  },
  placeCard: {
    minHeight: 92,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE5E8",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  placeCardPending: {
    opacity: 0.65,
  },
  placeCardDragging: {
    borderColor: "#008D9B",
    backgroundColor: "#F3FCFD",
    transform: [{ scale: 1.01 }],
  },
  placeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E7FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
    lineHeight: 18,
  },
  placeTime: {
    marginTop: 5,
    fontSize: 12,
    color: "#7C8790",
    fontWeight: "700",
  },
  placeDescription: {
    marginTop: 5,
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  placeStatusDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#CBEFF2",
    marginLeft: 8,
  },
  placeActions: {
    marginLeft: 8,
    alignItems: "center",
    gap: 5,
  },
  reorderButton: {
    width: 28,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E7FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  reorderButtonDisabled: {
    backgroundColor: "#F1F4F5",
  },
  addPlaceButton: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCE5E8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  addPlaceButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },
  aiSuggestion: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 72,
    backgroundColor: "#F3FAFB",
    borderTopWidth: 1,
    borderTopColor: "#DAE8EB",
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 12,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  aiTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111827",
  },
  aiSubtitle: {
    marginTop: 1,
    fontSize: 12,
    color: "#60707A",
    fontWeight: "700",
  },
  aiButton: {
    height: 48,
    borderRadius: 15,
    backgroundColor: "#008D9B",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 11,
  },
  aiButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  modalCard: {
    width: "100%",
    maxWidth: 370,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 22,
    alignItems: "center",
  },
  modalIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#E7FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },
  modalSubtitle: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    height: 52,
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCE5E8",
    backgroundColor: "#F7FAFB",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#111827",
    fontWeight: "700",
  },
  modalActions: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#EEF2F3",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "900",
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#008D9B",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.65,
  },
  interestGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#EEF2F3",
    borderWidth: 1,
    borderColor: "#DCE5E8",
  },
  interestChipSelected: {
    backgroundColor: "#008D9B",
    borderColor: "#008D9B",
  },
  interestChipText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "800",
  },
  interestChipTextSelected: {
    color: "#FFFFFF",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
