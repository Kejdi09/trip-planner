import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { VotingTab } from './_types';
import DateVotingScreen from './DateVotingScreen';
import BudgetVotingScreen from './BudgetVotingScreen';
import { castVote, createBudgetOption, createDateOption, fetchVotingState, finalizeVoting, VotingStatePayload } from '../../../lib/voting-api';

const VotingScreen: React.FC = () => {
  const params = useLocalSearchParams<{ groupId?: string; userId?: string }>();
  const router = useRouter();
  const groupId = String(params.groupId || '');
  const [userId, setUserId] = useState(String(params.userId || ''));
  const [activeTab, setActiveTab] = useState<VotingTab>('Dates');
  const [state, setState] = useState<VotingStatePayload | null>(null);

  const votingFinished = state?.group.status !== 'planning' || state?.group.isVotingLocked;
  const totalBudgetMin = (state?.budget.options ?? []).reduce((sum, o) => sum + (o.min || 0), 0);
  const totalBudgetMax = (state?.budget.options ?? []).reduce((sum, o) => sum + (o.max || 0), 0);

  const loadState = React.useCallback(async () => {
    try { setState(await fetchVotingState(groupId, userId)); } catch (error) { Alert.alert('Voting', error instanceof Error ? error.message : 'Unable to load voting state.'); }
  }, [groupId, userId]);

  React.useEffect(() => { if (!userId) { void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? '')); } }, [userId]);
  React.useEffect(() => { if (groupId && userId) void loadState(); }, [groupId, userId, loadState]);

  const handleVote = async (type: 'date' | 'budget', optionId: string) => {
    if (votingFinished) return;
    try { await castVote(type, optionId, groupId, userId); await loadState(); } catch (error) { Alert.alert('Vote failed', error instanceof Error ? error.message : 'Unable to submit vote.'); }
  };
  const handleCreateBudgetOption = async (min: number, max: number) => {
    if (votingFinished) return;
    if (min <= 0 || max <= 0 || min > max) { Alert.alert('Budget option', 'Please enter positive amounts and ensure min is less than or equal to max.'); return; }
    try { await createBudgetOption(groupId, userId, min, max); await loadState(); } catch (error) { Alert.alert('Budget option', error instanceof Error ? error.message : 'Unable to create budget option.'); }
  };
  const handleCreateDateOption = async (start: Date, end: Date) => {
    if (votingFinished) return;
    try { await createDateOption(groupId, userId, start.toISOString().slice(0,10), end.toISOString().slice(0,10)); await loadState(); } catch (error) { Alert.alert('Date option', error instanceof Error ? error.message : 'Unable to create date option.'); }
  };
  const handleFinalize = async () => {
    if (votingFinished) return;
    try { await finalizeVoting(groupId, userId); await loadState(); } catch (error) { Alert.alert('Finalize voting', error instanceof Error ? error.message : 'Unable to finalize voting.'); }
  };

  const sharedProps = { tripName: state?.group.id ? 'Group Voting' : 'Voting', timeLeft: votingFinished ? 'Voting has finished' : '2d left', onTabChange: setActiveTab, onBack: () => router.push({ pathname: '/group-hub', params: { groupId } }), votingFinished };

  const dateOptions = state?.dates.options.map((o) => ({ id: o.id, label: o.label, startDate: new Date(o.startDate), endDate: new Date(o.endDate), votedCount: o.votedCount, totalMembers: o.totalMembers, voters: o.voters.map((v) => ({ id: v.id, initials: v.id.slice(0,1).toUpperCase(), avatarColor: '#94A3B8' })), selected: o.selected })) || [];
  const budgetOptions = state?.budget.options.map((o) => ({ id: o.id, label: `€${o.min} - €${o.max}`, min: o.min, max: o.max, votedCount: o.votedCount, totalMembers: o.totalMembers, voters: o.voters.map((v) => ({ id: v.id, initials: v.id.slice(0,1).toUpperCase(), avatarColor: '#94A3B8' })), selected: o.selected })) || [];

  return <View style={{ flex:1 }}>
    {activeTab === 'Budget' ? <BudgetVotingScreen {...sharedProps} budgetOptions={budgetOptions} onVote={(id)=>void handleVote('budget', id)} onCreateBudgetOption={(mn,mx)=>void handleCreateBudgetOption(mn,mx)} totalBudgetMin={totalBudgetMin} totalBudgetMax={totalBudgetMax} /> : <DateVotingScreen {...sharedProps} dateOptions={dateOptions} onVote={(id)=>void handleVote('date', id)} onCreateDateOption={(s,e)=>void handleCreateDateOption(s,e)} />}
    <View style={{ position:'absolute', left:16, right:16, bottom:92 }}><Pressable disabled={Boolean(votingFinished)} onPress={()=>void handleFinalize()} style={{ backgroundColor:'#008D9B', borderRadius:14, paddingVertical:14, alignItems:'center', opacity:votingFinished?0.55:1 }}><Text style={{ color:'#fff', fontWeight:'800', fontSize:16 }}>{votingFinished ? 'Voting Finished' : 'Finish Voting'}</Text></Pressable></View>
  </View>;
};

export default VotingScreen;
