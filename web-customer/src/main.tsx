import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';
import App from './App';
import './index.css';
import './i18n/i18n';

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('native-app', `native-${Capacitor.getPlatform()}`);
}

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: Capacitor.isNativePlatform() ? 0 : 0.05,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
