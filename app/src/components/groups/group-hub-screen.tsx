import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deleteGroupApi, fetchMyGroups, getActiveUserId, leaveGroupApi } from '../../../lib/groups-api';
import { supabase } from '../../../lib/supabase';
import { AppLoading } from '@/components/common/AppLoading';

export function GroupHubScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const [groupName, setGroupName] = React.useState('Your Group');
  const [isCreator, setIsCreator] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState(getActiveUserId());
  const [loading, setLoading] = React.useState(true);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [leaveModalVisible, setLeaveModalVisible] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);
  const [leaveError, setLeaveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!groupId) return;
    (async () => {
      try {
        const { groups } = await fetchMyGroups();
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id ?? getActiveUserId();
        setCurrentUserId(uid);
        const match = groups.find((g) => g.id === groupId);
        if (match?.name) setGroupName(match.name);
        setIsCreator(Boolean(match?.created_by && match.created_by === uid));
        if (groupId) {
          const { data: readRow } = await supabase.from('group_chat_reads').select('last_read_at').eq('group_id', groupId).eq('user_id', uid).maybeSingle();
          let q = supabase.from('messages').select('id', { count: 'exact', head: true }).eq('group_id', groupId).neq('sender_id', uid);
          if (readRow?.last_read_at) q = q.gt('created_at', readRow.last_read_at);
          const { count } = await q;
          setUnreadCount(count ?? 0);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [groupId]);

  const routeParams = groupId ? { groupId } : undefined;

  const handleConfirmLeave = async () => {
    if (!groupId || !currentUserId || isLeaving) return;
    setIsLeaving(true);
    setLeaveError(null);
    try {
      if (isCreator) {
        await deleteGroupApi(groupId, currentUserId);
      } else {
        await leaveGroupApi(groupId, currentUserId);
      }
      setLeaveModalVisible(false);
      router.replace('/groups');
    } catch (error) {
      setLeaveError(error instanceof Error ? error.message : 'Unable to leave this group right now.');
    } finally {
      setIsLeaving(false);
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.safeArea}><AppLoading message="Loading group details..." /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/groups')}>
          <Feather name="arrow-left" size={20} color="#0F172A" />
        </Pressable>
        <Pressable style={[styles.leavePill, isCreator && styles.leavePillAdmin]} onPress={() => setLeaveModalVisible(true)}>
          <Text style={[styles.leavePillText, isCreator && styles.leavePillTextAdmin]}>Leave Group</Text>
        </Pressable>
        </View>
        <Text style={styles.title}>{groupName}</Text>
        <Text style={styles.subtitle}>Choose what your group wants to do</Text>

        <View style={styles.grid}>
          <Pressable style={styles.card} onPress={() => router.push({ pathname: '/group-chat', params: routeParams })}>
            <Ionicons name="chatbubbles-outline" size={30} color="#008D9B" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={styles.cardTitle}>Chat</Text>{unreadCount > 0 ? <View style={{ backgroundColor: '#EF4444', borderRadius: 999, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View> : null}</View>
            <Text style={styles.cardSub}>Talk with your group</Text>
          </Pressable>

          <Pressable style={styles.card} onPress={() => router.push({ pathname: '/voting', params: routeParams })}>
            <MaterialCommunityIcons name="vote-outline" size={30} color="#008D9B" />
            <Text style={styles.cardTitle}>Vote</Text>
            <Text style={styles.cardSub}>Choose destination, dates, budget</Text>
          </Pressable>

          <Pressable style={styles.card} onPress={() => router.push({ pathname: '/itinerary', params: routeParams })}>
            <Feather name="map" size={30} color="#008D9B" />
            <Text style={styles.cardTitle}>Itinerary</Text>
            <Text style={styles.cardSub}>Plan daily activities</Text>
          </Pressable>

          <Pressable style={styles.card} onPress={() => router.push({ pathname: '/invite-to-group', params: routeParams })}>
            <Ionicons name="person-add-outline" size={30} color="#008D9B" />
            <Text style={styles.cardTitle}>Add Friends</Text>
            <Text style={styles.cardSub}>Invite friends to this trip</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={leaveModalVisible} transparent animationType="fade" onRequestClose={() => !isLeaving && setLeaveModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, isCreator && styles.modalIconDanger]}>
              <Feather name={isCreator ? 'alert-triangle' : 'log-out'} size={24} color={isCreator ? '#BE123C' : '#008D9B'} />
            </View>
            <Text style={styles.modalTitle}>{isCreator ? 'Close this group?' : 'Leave this group?'}</Text>
            <Text style={styles.modalBody}>
              {isCreator
                ? 'Since you are the admin of this group, leaving will close it for everyone.'
                : 'You will be removed from this group, but it will remain available for the other participants.'}
            </Text>
            {leaveError ? <Text style={styles.modalError}>{leaveError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} disabled={isLeaving} onPress={() => setLeaveModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.confirmButton, isCreator && styles.confirmButtonDanger, isLeaving && styles.disabledButton]} disabled={isLeaving} onPress={() => { void handleConfirmLeave(); }}>
                <Text style={styles.confirmButtonText}>{isLeaving ? 'Working…' : isCreator ? 'Close Group' : 'Leave Group'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4FBFC' },
  container: { padding: 20, paddingBottom: 120 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  leavePill: { paddingHorizontal: 14, height: 38, borderRadius: 19, backgroundColor: '#E7FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#BDEEF2' },
  leavePillAdmin: { backgroundColor: '#FFF1F2', borderColor: '#FFE4E6' },
  leavePillText: { color: '#008D9B', fontSize: 13, fontWeight: '800' },
  leavePillTextAdmin: { color: '#BE123C' },
  title: { marginTop: 18, fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 6, color: '#5B6B77', fontSize: 14 },
  grid: { marginTop: 22, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#D7EEF0', shadowColor: '#008D9B', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTitle: { marginTop: 10, fontSize: 18, fontWeight: '700', color: '#0F172A' },
  cardSub: { marginTop: 4, color: '#64748B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { width: '100%', maxWidth: 380, borderRadius: 26, backgroundColor: '#FFFFFF', padding: 22, alignItems: 'center' },
  modalIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#E7FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalIconDanger: { backgroundColor: '#FFF1F2' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  modalBody: { marginTop: 8, fontSize: 14, lineHeight: 20, color: '#64748B', textAlign: 'center', fontWeight: '600' },
  modalError: { marginTop: 10, color: '#BE123C', fontWeight: '700', textAlign: 'center' },
  modalActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelButton: { flex: 1, height: 48, borderRadius: 15, backgroundColor: '#EEF2F3', alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: '#334155', fontWeight: '900' },
  confirmButton: { flex: 1, height: 48, borderRadius: 15, backgroundColor: '#008D9B', alignItems: 'center', justifyContent: 'center' },
  confirmButtonDanger: { backgroundColor: '#BE123C' },
  confirmButtonText: { color: '#FFFFFF', fontWeight: '900' },
  disabledButton: { opacity: 0.65 },
});
