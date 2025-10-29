import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
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

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        console.log('[Notifications] Push token received:', token);
        setPushToken(token);
        onTokenReceived?.(token);
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('[Notifications] Notification received:', notification);
        onNotificationReceived?.(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('[Notifications] Notification tapped:', response);
        onNotificationTapped?.(response);
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [onTokenReceived, onNotificationReceived, onNotificationTapped]);

  async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (Platform.OS === 'web') {
      console.log('[Notifications] Web platform, push notifications not available');
      setPermissionStatus('unavailable');
      return null;
    }

    if (!Device.isDevice) {
      console.log('[Notifications] Not a physical device, push notifications not available');
      setPermissionStatus('unavailable');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission denied');
        setPermissionStatus('denied');
        return null;
      }

      setPermissionStatus('granted');

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('[Notifications] No EAS project ID found');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('[Notifications] Push token generated:', tokenData.data);

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

  return { pushToken, permissionStatus };
}
