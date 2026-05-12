import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { VotingTab } from './_types';

import DestinationVotingScreen from './DestinationVotingScreen';
import DateVotingScreen from './DateVotingScreen';
import BudgetVotingScreen from './BudgetVotingScreen';
import BudgetConflictScreen from './BudgetConflictScreen';
import {
  castVote,
  createBudgetOption,
  createDateOption,
  fetchVotingState,
  finalizeVoting,
  VotingStatePayload,
} from '../../../lib/voting-api';

interface VotingScreenProps {
  tripName?: string;
  timeLeft?: string;
  initialTab?: VotingTab;
  onBack?: () => void;
  onFinishVoting?: () => void;
  onEndVoting?: () => void;
}

const VotingScreen: React.FC<VotingScreenProps> = ({
  tripName = 'Summer Europe Trip',
  timeLeft = '2d left',
  initialTab = 'Destinations',
  onBack,
  onFinishVoting,
  onEndVoting,
}) => {
  const params = useLocalSearchParams<{ groupId?: string; userId?: string }>();
  const router = useRouter();
  const groupId = String(params.groupId || '');
  const [userId, setUserId] = useState(String(params.userId || ''));
  const [activeTab, setActiveTab] = useState<VotingTab>(initialTab);
  const [state, setState] = useState<VotingStatePayload | null>(null);

  const loadState = React.useCallback(async () => {
    try {
      const next = await fetchVotingState(groupId, userId);
      setState(next);
    } catch (error) {
      Alert.alert('Voting', error instanceof Error ? error.message : 'Unable to load voting state.');
    }
  }, [groupId, userId]);

  React.useEffect(() => {
    const loadUser = async () => {
      if (userId) return;
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? '');
    };
    void loadUser();
  }, [userId]);

  React.useEffect(() => {
    if (!groupId || !userId) return;
    void loadState();
  }, [groupId, userId, loadState]);

  const handleVote = React.useCallback(async (type: 'destination' | 'date' | 'budget', optionId: string) => {
    try {
      await castVote(type, optionId, groupId, userId);
      await loadState();
    } catch (error) {
      Alert.alert('Vote failed', error instanceof Error ? error.message : 'Unable to submit vote.');
    }
  }, [groupId, userId, loadState]);

  const handleCreateBudgetOption = React.useCallback(async (min: number, max: number) => {
    try {
      await createBudgetOption(groupId, userId, min, max);
      await loadState();
    } catch (error) {
      Alert.alert('Budget option', error instanceof Error ? error.message : 'Unable to create budget option.');
    }
  }, [groupId, userId, loadState]);

  const handleCreateDateOption = React.useCallback(async (start: Date, end: Date) => {
    try {
      const startDate = start.toISOString().slice(0, 10);
      const endDate = end.toISOString().slice(0, 10);
      await createDateOption(groupId, userId, startDate, endDate);
      await loadState();
    } catch (error) {
      Alert.alert('Date option', error instanceof Error ? error.message : 'Unable to create date option.');
    }
  }, [groupId, userId, loadState]);

  const handleFinalize = React.useCallback(async () => {
    try {
      await finalizeVoting(groupId, userId);
      onFinishVoting?.();
      onEndVoting?.();
      if (groupId) {
        router.replace({ pathname: '/itinerary', params: { groupId } });
      } else {
        router.replace('/groups');
      }
    } catch (error) {
      Alert.alert('Finalize voting', error instanceof Error ? error.message : 'Unable to finalize voting.');
    }
  }, [groupId, userId, onFinishVoting, onEndVoting, router]);

  const sharedProps = {
    tripName,
    timeLeft,
    onTabChange: setActiveTab,
    onBack: onBack ?? (() => router.back()),
  };

  const destinationOptions = state?.destinations.options.map((o) => ({
    id: o.id,
    city: o.city,
    country: o.country,
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=120&h=90&fit=crop',
    votedCount: o.votedCount,
    totalMembers: o.totalMembers,
    voters: o.voters.map((v) => ({ id: v.id, initials: v.id.slice(0, 1).toUpperCase(), avatarColor: '#94A3B8' })),
    selected: o.selected,
  })) || [];

  const dateOptions = state?.dates.options.map((o) => ({
    id: o.id,
    label: o.label,
    startDate: new Date(o.startDate),
    endDate: new Date(o.endDate),
    votedCount: o.votedCount,
    totalMembers: o.totalMembers,
    voters: o.voters.map((v) => ({ id: v.id, initials: v.id.slice(0, 1).toUpperCase(), avatarColor: '#94A3B8' })),
    selected: o.selected,
  })) || [];

  const budgetOptions = state?.budget.options.map((o) => ({
    id: o.id,
    label: o.label,
    min: o.min,
    max: o.max,
    votedCount: o.votedCount,
    totalMembers: o.totalMembers,
    voters: o.voters.map((v) => ({ id: v.id, initials: v.id.slice(0, 1).toUpperCase(), avatarColor: '#94A3B8' })),
    selected: o.selected,
  })) || [];

  switch (activeTab) {
    case 'Destinations':
      return <DestinationVotingScreen {...sharedProps} destinations={destinationOptions} onVote={(id) => handleVote('destination', id)} />;

    case 'Dates':
      return <DateVotingScreen {...sharedProps} dateOptions={dateOptions} onVote={(id) => handleVote('date', id)} onCreateDateOption={handleCreateDateOption} />;

    case 'Budget':
      return state?.budget.hasConflict ? (
        <BudgetConflictScreen {...sharedProps} budgetOptions={budgetOptions} onVote={(id) => handleVote('budget', id)} onCreateBudgetOption={handleCreateBudgetOption} onEndVoting={handleFinalize} />
      ) : (
        <BudgetVotingScreen {...sharedProps} budgetOptions={budgetOptions} onVote={(id) => handleVote('budget', id)} onCreateBudgetOption={handleCreateBudgetOption} onFinishVoting={handleFinalize} />
      );

    default:
      return <DestinationVotingScreen {...sharedProps} destinations={destinationOptions} onVote={(id) => handleVote('destination', id)} />;
  }
};

export default VotingScreen;
