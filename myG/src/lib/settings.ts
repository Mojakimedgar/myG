export interface AppSettings {
  geofencingEnabled: boolean;
  nearRadiusMultiplier: number; // e.g., 1.15 means 15% outside radius is "near"
  activityLimit: number; // how many recent items to show
}

const SETTINGS_STORAGE_KEY = "zonewatch.settings";

export const defaultSettings: AppSettings = {
  geofencingEnabled: true,
  nearRadiusMultiplier: 1.15,
  activityLimit: 10,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw);
    return {
      geofencingEnabled:
        typeof parsed.geofencingEnabled === "boolean"
          ? parsed.geofencingEnabled
          : defaultSettings.geofencingEnabled,
      nearRadiusMultiplier:
        typeof parsed.nearRadiusMultiplier === "number"
          ? parsed.nearRadiusMultiplier
          : defaultSettings.nearRadiusMultiplier,
      activityLimit:
        typeof parsed.activityLimit === "number"
          ? parsed.activityLimit
          : defaultSettings.activityLimit,
    };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(next: Partial<AppSettings>) {
  const merged = { ...loadSettings(), ...next };
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
  // Notify listeners
  const event = new CustomEvent<AppSettings>("app:settings-updated", { detail: merged });
  window.dispatchEvent(event);
}

export function onSettingsUpdated(handler: (settings: AppSettings) => void) {
  const listener = (e: Event) => {
    const ce = e as CustomEvent<AppSettings>;
    if (ce.detail) handler(ce.detail);
  };
  window.addEventListener("app:settings-updated", listener as EventListener);
  return () => window.removeEventListener("app:settings-updated", listener as EventListener);
}

