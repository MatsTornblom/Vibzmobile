import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

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
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('[Deep Link] Initial URL:', initialUrl);
        handleIncomingURL(initialUrl);
      }
    };

    // Handle URLs when app is already running
    const handleIncomingURL = (url: string) => {
      console.log('[Deep Link] Incoming URL:', url);

      // Parse the URL to extract information
      const parsedUrl = Linking.parse(url);
      console.log('[Deep Link] Parsed URL:', parsedUrl);

      // Check if it's our custom app scheme with a URL parameter
      if (parsedUrl.scheme === 'vibzworld' && parsedUrl.queryParams?.url) {
        const targetUrl = parsedUrl.queryParams.url as string;
        console.log('[Deep Link] Navigating to URL from scheme:', targetUrl);
        router.replace(`/?url=${encodeURIComponent(targetUrl)}`);
      }
      // Handle direct HTTP/HTTPS URLs from our handled domains
      else if (parsedUrl.scheme === 'http' || parsedUrl.scheme === 'https') {
        // Check if this URL is from one of our handled domains
        const isHandledDomain = HANDLED_DOMAINS.some(domain =>
          parsedUrl.hostname === domain
        );

        if (isHandledDomain) {
          console.log('[Deep Link] Navigating to handled domain URL:', url);
          router.replace(`/?url=${encodeURIComponent(url)}`);
        } else {
          console.log('[Deep Link] URL not from handled domain, ignoring:', url);
        }
      }
      // Handle custom URL schemes that should open websites
      else if (parsedUrl.queryParams?.openUrl) {
        const targetUrl = parsedUrl.queryParams.openUrl as string;
        console.log('[Deep Link] Navigating to URL from openUrl param:', targetUrl);
        router.replace(`/?url=${encodeURIComponent(targetUrl)}`);
      } else {
        console.log('[Deep Link] No matching URL pattern, ignoring');
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