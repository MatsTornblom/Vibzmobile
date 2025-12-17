import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFERRED_DEEP_LINK_KEY = '@vibz/deferred_deep_link';

export interface DeferredDeepLinkResult {
  deepLinkValue: string | null;
  isDeferred: boolean;
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
