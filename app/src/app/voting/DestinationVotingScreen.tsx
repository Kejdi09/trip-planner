import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  COLORS,
  Header,
  TabBar,
  OptionCard,
  Checkmark,
  RadioCircle,
  VotedLabel,
  VoteProgress,
  VoterAvatars,
} from './_components';
import { DestinationOption, MOCK_DESTINATIONS, VotingTab } from './_types';

interface DestinationVotingScreenProps {
  tripName?: string;
  timeLeft?: string;
  destinations?: DestinationOption[];
  onTabChange?: (tab: VotingTab) => void;
  onBack?: () => void;
}

const DestinationVotingScreen: React.FC<DestinationVotingScreenProps> = ({
  tripName = 'Summer Europe Trip',
  timeLeft = '2d left',
  destinations: initialDestinations = MOCK_DESTINATIONS,
  onTabChange,
  onBack,
}) => {
  const [destinations, setDestinations] = useState<DestinationOption[]>(initialDestinations);

  const handleVote = (id: string) => {
    setDestinations((prev) =>
      prev.map((d) => ({ ...d, selected: d.id === id }))
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={tripName} timeLeft={timeLeft} onBack={onBack} />
      <TabBar
        tabs={['Destinations', 'Dates', 'Budget']}
        activeTab="Destinations"
        onTabPress={(t) => onTabChange?.(t as VotingTab)}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {destinations.map((destination) => (
          <OptionCard
            key={destination.id}
            selected={destination.selected}
            onPress={() => handleVote(destination.id)}
          >
            <View style={styles.cardRow}>
              <Image
                source={{ uri: destination.image }}
                style={styles.image}
                resizeMode="cover"
                accessibilityLabel={`${destination.city} photo`}
              />
              <View style={styles.info}>
                <Text style={styles.cityName}>{destination.city}</Text>
                <Text style={styles.countryName}>{destination.country}</Text>
                <VotedLabel
                  votedCount={destination.votedCount}
                  totalMembers={destination.totalMembers}
                />
                <VoteProgress
                  votedCount={destination.votedCount}
                  totalMembers={destination.totalMembers}
                />
                <VoterAvatars
                  voters={destination.voters}
                  totalMembers={destination.totalMembers}
                />
              </View>
              <View style={styles.voteIndicator}>
                {destination.selected ? <Checkmark /> : <RadioCircle />}
              </View>
            </View>
          </OptionCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  image: { width: 72, height: 72, borderRadius: 10, backgroundColor: COLORS.border },
  info: { flex: 1 },
  cityName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  countryName: { fontSize: 13, color: COLORS.textSecondary, marginTop: 1 },
  voteIndicator: { paddingTop: 2 },
});

export default DestinationVotingScreen;