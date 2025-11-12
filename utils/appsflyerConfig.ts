import appsflyer from 'react-native-appsflyer';
import { Platform } from 'react-native';

const APPSFLYER_DEV_KEY = '9yGmEt8H2AeJDH6GMzhC8P';
const APPLE_APP_ID = 'YOUR_APPLE_APP_ID';
const ANDROID_PACKAGE_NAME = 'world.vibz.browserapp';

export interface AppsflyerDeepLinkData {
  deep_link_value?: string;
  campaign?: string;
  media_source?: string;
  af_dp?: string;
  [key: string]: any;
}

export function initializeAppsFlyer() {
  const config = {
    devKey: APPSFLYER_DEV_KEY,
    isDebug: __DEV__,
    appId: Platform.OS === 'ios' ? APPLE_APP_ID : ANDROID_PACKAGE_NAME,
    onInstallConversionDataListener: true,
    onDeepLinkListener: true,
    timeToWaitForATTUserAuthorization: 10,
  };

  if (__DEV__) {
    console.log('[AppsFlyer] Initializing with config:', {
      devKey: APPSFLYER_DEV_KEY,
      appId: config.appId,
      platform: Platform.OS,
    });
  }

  appsflyer.initSdk(
    config,
    (result) => {
      if (__DEV__) {
        console.log('[AppsFlyer] ✓ SDK initialized successfully:', result);
      }
    },
    (error) => {
      console.error('[AppsFlyer] ✗ SDK initialization failed:', error);
    }
  );
}

export { appsflyer };
