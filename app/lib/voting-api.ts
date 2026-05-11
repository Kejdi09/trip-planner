import { API_BASE_URL, APP_ENV } from './app-config';

export type VoteMember = { id: string };

export type VotingOptionDestination = {
  id: string;
  destinationId: string;
  city: string;
  country: string;
  votedCount: number;
  totalMembers: number;
  voters: VoteMember[];
  selected: boolean;
};

export type VotingOptionDate = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  votedCount: number;
  totalMembers: number;
  voters: VoteMember[];
  selected: boolean;
};

export type VotingOptionBudget = {
  id: string;
  label: string;
  min: number;
  max: number;
  votedCount: number;
  totalMembers: number;
  voters: VoteMember[];
  selected: boolean;
};

export type VotingStatePayload = {
  group: { id: string; status: string; votingDeadline: string | null; isVotingLocked: boolean };
  destinations: { options: VotingOptionDestination[]; hasTie: boolean };
  dates: { options: VotingOptionDate[]; hasTie: boolean };
  budget: { options: VotingOptionBudget[]; hasTie: boolean; hasConflict: boolean };
};

const getBase = () => (API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getBase()}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-app-env': APP_ENV,
      ...(init?.headers ?? {}),
    },
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error ?? 'Voting API request failed');
  return json as T;
}

export function fetchVotingState(groupId: string, userId: string) {
  const params = new URLSearchParams({ groupId, userId });
  return request<VotingStatePayload>(`/voting/state?${params.toString()}`, { method: 'GET' });
}

export function castVote(type: 'destination' | 'date' | 'budget', optionId: string, groupId: string, userId: string) {
  return request(`/voting/vote/${type}/${optionId}`, {
    method: 'POST',
    body: JSON.stringify({ groupId, userId }),
  });
}

export function createBudgetOption(groupId: string, userId: string, minBudget: number, maxBudget: number) {
  return request('/voting/options/budget', {
    method: 'POST',
    body: JSON.stringify({ groupId, userId, minBudget, maxBudget }),
  });
}

export function createDateOption(groupId: string, userId: string, startDate: string, endDate: string) {
  return request('/voting/options/date', {
    method: 'POST',
    body: JSON.stringify({ groupId, userId, startDate, endDate }),
  });
}

export function finalizeVoting(groupId: string, userId: string) {
  return request<{ group: Record<string, unknown> }>('/voting/finalize', {
    method: 'POST',
    body: JSON.stringify({ groupId, userId }),
  });
}
