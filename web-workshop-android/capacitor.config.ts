import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tasaheel.workshop',
  appName: 'تساهيل - الورشة',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_tasaheel',
      iconColor: '#D90408',
    },
    App: {},
  },
};

export default config;
