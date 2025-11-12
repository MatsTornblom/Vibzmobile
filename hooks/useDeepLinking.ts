import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { getDeferredDeepLink } from './useAppsflyerDeepLinking';

// Define the domains we handle
const HANDLED_DOMAINS = [
  'loveappneo.vibz.world',
  'lovenote.vibz.world',
  'openinapp.vibz.world'
];

export function useDeepLinking() {
  const router = useRouter();

  useEffect(() => {
    // Handle initial URL when app is opened from a link
    const handleInitialURL = async () => {
      // First, check for deferred deep links from AppsFlyer
      const deferredLink = await getDeferredDeepLink();

      if (deferredLink.deepLinkValue) {
        if (__DEV__) {
          console.log('[Deep Link] Processing deferred deep link from AppsFlyer:', deferredLink.deepLinkValue);
        }

        // Construct full URL from deep link value
        const fullUrl = deferredLink.deepLinkValue.startsWith('http')
          ? deferredLink.deepLinkValue
          : `https://lovenote.vibz.world${deferredLink.deepLinkValue}`;

        if (__DEV__) {
          console.log('[Deep Link] Navigating to deferred deep link URL:', fullUrl);
        }

        router.replace(`/?url=${encodeURIComponent(fullUrl)}`);
        return;
      }

      // If no deferred deep link, handle normal initial URL
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        if (__DEV__) console.log('[Deep Link] Initial URL:', initialUrl);
        handleIncomingURL(initialUrl);
      }
    };

    // Handle URLs when app is already running
    const handleIncomingURL = (url: string) => {
      if (__DEV__) console.log('[Deep Link] Incoming URL:', url);

      // Parse the URL to extract information
      const parsedUrl = Linking.parse(url);
      if (__DEV__) console.log('[Deep Link] Parsed URL:', parsedUrl);

      // Check if it's our custom app scheme with a URL parameter
      if (parsedUrl.scheme === 'vibzworld' && parsedUrl.queryParams?.url) {
        const targetUrl = parsedUrl.queryParams.url as string;
        if (__DEV__) console.log('[Deep Link] Navigating to URL from scheme:', targetUrl);
        router.replace(`/?url=${encodeURIComponent(targetUrl)}`);
      }
      // Handle direct HTTP/HTTPS URLs from our handled domains
      else if (parsedUrl.scheme === 'http' || parsedUrl.scheme === 'https') {
        // Check if this URL is from one of our handled domains
        const isHandledDomain = HANDLED_DOMAINS.some(domain =>
          parsedUrl.hostname === domain
        );

        if (isHandledDomain) {
          if (__DEV__) console.log('[Deep Link] Navigating to handled domain URL:', url);
          router.replace(`/?url=${encodeURIComponent(url)}`);
        } else {
          if (__DEV__) console.log('[Deep Link] URL not from handled domain, ignoring:', url);
        }
      }
      // Handle custom URL schemes that should open websites
      else if (parsedUrl.queryParams?.openUrl) {
        const targetUrl = parsedUrl.queryParams.openUrl as string;
        if (__DEV__) console.log('[Deep Link] Navigating to URL from openUrl param:', targetUrl);
        router.replace(`/?url=${encodeURIComponent(targetUrl)}`);
      } else {
        if (__DEV__) console.log('[Deep Link] No matching URL pattern, ignoring');
      }
    };

    // Set up the initial URL handler
    handleInitialURL();

    // Set up the URL event listener for when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      handleIncomingURL(event.url);
    });

    return () => {
      subscription?.remove();
    };
  }, [router]);
}