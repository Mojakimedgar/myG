/**
 * Browser notification utility for showing system/device notifications
 * Uses the Notifications API to display alerts in the device notification panel
 */

interface BrowserNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string; // For grouping similar notifications
  requireInteraction?: boolean; // Keep notification until user interacts
  data?: Record<string, any>;
}

/**
 * Request permission for browser notifications
 * Required before showing any notifications
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  return 'denied';
};

/**
 * Show a browser notification
 * Will request permission if not already granted
 */
export const showNotification = async (options: BrowserNotificationOptions): Promise<void> => {
    if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }

  if (Notification.permission === 'denied') {
    console.log('Notification permission denied');
    return;
  }

  if (Notification.permission === 'default') {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return;
    }
  }


  try {
    // Get the active service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Use the registration to show the notification
    // This allows it to show even if the tab is in the background
    await registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/vite.svg',
      badge: options.badge,
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      data: options.data,
    });
  } catch (error) {
    console.error('Error showing background notification:', error);
    // Fallback for older browsers
    new Notification(options.title, options);
  }
};


/**
 * Show a safety check notification
 */
export const showSafetyCheckNotification = async (
  message: string,
  initiatedBy: string,
  checkId: string
): Promise<void> => {
  await showNotification({
    title: '🚨 Safety Check Required',
    body: message || 'Are you safe?',
    icon: '/vite.svg',
    tag: `safety-check-${checkId}`,
    requireInteraction: true,
    data: {
      type: 'safety-check',
      checkId,
      initiatedBy,
    },
  });
};

/**
 * Show a zone breach notification
 */
export const showZoneBreachNotification = async (
  kidName: string,
  zoneName: string,
  breachType: 'entering' | 'leaving'
  
): Promise<void> => {
  const action = breachType === 'entering' ? 'entering' : 'left';
  console.log("Zone Breach Triggered for:", kidName);
  const permission = await requestNotificationPermission();
  console.log("Permission status:", permission);
  await showNotification({
    title: '⚠️ Zone Alert',
    body: `${kidName} ${action} ${zoneName}`,
    icon: '/vite.svg',
    tag: `zone-breach-${kidName}`,
    requireInteraction: false,
    data: {
      type: 'zone-breach',
      kidName,
      zoneName,
      breachType,
    },
  });
  
};

/**
 * Show a general alert notification
 */
export const showAlertNotification = async (
  title: string,
  message: string,
  priority: 'low' | 'medium' | 'high' = 'medium'
): Promise<void> => {
  const icons: Record<string, string> = {
    low: 'ℹ️',
    medium: '⚠️',
    high: '🚨',
  };

  await showNotification({
    title: `${icons[priority]} ${title}`,
    body: message,
    icon: '/vite.svg',
    requireInteraction: priority === 'high',
    data: {
      type: 'alert',
      priority,
    },
  });
};

/**
 * Check if notifications are supported and permission is granted
 */
export const isNotificationsEnabled = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
};

/**
 * Get the current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};
