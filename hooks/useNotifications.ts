import { useEffect, useRef, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

interface NotificationData {
  pushToken: string | null;
  permissionStatus: string;
}

interface UseNotificationsProps {
  onTokenReceived?: (token: string) => void;
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.DEFAULT,
  }),
});

export function useNotifications({
  onTokenReceived,
  onNotificationReceived,
  onNotificationTapped,
}: UseNotificationsProps = {}): NotificationData {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const tokenListener = useRef<Notifications.Subscription>();
  const appStateListener = useRef<any>();

  useEffect(() => {
    if (__DEV__) console.log('[useNotifications] 🚀 Hook initialized - registering for push notifications');
    // Initial token registration
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        if (__DEV__) console.log('[useNotifications] ✅ Initial token received:', token);
        setPushToken(token);
        onTokenReceived?.(token);
      } else {
        if (__DEV__) console.log('[useNotifications] ⚠️ No token received during initial registration');
      }
    });

    // Listen for token updates (when Expo/FCM refreshes the token)
    tokenListener.current = Notifications.addPushTokenListener((event) => {
      const newToken = event.data;
      if (__DEV__) console.log('[useNotifications] 🔄 Push token updated:', newToken);
      setPushToken(newToken);
      onTokenReceived?.(newToken);
    });

    // Listen for notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        onNotificationReceived?.(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        onNotificationTapped?.(response);
      });

    // Listen for app state changes to re-check permissions
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        if (__DEV__) console.log('[useNotifications] 📱 App came to foreground - rechecking permissions');
        // App came to foreground - check if permissions changed
        await recheckPermissions();
      }
    };

    appStateListener.current = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (tokenListener.current) {
        tokenListener.current.remove();
      }
      if (appStateListener.current) {
        appStateListener.current.remove();
      }
    };
  }, [onTokenReceived, onNotificationReceived, onNotificationTapped]);

  async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (__DEV__) console.log('[useNotifications] ⚠️ Web platform - notifications unavailable');
      setPermissionStatus('unavailable');
      return null;
    }

    if (!Device.isDevice) {
      if (__DEV__) console.log('[useNotifications] ⚠️ Simulator/Emulator - notifications unavailable');
      setPermissionStatus('unavailable');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (__DEV__) console.log('[useNotifications] 📋 Current permission status:', existingStatus);
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        if (__DEV__) console.log('[useNotifications] 🔔 Requesting notification permissions from user...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        if (__DEV__) console.log('[useNotifications] 📝 User response:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        if (__DEV__) console.log('[useNotifications] ❌ SCENARIO 1: User DENIED permission - setting status to "denied"');
        setPermissionStatus('denied');
        return null;
      }

      if (__DEV__) console.log('[useNotifications] ✅ SCENARIO 1: User GRANTED permission - getting token');
      setPermissionStatus('granted');

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('[Notifications] No EAS project ID found');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      if (__DEV__) console.log('[useNotifications] 🎫 Token generated:', tokenData.data);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return tokenData.data;
    } catch (error) {
      console.error('[Notifications] Error registering for push notifications:', error);
      setPermissionStatus('error');
      return null;
    }
  }

  async function recheckPermissions() {
    if (Platform.OS === 'web' || !Device.isDevice) {
      return;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      const previousStatus = permissionStatus;
      if (__DEV__) console.log('[useNotifications] 🔍 Recheck - Previous:', previousStatus, '→ Current:', status);

      if (status !== previousStatus) {
        if (__DEV__) console.log('[useNotifications] 🔄 Permission status CHANGED!');
        setPermissionStatus(status);

        // If permissions were granted, get a new token
        if (status === 'granted' && previousStatus !== 'granted') {
          if (__DEV__) console.log('[useNotifications] ✅ SCENARIO 2: User RE-ENABLED notifications in settings - getting token');
          const projectId = Constants.expoConfig?.extra?.eas?.projectId;
          if (projectId) {
            const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
            const newToken = tokenData.data;
            if (__DEV__) console.log('[useNotifications] 🎫 New token generated:', newToken);
            setPushToken(newToken);
            onTokenReceived?.(newToken);
          }
        }

        // If permissions were revoked, clear the token
        if (status === 'denied' && previousStatus === 'granted') {
          if (__DEV__) console.log('[useNotifications] ❌ SCENARIO 2: User DISABLED notifications in settings - clearing token');
          setPushToken(null);
          onTokenReceived?.(null as any);
        }
      } else {
        if (__DEV__) console.log('[useNotifications] ✓ No permission changes detected');
      }
    } catch (error) {
      console.error('[useNotifications] ❌ Error rechecking permissions:', error);
    }
  }

  return { pushToken, permissionStatus };
}
