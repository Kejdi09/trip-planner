import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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
import { DateOption, MOCK_DATES, VotingTab } from './_types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface CalendarProps {
  selectedStart: Date | null;
  selectedEnd: Date | null;
  onRangeSelect: (start: Date, end: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedStart, selectedEnd, onRangeSelect }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [pendingStart, setPendingStart] = useState<Date | null>(null);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleDayPress = (day: number) => {
    const tapped = new Date(viewYear, viewMonth, day);
    if (!pendingStart) {
      setPendingStart(tapped);
    } else {
      const start = tapped < pendingStart ? tapped : pendingStart;
      const end = tapped < pendingStart ? pendingStart : tapped;
      onRangeSelect(start, end);
      setPendingStart(null);
    }
  };

  const isInRange = (day: number) => {
    if (!selectedStart || !selectedEnd) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d > selectedStart && d < selectedEnd;
  };
  const isStart = (day: number) => {
    if (!selectedStart) return false;
    return new Date(viewYear, viewMonth, day).toDateString() === selectedStart.toDateString();
  };
  const isEnd = (day: number) => {
    if (!selectedEnd) return false;
    return new Date(viewYear, viewMonth, day).toDateString() === selectedEnd.toDateString();
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={calStyles.container}>
      <View style={calStyles.navRow}>
        <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
          <Text style={calStyles.navArrow}>‹</Text>
        </TouchableOpacity>
        <View style={calStyles.monthYearRow}>
          <Text style={calStyles.monthText}>{MONTHS[viewMonth].slice(0, 3)}</Text>
          <Text style={calStyles.yearText}>{viewYear}</Text>
        </View>
        <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
          <Text style={calStyles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={calStyles.weekRow}>
        {DAYS.map((d) => <Text key={d} style={calStyles.weekLabel}>{d}</Text>)}
      </View>
      <View style={calStyles.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={calStyles.cell} />;
          const highlighted = isStart(day) || isEnd(day);
          const inRange = isInRange(day);
          return (
            <TouchableOpacity key={`d-${day}`} style={calStyles.cell} onPress={() => handleDayPress(day)}>
              <View style={[calStyles.dayCircle, inRange && calStyles.rangeDay, highlighted && calStyles.highlightedDay]}>
                <Text style={[calStyles.dayText, highlighted && calStyles.highlightedText, inRange && calStyles.rangeText]}>
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const calStyles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginTop: 8 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 22, color: COLORS.textSecondary, lineHeight: 22 },
  monthYearRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  monthText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  yearText: { fontSize: 15, color: COLORS.textSecondary },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  highlightedDay: { backgroundColor: COLORS.primary },
  rangeDay: { backgroundColor: '#CCFBF1', borderRadius: 0 },
  dayText: { fontSize: 13, color: COLORS.textPrimary },
  highlightedText: { color: '#FFFFFF', fontWeight: '700' },
  rangeText: { color: COLORS.primaryDark },
});

interface DateCardProps { option: DateOption; onVote: (id: string) => void; }
const DateCard: React.FC<DateCardProps> = ({ option, onVote }) => (
  <OptionCard selected={option.selected} onPress={() => onVote(option.id)}>
    <View style={dcStyles.row}>
      <View style={dcStyles.info}>
        <Text style={dcStyles.label}>{option.label}</Text>
        <VotedLabel votedCount={option.votedCount} totalMembers={option.totalMembers} />
        <VoteProgress votedCount={option.votedCount} totalMembers={option.totalMembers} />
        <VoterAvatars voters={option.voters} totalMembers={option.totalMembers} />
      </View>
      <View style={dcStyles.indicator}>
        {option.selected ? <Checkmark /> : <RadioCircle />}
      </View>
    </View>
  </OptionCard>
);
const dcStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  info: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  indicator: { paddingTop: 2 },
});

interface DateVotingScreenProps {
  tripName?: string;
  timeLeft?: string;
  dateOptions?: DateOption[];
  onTabChange?: (tab: VotingTab) => void;
  onBack?: () => void;
}

const DateVotingScreen: React.FC<DateVotingScreenProps> = ({
  tripName = 'Summer Europe Trip',
  timeLeft = '2d left',
  dateOptions: initialOptions = MOCK_DATES,
  onTabChange,
  onBack,
}) => {
  const [options, setOptions] = useState<DateOption[]>(initialOptions);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);

  const handleVote = (id: string) =>
    setOptions((prev) => prev.map((o) => ({ ...o, selected: o.id === id })));

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={tripName} timeLeft={timeLeft} onBack={onBack} />
      <TabBar
        tabs={['Destinations', 'Dates', 'Budget']}
        activeTab="Dates"
        onTabPress={(t) => onTabChange?.(t as VotingTab)}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {options.map((o) => <DateCard key={o.id} option={o} onVote={handleVote} />)}
        <Text style={styles.sectionLabel}>Select another date range</Text>
        <Calendar
          selectedStart={customStart}
          selectedEnd={customEnd}
          onRangeSelect={(s, e) => { setCustomStart(s); setCustomEnd(e); }}
        />
        {customStart && customEnd && (
          <View style={styles.selectedRangeRow}>
            <Text style={styles.selectedRangeText}>
              Selected: {formatDate(customStart)} – {formatDate(customEnd)}
            </Text>
          </View>
        )}
      </ScrollView>
      <AppBottomNav activeTab="Groups" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginTop: 8, marginBottom: 4 },
  selectedRangeRow: { marginTop: 10, padding: 10, backgroundColor: '#F0FDFA', borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary },
  selectedRangeText: { fontSize: 13, color: COLORS.primaryDark, fontWeight: '500' },
});

export default DateVotingScreen;