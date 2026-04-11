import { API_BASE_URL, APP_ENV } from './app-config';

type UsernameAvailabilityResponse = {
  available?: boolean;
  error?: string;
};

type EmailAvailabilityResponse = {
  available?: boolean;
  canResetPassword?: boolean;
  error?: string;
};

export type EmailAvailabilityStatus = {
  available: boolean;
  canResetPassword: boolean;
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

  let payload: UsernameAvailabilityResponse = {};

  try {
    payload = (await response.json()) as UsernameAvailabilityResponse;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error ?? 'Unable to verify username availability right now.');
  }

  return payload.available === true;
}

export async function checkEmailAvailability(email: string): Promise<EmailAvailabilityStatus> {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const url = `${baseUrl}/auth/email-available?email=${encodeURIComponent(email)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'x-app-env': APP_ENV,
    },
  });

  let payload: EmailAvailabilityResponse = {};

  try {
    payload = (await response.json()) as EmailAvailabilityResponse;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error ?? 'Unable to verify email right now.');
  }

  return {
    available: payload.available === true,
    canResetPassword: payload.canResetPassword === true,
  };
}
