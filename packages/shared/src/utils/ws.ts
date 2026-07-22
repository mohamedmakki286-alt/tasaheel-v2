const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  if (API_BASE.startsWith('http://')) {
    return API_BASE.replace('http://', 'ws://').replace('/api', '') + '/ws';
  }

  if (API_BASE.startsWith('https://')) {
    return API_BASE.replace('https://', 'wss://').replace('/api', '') + '/ws';
  }

  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}
