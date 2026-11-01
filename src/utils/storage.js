// Safe localStorage utilities with error handling

const KEYS = {
  EVENTS: 'gatherly_events',
  VENDORS: 'gatherly_vendors',
  SETTINGS: 'gatherly_settings',
  SAVED_IDEAS: 'gatherly_saved_ideas',
  ACTIVE_EVENT_ID: 'gatherly_active_event_id',
  AUTH_SESSION: 'gatherly_auth_session',
};

export { KEYS };

function isStorageAvailable() {
  try {
    const test = '__gatherly_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

export function storageAvailable() {
  return isStorageAvailable();
}

export function getItem(key, defaultValue = null) {
  if (!isStorageAvailable()) return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

export function setItem(key, value) {
  if (!isStorageAvailable()) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key) {
  if (!isStorageAvailable()) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function clearAll() {
  if (!isStorageAvailable()) return false;
  try {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    return true;
  } catch {
    return false;
  }
}

export function exportData() {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    events: getItem(KEYS.EVENTS, []),
    vendors: getItem(KEYS.VENDORS, []),
    savedIdeas: getItem(KEYS.SAVED_IDEAS, []),
    settings: getItem(KEYS.SETTINGS, {}),
    activeEventId: getItem(KEYS.ACTIVE_EVENT_ID, null),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gatherly-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
