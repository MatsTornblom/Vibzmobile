import * as Linking from 'expo-linking';

export const createDeepLink = (url: string): string => {
  return `browser-app://open?url=${encodeURIComponent(url)}`;
};

export const openWithBrowser = async (url: string): Promise<void> => {
  const deepLink = createDeepLink(url);
  const canOpen = await Linking.canOpenURL(deepLink);
  
  if (canOpen) {
    await Linking.openURL(deepLink);
  } else {
    if (__DEV__) console.warn('Cannot open deep link:', deepLink);
  }
};

export const shareDeepLink = (url: string): string => {
  return createDeepLink(url);
};

// For testing purposes - generates example deep links
export const getExampleDeepLinks = () => {
  return [
    {
      name: 'Google',
      url: 'https://www.google.com',
      deepLink: createDeepLink('https://www.google.com'),
    },
    {
      name: 'GitHub',
      url: 'https://github.com',
      deepLink: createDeepLink('https://github.com'),
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com',
      deepLink: createDeepLink('https://www.youtube.com'),
    },
  ];
};