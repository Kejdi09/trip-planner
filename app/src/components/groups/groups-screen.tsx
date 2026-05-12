import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deleteGroupApi, fetchGroupMembers, fetchMyGroups, getActiveUserId, GroupRow } from '../../../lib/groups-api';
import { supabase } from '../../../lib/supabase';
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
// Avatar helpers
// ---------------------------------------------------------------------------

function MemberAvatar({
  member,
  size = 32,
  first = false,
  borderColor = COLORS.activeCardBackground,
}: {
  member: GroupMember;
  size?: number;
  first?: boolean;
  borderColor?: string;
}) {
  const initials = member.fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.memberAvatar,
        first && styles.memberAvatarFirst,
        { width: size, height: size, borderRadius: size / 2, borderColor },
      ]}>
      {member.avatarUrl ? (
        <Image
          source={{ uri: member.avatarUrl }}
          style={[styles.memberAvatarImage, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <Text style={[styles.memberAvatarText, { fontSize: size * 0.34 }]}>{initials}</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Active group card
// ---------------------------------------------------------------------------

function ActiveGroupCard({ group, onInvite, onPress, onPressVoting, onDelete, canDelete, currentUserId }: { group: Group; onInvite: () => void; onPress: () => void; onPressVoting: () => void; onDelete: () => void; canDelete: boolean; currentUserId: string }) {
  const adminMember = group.members.find((m) => m.id === group.adminId);
  const adminLabel = adminMember
    ? adminMember.id === currentUserId
      ? 'Admin: You'
      : `Admin: ${adminMember.fullName.split(' ')[0]} ${adminMember.fullName.split(' ')[1]?.[0] ?? ''}.`
    : '';

  const visibleMembers = group.members.slice(0, 3);
  const extraCount = group.members.length - visibleMembers.length;

  return (
    <Pressable style={styles.activeCard} onPress={onPress}>
      <View style={styles.activeCardTopRow}>
        <Text style={styles.activeCardName}>{group.name}</Text>
        {canDelete && <Pressable onPress={onDelete}><Feather name='x-circle' size={20} color={COLORS.upcomingText} /></Pressable>}
        {group.votingOpen && (
          <Pressable style={styles.votingBadge} onPress={onPressVoting}>
            <Text style={styles.votingBadgeText}>{'Voting\nOpen'}</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.adminText}>{adminLabel}</Text>

      <View style={styles.memberRow}>
        <View style={styles.avatarStack}>
          {visibleMembers.map((m, i) => (
            <MemberAvatar key={m.id} member={m} first={i === 0} />
          ))}
        </View>
        {extraCount > 0 && (
          <Text style={styles.moreText}>+{extraCount}</Text>
        )}
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

function OtherGroupRow({ group, onPress }: { group: Group; onPress: () => void }) {
  return (
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
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function GroupsScreen() {
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState(getActiveUserId());

  React.useEffect(() => {
    void (async () => { const { data } = await supabase.auth.getUser(); setCurrentUserId(data.user?.id ?? getActiveUserId()); })();
    const load = async () => {
      try {
        const { groups: rows } = await fetchMyGroups();
        const mapped = await Promise.all(
          rows.map(async (row) => {
            const { members } = await fetchGroupMembers(row.id);
            return {
              id: row.id,
              name: row.name ?? 'Untitled Group',
              adminId: row.created_by ?? '',
              members: members.map((m) => ({ id: m.user_id, fullName: `Member ${m.user_id.slice(0, 4)}`, avatarUrl: null, role: m.user_id === row.created_by ? 'admin' : 'member' })),
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

  const handleDeleteGroup = (groupId: string) => {
    Alert.alert(
      'Delete group?',
      'Are you sure you want to delete this group? This will remove its chat, voting, itinerary, and members.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroupApi(groupId, currentUserId);
              const { groups: rows } = await fetchMyGroups(currentUserId);
              const mapped = await Promise.all(
                rows.map(async (row) => {
                  const { members } = await fetchGroupMembers(row.id, currentUserId);
                  return {
                    id: row.id,
                    name: row.name ?? 'Untitled Group',
                    adminId: row.created_by ?? '',
                    members: members.map((m) => ({ id: m.user_id, fullName: `Member ${m.user_id.slice(0, 4)}`, avatarUrl: null, role: m.user_id === row.created_by ? 'admin' : 'member' })),
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
              Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unable to delete group.');
            }
          },
        },
      ],
    );
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
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
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
                    onDelete={() => handleDeleteGroup(g.id)}
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
                    onPressVoting={() => router.push({ pathname: '../../voting', params: { groupId: g.id } })}
                    canDelete={g.adminId === currentUserId}
                    currentUserId={currentUserId}
                    onDelete={() => handleDeleteGroup(g.id)}
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

      </View>
    </SafeAreaView>
  );
}
