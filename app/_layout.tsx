import { useEffect, useState, useCallback } from 'react';
import { Platform, AppState, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useDeepLinking, resolveInitialUrl } from '@/hooks/useDeepLinking';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { initializeAppsFlyer } from '@/utils/appsflyerConfig';
import { extractNotificationData, getNavigationUrlFromNotification } from '@/utils/notificationNavigation';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  useDeepLinking();
  const router = useRouter();
  const [appReady, setAppReady] = useState(false);
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null);
  const [firstInstallDetected, setFirstInstallDetected] = useState(false);
  const [firstInstallUrl, setFirstInstallUrl] = useState<string | null>(null);

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
        if (__DEV__) console.log('[RootLayout] 🚀 Starting app initialization');

        // CRITICAL FIX: Capture initial URL BEFORE AppsFlyer initialization
        // AppsFlyer SDK may consume the URL from the Android Intent, making it unavailable later
        const preCapturedUrl = await Linking.getInitialURL();
        if (__DEV__) {
          console.log('[RootLayout] 📱 Pre-captured initial URL (before AppsFlyer):', preCapturedUrl);
        }

        // Initialize AppsFlyer with callbacks for both deferred and direct deep links
        let deferredDeepLinkReceived = false;
        let directDeepLinkReceived = false;

        await initializeAppsFlyer(
          // Callback for deferred deep links (first install)
          (url) => {
            if (__DEV__) console.log('[RootLayout] 🎯 Deferred deep link callback received:', url);
            deferredDeepLinkReceived = true;
            setFirstInstallDetected(true);
            setFirstInstallUrl(url);
            setPendingNavigationUrl(url);
          },
          // Callback for direct deep links (app already installed, hot/cold start)
          (url) => {
            if (__DEV__) console.log('[RootLayout] 🔗 Direct deep link callback received:', url);
            directDeepLinkReceived = true;
            setPendingNavigationUrl(url);
          }
        );

        if (__DEV__) {
          console.log('[RootLayout] ⏳ Waiting for AppsFlyer to process attribution data...');
        }

        // Wait for AppsFlyer to process deferred links on first install
        // This gives the SDK time to fetch and process attribution data
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (__DEV__) {
          console.log('[RootLayout] ✅ AppsFlyer wait complete. Deferred link received:', deferredDeepLinkReceived, 'Direct link received:', directDeepLinkReceived);
        }

        // Resolve the initial URL with priority order:
        // 1. Deferred deep link (AppsFlyer first install) - already handled by callback
        // 2. Direct deep link (AppsFlyer onDeepLink callback for hot/cold start)
        // 3. Pre-captured direct deep link (fallback if AppsFlyer doesn't fire)
        // 4. Notification URL (if app opened from notification)
        if (deferredDeepLinkReceived) {
          if (__DEV__) console.log('[RootLayout] 🎯 Using deferred deep link (first install)');
          // URL already set in callback
        } else if (directDeepLinkReceived) {
          if (__DEV__) console.log('[RootLayout] 🔗 Using direct deep link from AppsFlyer callback');
          // URL already set in callback
        } else if (preCapturedUrl) {
          if (__DEV__) console.log('[RootLayout] 📍 Using pre-captured direct deep link (fallback):', preCapturedUrl);
          setPendingNavigationUrl(preCapturedUrl);
        } else if (notificationNavigationUrl) {
          if (__DEV__) console.log('[RootLayout] 📍 Using notification URL:', notificationNavigationUrl);
          setPendingNavigationUrl(notificationNavigationUrl);
        } else {
          if (__DEV__) console.log('[RootLayout] 📍 No initial navigation URL, using default');
        }

        setAppReady(true);
      } catch (e) {
        if (__DEV__) console.warn('[RootLayout] ⚠️ Initialization error:', e);
        setAppReady(true);
      }
    }

    prepare();
  }, [notificationNavigationUrl]);

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  useEffect(() => {
    if (appReady && pendingNavigationUrl) {
      if (__DEV__) {
        console.log('[RootLayout] 🧭 Navigating to pending URL:', pendingNavigationUrl);
      }

      // Use a small delay to ensure navigation stack is fully mounted
      const timer = setTimeout(() => {
        router.replace(`/?url=${encodeURIComponent(pendingNavigationUrl)}`);
        setPendingNavigationUrl(null);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [appReady, pendingNavigationUrl, router]);

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
        firstInstallDetected,
        firstInstallUrl,
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