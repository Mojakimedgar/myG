const SETTINGS_STORAGE_KEY = "zonewatch.settings";
export const defaultSettings = {
    geofencingEnabled: true,
    nearRadiusMultiplier: 1.15,
    activityLimit: 10,
};
export function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw)
            return { ...defaultSettings };
        const parsed = JSON.parse(raw);
        return {
            geofencingEnabled: typeof parsed.geofencingEnabled === "boolean"
                ? parsed.geofencingEnabled
                : defaultSettings.geofencingEnabled,
            nearRadiusMultiplier: typeof parsed.nearRadiusMultiplier === "number"
                ? parsed.nearRadiusMultiplier
                : defaultSettings.nearRadiusMultiplier,
            activityLimit: typeof parsed.activityLimit === "number"
                ? parsed.activityLimit
                : defaultSettings.activityLimit,
        };
    }
    catch {
        return { ...defaultSettings };
    }
}
export function saveSettings(next) {
    const merged = { ...loadSettings(), ...next };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    // Notify listeners
    const event = new CustomEvent("app:settings-updated", { detail: merged });
    window.dispatchEvent(event);
}
export function onSettingsUpdated(handler) {
    const listener = (e) => {
        const ce = e;
        if (ce.detail)
            handler(ce.detail);
    };
    window.addEventListener("app:settings-updated", listener);
    return () => window.removeEventListener("app:settings-updated", listener);
}
