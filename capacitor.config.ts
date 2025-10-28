import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mediatagger.app',
  appName: 'MediaTagger',
  webDir: 'www', // Carpeta de salida del build web
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen'
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#3880ff'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3880ff',
      showSpinner: false
    }
  }
};

export default config;
