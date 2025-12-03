"use client";

import { useState, useEffect } from "react";

export function usePushNotifications() {
  const [isSupported] = useState(false);
  const [permission] = useState<NotificationPermission>("default");
  const [isSubscribed] = useState(false);
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = async (): Promise<boolean> => {
    return false;
  };

  const subscribe = async (): Promise<boolean> => {
    return false;
  };

  const unsubscribe = async (): Promise<void> => {
    // No-op
  };

  const sendTestNotification = async (): Promise<boolean> => {
    return false;
  };

  const clearError = () => {
    setError(null);
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    clearError,
  };
}

