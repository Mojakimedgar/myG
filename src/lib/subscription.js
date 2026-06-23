export const SUBSCRIPTION_LIMITS = {
    free: {
        maxZones: 3,
        maxMYGs: 1, // One primary user can have 1 guardian
        maxMonitoredUsers: 1, // One guardian can monitor 1 user
        priorityNotifications: false,
        extendedHistory: false,
    },
    premium: {
        maxZones: Infinity,
        maxMYGs: Infinity,
        maxMonitoredUsers: Infinity,
        priorityNotifications: true,
        extendedHistory: true,
    },
};
export const canCreateZone = (user, currentZoneCount) => {
    if (!user)
        return false;
    const limit = SUBSCRIPTION_LIMITS[user.subscriptionTier].maxZones;
    return currentZoneCount < limit;
};
export const canAddMYG = (user, currentMYGCount) => {
    if (!user)
        return false;
    if (user.role !== "primary")
        return false;
    const limit = SUBSCRIPTION_LIMITS[user.subscriptionTier].maxMYGs;
    return currentMYGCount < limit;
};
export const canMonitorUser = (user, currentMonitoredCount) => {
    if (!user)
        return false;
    if (user.role !== "guardian")
        return false;
    const limit = SUBSCRIPTION_LIMITS[user.subscriptionTier].maxMonitoredUsers;
    return currentMonitoredCount < limit;
};
export const hasPriorityNotifications = (user) => {
    if (!user)
        return false;
    return SUBSCRIPTION_LIMITS[user.subscriptionTier].priorityNotifications;
};
export const hasExtendedHistory = (user) => {
    if (!user)
        return false;
    return SUBSCRIPTION_LIMITS[user.subscriptionTier].extendedHistory;
};
