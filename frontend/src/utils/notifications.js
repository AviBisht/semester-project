const SUBSCRIBER_TOKEN_KEY = 'dects_subscriber_token';
const SUBSCRIBER_COORDS_KEY = 'dects_subscriber_coords';

export function getStoredSubscriberToken() {
  return localStorage.getItem(SUBSCRIBER_TOKEN_KEY);
}

export function setStoredSubscriberToken(token) {
  if (token) {
    localStorage.setItem(SUBSCRIBER_TOKEN_KEY, token);
  }
}

export function clearStoredSubscriberToken() {
  localStorage.removeItem(SUBSCRIBER_TOKEN_KEY);
  localStorage.removeItem(SUBSCRIBER_COORDS_KEY);
}

export function getStoredSubscriberCoords() {
  const data = localStorage.getItem(SUBSCRIBER_COORDS_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredSubscriberCoords(coords) {
  if (coords) {
    localStorage.setItem(SUBSCRIBER_COORDS_KEY, JSON.stringify(coords));
  }
}

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      return reg;
    } catch (err) {
      console.warn('Service worker registration failed:', err);
      return null;
    }
  }
  return null;
}

export async function requestBrowserNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  return Notification.permission;
}
