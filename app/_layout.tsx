import { useEffect, useState, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useDeepLinking } from '@/hooks/useDeepLinking';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { initializeAppsFlyer } from '@/utils/appsflyerConfig';
import { useAppsflyerDeepLinking } from '@/hooks/useAppsflyerDeepLinking';
import { extractNotificationData, getNavigationUrlFromNotification } from '@/utils/notificationNavigation';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  useDeepLinking();
  useAppsflyerDeepLinking();
  const [appReady, setAppReady] = useState(false);

  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  const [lastNotificationResponse, setLastNotificationResponse] = useState<Notifications.NotificationResponse | null>(null);
  const [notificationNavigationUrl, setNotificationNavigationUrl] = useState<string | null>(null);

  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    if (__DEV__) console.log('[RootLayout] 🔔 Notification received:', notification);
    setLastNotification(notification);
  }, []);

  const handleNotificationTapped = useCallback((response: Notifications.NotificationResponse) => {
    if (__DEV__) console.log('[RootLayout] 👆 Notification tapped:', response);
    setLastNotificationResponse(response);

    const notificationData = extractNotificationData(response);
    if (notificationData) {
      const navigationResult = getNavigationUrlFromNotification(notificationData);
      if (navigationResult) {
        if (__DEV__) console.log('[RootLayout] 🧭 Notification navigation URL:', navigationResult.url);
        setNotificationNavigationUrl(navigationResult.url);
      }
    }
  }, []);

  const { pushToken, permissionStatus } = useNotifications({
    onNotificationReceived: handleNotificationReceived,
    onNotificationTapped: handleNotificationTapped,
  });

  useEffect(() => {
    async function checkLastNotification() {
      if (Platform.OS === 'web') return;

      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        if (__DEV__) console.log('[RootLayout] 🚀 App opened from notification (killed state):', response);
        setLastNotificationResponse(response);

        const notificationData = extractNotificationData(response);
        if (notificationData) {
          const navigationResult = getNavigationUrlFromNotification(notificationData);
          if (navigationResult) {
            if (__DEV__) console.log('[RootLayout] 🧭 Initial navigation URL from notification:', navigationResult.url);
            setNotificationNavigationUrl(navigationResult.url);
          }
        }
      }
    }

    checkLastNotification();
  }, []);

  useEffect(() => {
    if (__DEV__) console.log('[RootLayout] 🔄 Context state updated:', {
      pushToken,
      permissionStatus,
    });
  }, [pushToken, permissionStatus]);

  useEffect(() => {
    const hideSystemUI = () => {
      if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('hidden');
        NavigationBar.setBehaviorAsync('overlay-swipe');
      }
    };

    hideSystemUI();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        hideSystemUI();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        initializeAppsFlyer();
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAppReady(true);
      } catch (e) {
        if (__DEV__) console.warn(e);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <NotificationProvider
      value={{
        pushToken,
        permissionStatus,
        lastNotification,
        lastNotificationResponse,
        notificationNavigationUrl,
      }}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar hidden={true} />
    </NotificationProvider>
  );
}