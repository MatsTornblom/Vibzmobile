import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

export function useDeepLinking() {
  const router = useRouter();

  useEffect(() => {
    // Handle initial URL when app is opened from a link
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleIncomingURL(initialUrl);
      }
    };

    // Handle URLs when app is already running
    const handleIncomingURL = (url: string) => {
      console.log('Incoming URL:', url);
      
      // Parse the URL to extract the target website
      const parsedUrl = Linking.parse(url);
      
      // Check if it's our app scheme with a URL parameter
      if (parsedUrl.scheme === 'browser-app' && parsedUrl.queryParams?.url) {
        const targetUrl = parsedUrl.queryParams.url as string;
        // Navigate to browser with the target URL
        router.push(`/?url=${encodeURIComponent(targetUrl)}`);
      }
      // Handle direct HTTP/HTTPS URLs (for Android intent filters)
      else if (parsedUrl.scheme === 'http' || parsedUrl.scheme === 'https') {
        // Navigate to browser with the full URL
        router.push(`/?url=${encodeURIComponent(url)}`);
      }
      // Handle custom URL schemes that should open websites
      else if (parsedUrl.queryParams?.openUrl) {
        const targetUrl = parsedUrl.queryParams.openUrl as string;
        router.push(`/?url=${encodeURIComponent(targetUrl)}`);
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