import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export async function openExternalUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url });
      return;
    } catch {
      window.location.assign(url);
      return;
    }
  }

  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) window.location.assign(url);
}

export function googleMapsDirectionsUrl(latitude: number, longitude: number): string {
  const destination = `${latitude},${longitude}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}
