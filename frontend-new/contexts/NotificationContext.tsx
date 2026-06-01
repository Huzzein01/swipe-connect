import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppNotification = {
  id: string;
  type: 'application' | 'match' | 'system';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  meta?: {
    jobId?: string;
    jobTitle?: string;
    company?: string;
    applicationUrl?: string;
    emailSent?: boolean;
  };
};

type NotificationContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
};

const STORAGE_KEY = 'swipeconnect.notifications';
const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) try { setNotifications(JSON.parse(raw)); } catch { /* ignore */ }
    });
  }, []);

  const persist = (next: AppNotification[]) => {
    setNotifications(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addNotification = (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newN: AppNotification = {
      ...n,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    persist([newN, ...notifications].slice(0, 50));
  };

  const markAllRead = () => persist(notifications.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => persist(notifications.map((n) => n.id === id ? { ...n, read: true } : n));
  const clearAll = () => persist([]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
        addNotification,
        markAllRead,
        markRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
