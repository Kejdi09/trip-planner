import { API_BASE_URL, APP_ENV } from './app-config';

type AvailabilityResponse = {
  available?: boolean;
  error?: string;
};

export async function checkUsernameAvailability(username: string): Promise<boolean> {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const url = `${baseUrl}/auth/username-available?username=${encodeURIComponent(username)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'x-app-env': APP_ENV,
    },
  });

  let payload: AvailabilityResponse = {};
  try {
    payload = (await response.json()) as AvailabilityResponse;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error ?? 'Unable to verify username availability right now.');
  }

  return payload.available === true;
}

export async function checkEmailAvailability(email: string): Promise<boolean> {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const url = `${baseUrl}/auth/email-available?email=${encodeURIComponent(email)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'x-app-env': APP_ENV,
    },
  });

  let payload: AvailabilityResponse = {};
  try {
    payload = (await response.json()) as AvailabilityResponse;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error ?? 'Unable to verify email availability right now.');
  }

  return payload.available === true;
}