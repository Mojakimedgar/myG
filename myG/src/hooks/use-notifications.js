import { useEffect, useState } from 'react';
import { requestNotificationPermission, isNotificationsEnabled, getNotificationPermission, } from '@/lib/notifications';
/**
 * Hook to manage notification permissions
 * Automatically handles permission requests and status updates
 */
export const useNotifications = () => {
    const [isEnabled, setIsEnabled] = useState(isNotificationsEnabled());
    const [permission, setPermission] = useState(getNotificationPermission());
    useEffect(() => {
        const checkPermission = () => {
            setPermission(getNotificationPermission());
            setIsEnabled(isNotificationsEnabled());
        };
        checkPermission();
        // Check permission status periodically
        const interval = setInterval(checkPermission, 5000);
        return () => clearInterval(interval);
    }, []);
    const enableNotifications = async () => {
        const newPermission = await requestNotificationPermission();
        setPermission(newPermission);
        const enabled = newPermission === 'granted';
        setIsEnabled(enabled);
        return enabled;
    };
    return {
        isEnabled,
        permission,
        enableNotifications,
    };
};
