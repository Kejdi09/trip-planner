import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  StyleSheet,
  SafeAreaView,
  LayoutChangeEvent,
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
import { BudgetOption, MOCK_BUDGETS, VotingTab } from './_types';

const SLIDER_MIN = 0;
const SLIDER_MAX = 20000;

interface RangeSliderProps { min: number; max: number; onChange: (min: number, max: number) => void; }

const RangeSlider: React.FC<RangeSliderProps> = ({ min, max, onChange }) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const toPercent = (val: number) => ((val - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
  const toValue = (px: number) => Math.round(Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, (px / trackWidth) * (SLIDER_MAX - SLIDER_MIN) + SLIDER_MIN)) / 100) * 100;
  const leftPct = toPercent(min);
  const rightPct = toPercent(max);

  const makeResponder = (thumb: 'min' | 'max') => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      if (!trackWidth) return;
      const pct = (thumb === 'min' ? leftPct : rightPct) / 100;
      const newVal = toValue(pct * trackWidth + gs.dx);
      thumb === 'min' ? onChange(Math.min(newVal, max - 100), max) : onChange(min, Math.max(newVal, min + 100));
    },
  });

  const minR = makeResponder('min');
  const maxR = makeResponder('max');

  return (
    <View style={sl.wrapper}>
      <View style={sl.labelRow}>
        <Text style={sl.label}>Budget</Text>
        <Text style={sl.label}>$0-20000+</Text>
      </View>
      <View style={sl.track} onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}>
        <View style={[sl.seg, sl.inactive, { left: 0, width: `${leftPct}%` as any }]} />
        <View style={[sl.seg, sl.active, { left: `${leftPct}%` as any, width: `${rightPct - leftPct}%` as any }]} />
        <View style={[sl.seg, sl.inactive, { left: `${rightPct}%` as any, right: 0 }]} />
        <View {...minR.panHandlers} style={[sl.thumb, { left: `${leftPct}%` as any }]} />
        <View {...maxR.panHandlers} style={[sl.thumb, { left: `${rightPct}%` as any }]} />
      </View>
    </View>
  );
};

const sl = StyleSheet.create({
  wrapper: { marginTop: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 12, color: COLORS.textSecondary },
  track: { height: 4, backgroundColor: COLORS.progressBg, borderRadius: 2, position: 'relative', marginHorizontal: 12 },
  seg: { position: 'absolute', top: 0, height: 4, borderRadius: 2 },
  inactive: { backgroundColor: COLORS.progressBg },
  active: { backgroundColor: COLORS.primary },
  thumb: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.textPrimary, top: -8, marginLeft: -10, elevation: 3 },
});

interface BudgetCardProps { option: BudgetOption; onVote: (id: string) => void; }
const BudgetCard: React.FC<BudgetCardProps> = ({ option, onVote }) => (
  <OptionCard selected={option.selected} onPress={() => onVote(option.id)}>
    <View style={bc.row}>
      <View style={bc.info}>
        <Text style={bc.label}>{option.label}</Text>
        <VotedLabel votedCount={option.votedCount} totalMembers={option.totalMembers} />
        <VoteProgress votedCount={option.votedCount} totalMembers={option.totalMembers} />
        <VoterAvatars voters={option.voters} totalMembers={option.totalMembers} />
      </View>
      <View style={bc.indicator}>{option.selected ? <Checkmark /> : <RadioCircle />}</View>
    </View>
  </OptionCard>
);
const bc = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  info: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  indicator: { paddingTop: 2 },
});

interface BudgetVotingScreenProps {
  tripName?: string; timeLeft?: string; budgetOptions?: BudgetOption[];
  onTabChange?: (tab: VotingTab) => void; onBack?: () => void; onFinishVoting?: () => void;
}

const BudgetVotingScreen: React.FC<BudgetVotingScreenProps> = ({
  tripName = 'Summer Europe Trip', timeLeft = '2d left',
  budgetOptions: initialOptions = MOCK_BUDGETS, onTabChange, onBack, onFinishVoting,
}) => {
  const [options, setOptions] = useState<BudgetOption[]>(initialOptions);
  const [customMin, setCustomMin] = useState(0);
  const [customMax, setCustomMax] = useState(20000);

  const handleVote = (id: string) =>
    setOptions((prev) => prev.map((o) => ({ ...o, selected: o.id === id })));

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={tripName} timeLeft={timeLeft} onBack={onBack} />
      <TabBar tabs={['Destinations', 'Dates', 'Budget']} activeTab="Budget" onTabPress={(t) => onTabChange?.(t as VotingTab)} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {options.map((o) => <BudgetCard key={o.id} option={o} onVote={handleVote} />)}
        <Text style={styles.sectionLabel}>Select another budget range</Text>
        <RangeSlider min={customMin} max={customMax} onChange={(mn, mx) => { setCustomMin(mn); setCustomMax(mx); }} />
        <TouchableOpacity style={styles.btn} onPress={onFinishVoting} activeOpacity={0.85}>
          <Text style={styles.btnText}>Finish Voting</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginTop: 8, marginBottom: 4 },
  btn: { marginTop: 24, backgroundColor: COLORS.buttonBg, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: COLORS.buttonText, fontSize: 16, fontWeight: '700' },
});

export default BudgetVotingScreen;