import appsflyer from 'react-native-appsflyer';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APPSFLYER_DEV_KEY = '9yGmEt8H2AeJDH6GMzhC8P';

// IMPORTANT: Replace with your actual Apple App Store ID (numeric ID from App Store Connect)
// Example: '1234567890'
// This is REQUIRED for iOS deferred deep linking to work properly
// Find it in App Store Connect under App Information
const APPLE_APP_ID = 'YOUR_APPLE_APP_ID';

const ANDROID_PACKAGE_NAME = 'world.vibz.browserapp';
const DEFERRED_DEEP_LINK_KEY = '@vibz/deferred_deep_link';

export interface AppsflyerDeepLinkData {
  deep_link_value?: string;
  campaign?: string;
  media_source?: string;
  af_dp?: string;
  is_first_launch?: boolean | string;
  [key: string]: any;
}

function constructFullUrl(deepLinkValue: string): string {
  if (deepLinkValue.startsWith('http')) {
    return deepLinkValue;
  }
  if (deepLinkValue.startsWith('/')) {
    return `https://lovenote.vibz.world${deepLinkValue}`;
  }
  return `https://lovenote.vibz.world/${deepLinkValue}`;
}

export async function initializeAppsFlyer(
  onDeferredDeepLink?: (url: string) => void,
  onDirectDeepLink?: (url: string) => void
): Promise<void> {
  try {
    if (__DEV__) {
      console.log('[AppsFlyer] Starting initialization...');
    }

    // Wait for OneLink domain registration BEFORE SDK init
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.warn('[AppsFlyer] OneLink domain registration timeout');
        resolve();
      }, 2000);

      appsflyer.setOneLinkCustomDomains(
        ['vibzworld.onelink.me'],
        (success) => {
          clearTimeout(timeout);
          if (__DEV__) {
            console.log('[AppsFlyer] ✓ OneLink custom domain registered:', success);
          }
          resolve();
        },
        (error) => {
          clearTimeout(timeout);
          console.error('[AppsFlyer] ✗ Failed to register OneLink custom domain:', error);
          resolve();
        }
      );
    });

    // CRITICAL: Register onInstallConversionData callback BEFORE initSdk()
    // This ensures we catch the callback that fires during SDK initialization
    const unsubscribeInstall = appsflyer.onInstallConversionData(async (data) => {
      if (__DEV__) {
        console.log('[AppsFlyer] 📦 onInstallConversionData callback triggered:', JSON.stringify(data, null, 2));
      }

      if (data?.data) {
        const conversionData = data.data as AppsflyerDeepLinkData;

        if (conversionData.is_first_launch === true || conversionData.is_first_launch === 'true') {
          if (__DEV__) {
            console.log('[AppsFlyer] ✨ FIRST INSTALL DETECTED! This is a deferred deep link!');
          }

          const deepLinkValue = conversionData.deep_link_value || conversionData.af_dp;

          if (deepLinkValue) {
            const fullUrl = constructFullUrl(deepLinkValue);

            if (__DEV__) {
              console.log('[AppsFlyer] 🎯 Deferred deep link URL:', fullUrl);
            }

            // Store for retrieval by app initialization
            await AsyncStorage.setItem(DEFERRED_DEEP_LINK_KEY, fullUrl);

            // Call the callback if provided
            if (onDeferredDeepLink) {
              onDeferredDeepLink(fullUrl);
            }
          } else {
            if (__DEV__) {
              console.log('[AppsFlyer] ⚠️ First install but no deep_link_value found');
            }
          }
        } else {
          if (__DEV__) {
            console.log('[AppsFlyer] Not first launch (is_first_launch:', conversionData.is_first_launch, ')');
          }
        }
      }
    });

    // CRITICAL: Register onDeepLink callback for direct deep links (hot & cold start)
    // This handles deep links when app is already installed
    const unsubscribeDeepLink = appsflyer.onDeepLink((res) => {
      if (__DEV__) {
        console.log('[AppsFlyer] 🔗 onDeepLink callback triggered:', JSON.stringify(res, null, 2));
      }

      const type = res?.data?.af_deeplink_flag;
      const isDeferred = res?.data?.is_deferred;

      if (__DEV__) {
        console.log('[AppsFlyer] Deep link type:', type, 'Is deferred:', isDeferred);
      }

      if (res?.data?.deep_link_value) {
        const fullUrl = constructFullUrl(res.data.deep_link_value);

        if (__DEV__) {
          console.log('[AppsFlyer] 🎯 Direct deep link URL:', fullUrl);
        }

        // Call the callback if provided
        if (onDirectDeepLink) {
          onDirectDeepLink(fullUrl);
        }
      } else {
        if (__DEV__) {
          console.log('[AppsFlyer] ⚠️ Deep link received but no deep_link_value found');
        }
      }
    });

    // Now initialize the SDK
    const config = {
      devKey: APPSFLYER_DEV_KEY,
      isDebug: __DEV__,
      appId: Platform.OS === 'ios' ? APPLE_APP_ID : ANDROID_PACKAGE_NAME,
      onInstallConversionDataListener: true,
      onDeepLinkListener: true, // CRITICAL: Enable for direct deep links (hot & cold start)
      timeToWaitForATTUserAuthorization: 10,
    };

    if (__DEV__) {
      console.log('[AppsFlyer] Initializing SDK with config:', {
        devKey: APPSFLYER_DEV_KEY,
        appId: config.appId,
        platform: Platform.OS,
      });
    }

    await new Promise<void>((resolve, reject) => {
      appsflyer.initSdk(
        config,
        (result) => {
          if (__DEV__) {
            console.log('[AppsFlyer] ✓ SDK initialized successfully:', result);
          }
          resolve();
        },
        (error) => {
          console.error('[AppsFlyer] ✗ SDK initialization failed:', error);
          reject(error);
        }
      );
    });

    if (__DEV__) {
      console.log('[AppsFlyer] ✓ Full initialization complete');
    }
  } catch (error) {
    console.error('[AppsFlyer] ✗ Initialization error:', error);
  }
}

export { appsflyer };
