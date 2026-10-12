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
    Keyboard: {
      resize: 'none',
      style: 'LIGHT',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
