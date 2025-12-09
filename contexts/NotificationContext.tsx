import React, { createContext, useContext, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';

interface NotificationContextType {
  pushToken: string | null;
  permissionStatus: string;
  lastNotification: Notifications.Notification | null;
  lastNotificationResponse: Notifications.NotificationResponse | null;
  notificationNavigationUrl: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
  value: NotificationContextType;
}

export function NotificationProvider({ children, value }: NotificationProviderProps) {
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
