interface NotificationData {
  type: 'reward_received' | 'message_read';
  date?: string;
  userId?: string;
  rewardAmount?: number;
  shareId?: string;
}

interface NavigationResult {
  url: string;
  isRelative: boolean;
}

const PROFILE_BASE_URL = 'https://profile.vibz.world';
const MESSAGE_BASE_URL = 'https://lovenote.vibz.world';

export function getNavigationUrlFromNotification(
  notificationData: any
): NavigationResult | null {
  if (!notificationData || typeof notificationData !== 'object') {
    return null;
  }

  const data = notificationData as NotificationData;

  switch (data.type) {
    case 'reward_received':
      return {
        url: PROFILE_BASE_URL,
        isRelative: false,
      };

    case 'message_read':
      if (!data.shareId) {
        console.warn('[Navigation] message_read notification missing shareId');
        return null;
      }
      return {
        url: `${MESSAGE_BASE_URL}/${data.shareId}`,
        isRelative: false,
      };

    default:
      console.warn('[Navigation] Unknown notification type:', data.type);
      return null;
  }
}

export function extractNotificationData(
  notificationResponse: any
): NotificationData | null {
  try {
    if (!notificationResponse?.notification?.request?.content?.data) {
      return null;
    }

    const data = notificationResponse.notification.request.content.data;

    if (!data.type) {
      console.warn('[Navigation] Notification data missing type field');
      return null;
    }

    return data as NotificationData;
  } catch (error) {
    console.error('[Navigation] Error extracting notification data:', error);
    return null;
  }
}
