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

import { BrandHeader } from "@/components/ui/brand-header";
import { createItineraryItem, deleteItineraryItem, fetchItinerary, getActiveUserId } from "../../../lib/groups-api";

const AI_API_BASE_URL =
  process.env.EXPO_PUBLIC_AI_API_URL ?? "http://localhost:3000";

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
};

const trip = {
  title: "Summer Europe Trip",
  city: "Barcelona",
  country: "Spain",
  startDate: "2026-06-15",
  endDate: "2026-06-25",
  totalDays: 5,
};

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDayDateLabel(startDate: string, dayNumber: number) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayNumber - 1);

  return {
    month: date.toLocaleDateString("en-US", { month: "short" }),
    day: date.getDate().toString(),
  };
}

export default function TripDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string }>();
  const groupId = params.groupId ? String(params.groupId) : null;

  useWindowDimensions();

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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [placeName, setPlaceName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    if (!groupId) return;
    const load = async () => {
      try {
        const { items } = await fetchItinerary(groupId, getActiveUserId());
        setPlaces(items.map((item) => ({
          id: item.id,
          name: item.title,
          city: trip.city,
          country: trip.country,
          day: Math.max(1, Math.floor((new Date(item.date).getTime() - new Date(trip.startDate).getTime()) / 86400000) + 1),
          timeBlock: 'unscheduled',
          startTime: item.time ?? undefined,
          description: undefined,
        })));
      } catch {
        // ignore for local fallback mode
      }
    };
    void load();
  }, [groupId]);

  const selectedDayPlaces = useMemo(() => {
    return places.filter((place) => place.day === selectedDay);
  }, [places, selectedDay]);

  const addPlaceToItinerary = useCallback(
    (input: AddPlaceInput) => {
      const cleanedName = input.name.trim();

      if (!cleanedName) {
        Alert.alert("Missing place", "Please enter the name of a place.");
        return null;
      }

      const newPlace: TripPlace = {
        id: createId(),
        name: cleanedName,
        city: input.city ?? trip.city,
        country: input.country ?? trip.country,
        day: input.day ?? selectedDay,
        timeBlock: input.timeBlock ?? "unscheduled",
        startTime: input.startTime,
        endTime: input.endTime,
        description: input.description,
      };

      setPlaces((current) => [...current, newPlace]);

      if (groupId) {
        const dayDate = new Date(trip.startDate);
        dayDate.setDate(dayDate.getDate() + (newPlace.day - 1));
        const date = dayDate.toISOString().slice(0, 10);
        void createItineraryItem(groupId, newPlace.name, date, newPlace.startTime ?? null, getActiveUserId());
      }

      return newPlace.id;
    },
    [groupId, selectedDay],
  );

  const removePlaceFromItinerary = useCallback((placeId: string) => {
    setPlaces((current) => current.filter((place) => place.id !== placeId));
    if (groupId) {
      void deleteItineraryItem(groupId, placeId, getActiveUserId());
    }
  }, [groupId]);

  const addPlacesFromAI = useCallback(
    (aiPlaces: AddPlaceInput[]) => {
      aiPlaces.forEach((place) => {
        addPlaceToItinerary(place);
      });
    },
    [addPlaceToItinerary],
  );

  const handleConfirmAddPlace = () => {
    const cleanedName = placeName.trim();

    if (!cleanedName) {
      Alert.alert("Missing place", "Please enter the name of a place.");
      return;
    }

    setIsModalVisible(false);
    setPlaceName("");

    addPlaceToItinerary({
      name: cleanedName,
      day: selectedDay,
      timeBlock: "unscheduled",
    });
  };

  const generateItineraryFromAI = async () => {
    try {
      setIsGenerating(true);

      const response = await fetch(
        `${AI_API_BASE_URL}/api/generate-itinerary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to generate itinerary");
      }

      const itinerary = await response.json();
      console.log("AI itinerary:", itinerary);

      const aiPlaces: AddPlaceInput[] = [];
      const destinationText = String(itinerary.destination || "");
      const [destCity, destCountry] = destinationText.split(",").map((part: string) => part.trim());

      console.log("AI itinerary response:", JSON.stringify(itinerary, null, 2));

      const days = Array.isArray(itinerary.days) ? itinerary.days : [];

      days.forEach((day: any, index: number) => {
        const dayNumber = Number(day.day ?? index + 1);

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

      console.log("AI places parsed:", aiPlaces);
      addPlacesFromAI(aiPlaces);
      setSelectedDay(aiPlaces[0].day ?? 1);
    } catch {
      Alert.alert("AI error", "Could not generate itinerary.");
    } finally {
      setIsGenerating(false);
    }
  };

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
    return (
      <View key={place.id} style={styles.placeCard}>
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
            <Text style={styles.placeTime}></Text>
          )}

          {!!place.description && (
            <Text style={styles.placeDescription} numberOfLines={2}>
              {place.description}
            </Text>
          )}
        </View>

        <Pressable
          style={styles.removePlaceButton}
          onPress={() => removePlaceFromItinerary(place.id)}
        >
          <Feather name="x" size={16} color="#F15474" />
        </Pressable>
      </View>
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

        <View style={styles.brandRow}>
          <BrandHeader
            brandName="TripSync"
            containerStyle={styles.brandHeader}
            badgeStyle={styles.brandBadge}
            brandTextStyle={styles.brandText}
          />

          <View style={styles.datePill}>
            <Text style={styles.dateText}>Jun 15-25, 2026</Text>
          </View>
        </View>

        <View style={styles.groupRow}>
          <View style={styles.avatarStack}>
            <View style={[styles.avatar, styles.avatarOne]} />
            <View style={[styles.avatar, styles.avatarTwo]} />
            <View style={[styles.avatar, styles.avatarThree]} />
            <View style={styles.moreAvatar}>
              <Text style={styles.moreAvatarText}>+1</Text>
            </View>
          </View>

          <Pressable style={styles.leaveButton}>
            <Text style={styles.leaveButtonText}>Leave group</Text>
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
            onPress={generateItineraryFromAI}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
