import { useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appsflyer, AppsflyerDeepLinkData } from '@/utils/appsflyerConfig';

const DEFERRED_DEEP_LINK_KEY = '@vibz/deferred_deep_link';
const FIRST_LAUNCH_KEY = '@vibz/first_launch_handled';

export interface DeferredDeepLinkResult {
  deepLinkValue: string | null;
  isDeferred: boolean;
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

export function useAppsflyerDeepLinking() {
  const router = useRouter();

  const handleDeepLinkNavigation = useCallback(async (data: AppsflyerDeepLinkData) => {
    if (__DEV__) {
      console.log('[AppsFlyer Deep Link] Received deep link data:', data);
    }

    const deepLinkValue = data.deep_link_value || data.af_dp;

    if (!deepLinkValue) {
      if (__DEV__) {
        console.log('[AppsFlyer Deep Link] No deep_link_value found in data');
      }
      return;
    }

    const fullUrl = constructFullUrl(deepLinkValue);

    const isFirstLaunch = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);

    if (!isFirstLaunch) {
      if (__DEV__) {
        console.log('[AppsFlyer Deep Link] First launch - storing deferred deep link:', fullUrl);
      }
      await AsyncStorage.setItem(DEFERRED_DEEP_LINK_KEY, fullUrl);
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    } else {
      if (__DEV__) {
        console.log('[AppsFlyer Deep Link] App already running - navigating to direct deep link:', fullUrl);
      }
      router.replace(`/?url=${encodeURIComponent(fullUrl)}`);
    }
  }, [router]);

  useEffect(() => {
    const unsubscribeDeepLink = appsflyer.onDeepLink((res) => {
      if (__DEV__) {
        console.log('[AppsFlyer] onDeepLink callback triggered:', res);
      }

      if (res?.data) {
        handleDeepLinkNavigation(res.data as AppsflyerDeepLinkData);
      }
    });

    const unsubscribeInstall = appsflyer.onInstallConversionData((data) => {
      if (__DEV__) {
        console.log('[AppsFlyer] onInstallConversionData callback triggered:', data);
      }

      if (data?.data) {
        const conversionData = data.data as AppsflyerDeepLinkData;

        if (conversionData.is_first_launch === true || conversionData.is_first_launch === 'true') {
          if (__DEV__) {
            console.log('[AppsFlyer] First launch detected via install conversion data');
          }
          handleDeepLinkNavigation(conversionData);
        }
      }
    });

    return () => {
      if (unsubscribeDeepLink) {
        unsubscribeDeepLink();
      }
      if (unsubscribeInstall) {
        unsubscribeInstall();
      }
    };
  }, [handleDeepLinkNavigation]);
}

export async function getDeferredDeepLink(): Promise<DeferredDeepLinkResult> {
  try {
    const deferredLink = await AsyncStorage.getItem(DEFERRED_DEEP_LINK_KEY);

    if (deferredLink) {
      if (__DEV__) {
        console.log('[AppsFlyer] Found deferred deep link:', deferredLink);
      }
      await AsyncStorage.removeItem(DEFERRED_DEEP_LINK_KEY);

      return {
        deepLinkValue: deferredLink,
        isDeferred: true,
      };
    }

    return {
      deepLinkValue: null,
      isDeferred: false,
    };
  } catch (error) {
    console.error('[AppsFlyer] Error retrieving deferred deep link:', error);
    return {
      deepLinkValue: null,
      isDeferred: false,
    };
  }
}
