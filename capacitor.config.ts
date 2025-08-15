import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.disa.intelligence.hub',
  appName: 'Smart Forge',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false, // We will hide it manually in the app
      backgroundColor: "#111827",
      showSpinner: true,
      spinnerColor: "#C8102E",
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
        presentationOptions: ["badge", "sound", "alert"],
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#111827"
    }
  }
};

export default config;