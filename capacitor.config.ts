import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.totea.app',
  appName: 'توتیا',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'disable',
    },
    Keyboard: {
      resize: 'none',
      style: 'LIGHT',
      resizeOnFullScreen: false,
    },
  },
};

export default config;
