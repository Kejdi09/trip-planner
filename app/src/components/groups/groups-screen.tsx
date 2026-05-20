import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deleteGroupApi, fetchGroupMembers, fetchMyGroups, getActiveUserId, GroupRow } from '../../../lib/groups-api';
import { supabase } from '../../../lib/supabase';
import { AppLoading } from '@/components/common/AppLoading';
import { COLORS, groupsStyles as styles } from './groups-screen.styles';

type GroupMember = { id: string; fullName: string; avatarUrl: string | null; role: 'admin' | 'member' };
type GroupStatus = 'active' | 'upcoming' | 'completed';
type Group = {
  id: string;
  name: string;
  adminId: string;
  members: GroupMember[];
  status: GroupStatus;
  votingOpen: boolean;
  places: { name: string }[];
  dateRange: string | null;
  budgetRange: string | null;
  destination: string | null;
};


function mapStatus(row: GroupRow): GroupStatus {
  if (row.status === 'active') return 'active';
  if (row.status === 'completed') return 'completed';
  return 'upcoming';
}

// ---------------------------------------------------------------------------
// Active group card
// ---------------------------------------------------------------------------

function ActiveGroupCard({ group, onInvite, onPress, onPressVoting, onDelete, canDelete, currentUserId }: { group: Group; onInvite: () => void; onPress: () => void; onPressVoting: () => void; onDelete: () => void; canDelete: boolean; currentUserId: string }) {
  const adminMember = group.members.find((m) => m.id === group.adminId);
  const adminLabel = adminMember
    ? adminMember.id === currentUserId
      ? 'Admin: You'
      : `Admin: ${adminMember.fullName || 'Unknown user'}`
    : 'Admin: Unknown user';

  const memberNames = group.members.map((m) => m.fullName || 'Unknown user').join(', ');

  return (
    <View style={{ position: 'relative' }}>
    <Pressable style={styles.activeCard} onPress={onPress}>
      <View style={styles.activeCardTopRow}>
        <Text style={styles.activeCardName}>{group.name}</Text>
        {group.votingOpen && (
          <Pressable style={styles.votingBadge} onPress={onPressVoting}>
            <Text style={styles.votingBadgeText}>{'Voting\nOpen'}</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.adminText}>{adminLabel}</Text>

      <View style={styles.memberRow}>
        <Text style={styles.memberNamesText} numberOfLines={1}>{`Members: ${memberNames}`}</Text>
        <Pressable style={styles.inviteButton} onPress={onInvite}>
          <Text style={styles.inviteButtonText}>Invite</Text>
        </Pressable>
      </View>

      <View style={styles.pillRow}>
        {group.places.length > 0 && (
          <View style={styles.pill}>
            <Ionicons name="location-outline" size={12} color={COLORS.mutedText} />
            <Text style={styles.pillText}>{group.places.length} places</Text>
          </View>
        )}
        {group.dateRange && (
          <View style={styles.pill}>
            <Feather name="calendar" size={12} color={COLORS.mutedText} />
            <Text style={styles.pillText}>{group.dateRange}</Text>
          </View>
        )}
        {group.budgetRange && (
          <View style={styles.pill}>
            <MaterialCommunityIcons name="currency-usd" size={12} color={COLORS.mutedText} />
            <Text style={styles.pillText}>{group.budgetRange}</Text>
          </View>
        )}
      </View>
    </Pressable>
      {canDelete ? (
        <Pressable
          hitSlop={12}
          onPress={(event) => {
            event.stopPropagation?.();
            onDelete();
          }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 50,
            elevation: 50,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Delete group">
          <Feather name="x-circle" size={22} color="#BE123C" />
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Other group row
// ---------------------------------------------------------------------------

function statusColor(status: GroupStatus): string {
  if (status === 'upcoming') return COLORS.upcomingText;
  if (status === 'completed') return COLORS.completedText;
  return COLORS.primary;
}

function statusLabel(status: GroupStatus): string {
  if (status === 'upcoming') return 'Upcoming';
  if (status === 'completed') return 'Completed';
  return 'Active';
}

function OtherGroupRow({ group, onPress, canDelete, onDelete }: { group: Group; onPress: () => void; canDelete: boolean; onDelete: () => void }) {
  return (
    <View style={{ position: 'relative' }}>
    <Pressable style={styles.otherCard} onPress={onPress}>
      <View style={styles.otherCardIcon}>
        <Ionicons name="people-outline" size={22} color={COLORS.mutedText} />
      </View>
      <View style={styles.otherCardInfo}>
        <Text style={styles.otherCardName}>{group.name}</Text>
        <View style={styles.otherCardSub}>
          <Text style={styles.otherCardMembers}>{group.members.length} members</Text>
          <Text style={[styles.otherCardStatus, { color: statusColor(group.status) }]}>
            {statusLabel(group.status)}
          </Text>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={COLORS.chevron} style={styles.chevron} />
    </Pressable>
      {canDelete ? (
        <Pressable
          hitSlop={12}
          onPress={(event) => {
            event.stopPropagation?.();
            onDelete();
          }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 50,
            elevation: 50,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Delete group">
          <Feather name="x-circle" size={22} color="#BE123C" />
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function GroupsScreen() {
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState(getActiveUserId());
  const [groupToDelete, setGroupToDelete] = React.useState<Group | null>(null);
  const [deletingGroupId, setDeletingGroupId] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => { const { data } = await supabase.auth.getUser(); setCurrentUserId(data.user?.id ?? getActiveUserId()); })();
    const load = async () => {
      try {
        const { groups: rows } = await fetchMyGroups();
        const mapped = await Promise.all(
          rows.map(async (row) => {
            const { members } = await fetchGroupMembers(row.id);
            const memberIds = members.map((m) => m.user_id);
            const { data: profiles } = await supabase.from('profiles').select('id, full_name, username').in('id', memberIds);
            const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
            return {
              id: row.id,
              name: row.name ?? 'Untitled Group',
              adminId: row.created_by ?? '',
              members: members.map((m) => ({ id: m.user_id, fullName: profileById.get(m.user_id)?.full_name?.trim() || profileById.get(m.user_id)?.username?.trim() || 'Unknown user', avatarUrl: null, role: m.user_id === row.created_by ? 'admin' : 'member' })),
              status: mapStatus(row),
              votingOpen: row.status === 'planning',
              places: [],
              dateRange: row.start_date && row.end_date ? `${row.start_date} - ${row.end_date}` : null,
              budgetRange: row.min_budget != null && row.max_budget != null ? `$${row.min_budget}-$${row.max_budget}` : null,
              destination: null,
            } as Group;
          }),
        );
        setGroups(mapped);
      } catch (error) {
        console.error('Failed to load groups', error);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const activeGroups = groups.filter((g) => g.status === 'active');
  const otherGroups = groups.filter((g) => g.status !== 'active');

  const requestDeleteGroup = (group: Group) => {
    setDeleteError(null);
    setGroupToDelete(group);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete || deletingGroupId) return;

    const requesterId = currentUserId || getActiveUserId();

    if (!requesterId) {
      setDeleteError('No authenticated user found. Please log in again.');
      return;
    }

    setDeletingGroupId(groupToDelete.id);
    setDeleteError(null);

    try {
      await deleteGroupApi(groupToDelete.id, requesterId);
      setGroups((previousGroups) =>
        previousGroups.filter((group) => group.id !== groupToDelete.id),
      );
      setGroupToDelete(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Unable to delete group.');
    } finally {
      setDeletingGroupId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Groups</Text>
          <Pressable
            style={styles.addButton}
            accessibilityRole="button"
            accessibilityLabel="Create new group"
            onPress={() => router.push('../../create-group')}>
            <Feather name="plus" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {loading ? (
          <AppLoading message="Loading your groups..." />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>

            {/* Active planning */}
            {activeGroups.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>ACTIVE PLANNING</Text>
                {activeGroups.map((g) => (
                  <ActiveGroupCard
                    key={g.id}
                    group={g}
                    onInvite={() => router.push({ pathname: '../../invite-to-group', params: { groupId: g.id } })}
                    onPress={() => router.push({ pathname: '../../group-hub', params: { groupId: g.id } })}
                    onPressVoting={() => router.push({ pathname: '../../voting', params: { groupId: g.id } })}
                    canDelete={g.adminId === currentUserId}
                    currentUserId={currentUserId}
                    onDelete={() => requestDeleteGroup(g)}
                  />
                ))}
              </>
            )}

            {/* Other groups */}
            {otherGroups.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>OTHER GROUPS</Text>
                {otherGroups.map((g) => (
                  <OtherGroupRow
                    key={g.id}
                    group={g}
                    onPress={() => router.push({ pathname: '../../group-hub', params: { groupId: g.id } })}
                    canDelete={g.adminId === currentUserId}
                    onDelete={() => requestDeleteGroup(g)}
                  />
                ))}
              </>
            )}

            {groups.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={36} color={COLORS.mutedText} />
                <Text style={styles.emptyStateText}>No groups yet. Create one!</Text>
              </View>
            )}
          </ScrollView>
        )}
        <Modal
          transparent
          visible={Boolean(groupToDelete)}
          animationType="fade"
          onRequestClose={() => {
            if (!deletingGroupId) setGroupToDelete(null);
          }}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.35)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}>
            <View
              style={{
                width: '100%',
                maxWidth: 360,
                borderRadius: 24,
                backgroundColor: '#FFFFFF',
                padding: 22,
                shadowColor: '#000000',
                shadowOpacity: 0.18,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 },
                elevation: 8,
              }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>
                Delete group?
              </Text>

              <Text style={{ marginTop: 10, color: '#64748B', fontSize: 14, lineHeight: 20 }}>
                Are you sure you want to delete {groupToDelete?.name ?? 'this group'}? This will remove its members, chat, votes, and itinerary.
              </Text>

              {deleteError ? (
                <Text style={{ marginTop: 12, color: '#BE123C', fontSize: 13, fontWeight: '600' }}>
                  {deleteError}
                </Text>
              ) : null}

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 22 }}>
                <Pressable
                  disabled={Boolean(deletingGroupId)}
                  onPress={() => setGroupToDelete(null)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor: '#F1F5F9',
                  }}>
                  <Text style={{ color: '#0F172A', fontWeight: '700' }}>Cancel</Text>
                </Pressable>

                <Pressable
                  disabled={Boolean(deletingGroupId)}
                  onPress={confirmDeleteGroup}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor: '#BE123C',
                    opacity: deletingGroupId ? 0.65 : 1,
                  }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
                    {deletingGroupId ? 'Deleting…' : 'Delete'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}
