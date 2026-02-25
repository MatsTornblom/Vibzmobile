import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { getDeferredDeepLink } from './useAppsflyerDeepLinking';

const ALLOWED_DOMAINS = ['loveappneo.vibz.world', 'lovenote.vibz.world', 'openinapp.vibz.world'];

/**
 * Extracts and validates the target URL from a deep link
 * Supports multiple formats:
 * 1. vibzworld://?url=https%3A%2F%2Flovenote.vibz.world%2FshareId (priority)
 * 2. https://vibzworld.onelink.me/rzzM?deep_link_value=... (OneLink URL - fallback)
 * 3. https://lovenote.vibz.world/shareId (direct web link)
 * 4. vibzworld://lovenote.vibz.world/shareId (custom scheme fallback)
 */
function extractTargetUrl(incomingUrl: string): string | null {
  try {
    if (__DEV__) {
      console.log('[Deep Link] Extracting target URL from:', incomingUrl);
    }

    const parsedUrl = Linking.parse(incomingUrl);

    // Format 1: Custom scheme with ?url= query parameter (PRIORITY)
    // Example: vibzworld://?url=https%3A%2F%2Flovenote.vibz.world%2FshareId
    if (parsedUrl.queryParams?.url) {
      const decodedUrl = decodeURIComponent(parsedUrl.queryParams.url as string);

      if (__DEV__) {
        console.log('[Deep Link] Found URL query parameter:', decodedUrl);
      }

      // Validate the decoded URL
      if (isValidUrl(decodedUrl)) {
        return decodedUrl;
      } else {
        console.warn('[Deep Link] Invalid URL in query parameter:', decodedUrl);
        return null;
      }
    }

    // Format 2: OneLink URL with deep_link_value parameter (FALLBACK for AppsFlyer)
    // Example: https://vibzworld.onelink.me/rzzM?deep_link_value=https%3A%2F%2Flovenote.vibz.world%2FshareId
    if (parsedUrl.hostname === 'vibzworld.onelink.me' && parsedUrl.queryParams?.deep_link_value) {
      const deepLinkValue = decodeURIComponent(parsedUrl.queryParams.deep_link_value as string);

      if (__DEV__) {
        console.log('[Deep Link] Found OneLink deep_link_value:', deepLinkValue);
      }

      // If deep_link_value is a full URL, validate it
      if (deepLinkValue.startsWith('http')) {
        if (isValidUrl(deepLinkValue)) {
          return deepLinkValue;
        }
      } else {
        // Otherwise, construct the full URL
        const constructedUrl = deepLinkValue.startsWith('/')
          ? `https://lovenote.vibz.world${deepLinkValue}`
          : `https://lovenote.vibz.world/${deepLinkValue}`;

        if (__DEV__) {
          console.log('[Deep Link] Constructed URL from OneLink value:', constructedUrl);
        }

        return constructedUrl;
      }
    }

    // Format 3: Direct web link (App Links/Universal Links)
    // Example: https://lovenote.vibz.world/shareId
    if (parsedUrl.hostname && ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
      if (__DEV__) {
        console.log('[Deep Link] Direct web link from allowed domain:', incomingUrl);
      }
      return incomingUrl;
    }

    // Format 4: Custom scheme with domain path (FALLBACK)
    // Example: vibzworld://lovenote.vibz.world/shareId
    if (parsedUrl.scheme === 'vibzworld' && parsedUrl.hostname && ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
      const reconstructedUrl = `https://${parsedUrl.hostname}${parsedUrl.path || ''}`;

      if (__DEV__) {
        console.log('[Deep Link] Reconstructed URL from custom scheme:', reconstructedUrl);
      }

      return reconstructedUrl;
    }

    if (__DEV__) {
      console.log('[Deep Link] URL does not match any supported format:', {
        scheme: parsedUrl.scheme,
        hostname: parsedUrl.hostname,
        queryParams: parsedUrl.queryParams,
      });
    }

    return null;
  } catch (error) {
    console.error('[Deep Link] Error extracting target URL:', error);
    return null;
  }
}

/**
 * Validates that a URL is safe to load
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Must use HTTPS
    if (urlObj.protocol !== 'https:') {
      console.warn('[Deep Link] URL must use HTTPS protocol:', url);
      return false;
    }

    // Must be from an allowed domain
    if (!ALLOWED_DOMAINS.includes(urlObj.hostname)) {
      console.warn('[Deep Link] URL domain not in allowed list:', urlObj.hostname);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('[Deep Link] Invalid URL format:', url);
    return false;
  }
}

/**
 * Resolves the initial URL to navigate to on app launch
 * Priority order:
 * 1. Deferred deep link from AppsFlyer (first install)
 * 2. Initial URL from Linking (direct deep link)
 * Returns null if no URL should be loaded
 */
export async function resolveInitialUrl(): Promise<string | null> {
  if (__DEV__) {
    console.log('[Deep Link] Resolving initial URL on app launch');
  }

  // Priority 1: Check for deferred deep link first (from AppsFlyer first install)
  const deferredLink = await getDeferredDeepLink();

  if (deferredLink.deepLinkValue) {
    if (__DEV__) {
      console.log('[Deep Link] Found stored deferred deep link:', deferredLink.deepLinkValue);
    }
    return deferredLink.deepLinkValue;
  }

  // Priority 2: Check for initial URL from OS (cold start with direct link)
  const initialUrl = await Linking.getInitialURL();
  if (initialUrl) {
    if (__DEV__) {
      console.log('[Deep Link] Got initial URL from OS:', initialUrl);
    }

    const targetUrl = extractTargetUrl(initialUrl);

    if (targetUrl) {
      if (__DEV__) {
        console.log('[Deep Link] Extracted valid target URL:', targetUrl);
      }
      return targetUrl;
    } else if (__DEV__) {
      console.log('[Deep Link] No valid target URL extracted from initial URL');
    }
  } else if (__DEV__) {
    console.log('[Deep Link] No initial URL on app launch');
  }

  return null;
}

export function useDeepLinking() {
  const router = useRouter();

  useEffect(() => {
    // Handle URLs when app is in foreground or background
    const handleIncomingURL = (event: { url: string }) => {
      if (__DEV__) {
        console.log('[Deep Link] Received URL while app is running:', event.url);
      }

      const targetUrl = extractTargetUrl(event.url);

      if (targetUrl) {
        if (__DEV__) {
          console.log('[Deep Link] Navigating to extracted URL:', targetUrl);
        }
        router.push(`/?url=${encodeURIComponent(targetUrl)}`);
      } else if (__DEV__) {
        console.log('[Deep Link] No valid target URL extracted from incoming URL');
      }
    };

    // Set up event listener for URLs received while app is running
    const subscription = Linking.addEventListener('url', handleIncomingURL);

    // Cleanup
    return () => {
      subscription.remove();
    };
  }, [router]);
}