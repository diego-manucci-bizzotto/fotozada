const DEVICE_KEY = "fotozada_device_id";

// Stable per-device id kept in localStorage (anti double-submit metadata).
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function newId(): string {
  return crypto.randomUUID();
}
