import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { registerPushToken } from './notifications-api';

let hasConfiguredHandler = false;
let hasRegisteredThisSession = false;

type ExpoNotificationsModule = {
  setNotificationHandler?: (handler: unknown) => void;
  getPermissionsAsync?: () => Promise<{ status?: string }>;
  requestPermissionsAsync?: () => Promise<{ status?: string }>;
  getExpoPushTokenAsync?: (options?: { projectId?: string }) => Promise<{ data?: string }>;
};

function loadExpoNotifications(): ExpoNotificationsModule | null {
  try {
    // expo-notifications is optional in local web/dev installs. Load lazily so web and CI do not crash if it is absent.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as ExpoNotificationsModule;
  } catch {
    return null;
  }
}

function projectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export async function registerForPushNotificationsOnce() {
  if (hasRegisteredThisSession || Platform.OS === 'web' || !Device.isDevice) return;
  hasRegisteredThisSession = true;

  const Notifications = loadExpoNotifications();
  if (!Notifications?.getPermissionsAsync || !Notifications?.requestPermissionsAsync || !Notifications?.getExpoPushTokenAsync) return;

  if (!hasConfiguredHandler && Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    hasConfiguredHandler = true;
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  let status = existingPermission.status;
  if (status !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    status = requestedPermission.status;
  }
  if (status !== 'granted') return;

  const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId() ? { projectId: projectId() } : undefined);
  const token = tokenResponse.data;
  if (!token) return;
  await registerPushToken(token, Platform.OS);
}
