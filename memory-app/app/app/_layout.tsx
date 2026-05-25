import React from 'react';
import { Stack } from 'expo-router';
import { I18nManager, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../src/i18n';
import { useUserStore } from '../src/stores/userStore';
import { useProgressStore } from '../src/stores/progressStore';
import { useTranslation } from 'react-i18next';

export default function RootLayout() {
  const { i18n } = useTranslation();
  const hydrateUser = useUserStore(s => s.hydrate);
  const hydrateProgress = useProgressStore(s => s.hydrate);
  const language = useUserStore(s => s.language);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      await Promise.all([hydrateUser(), hydrateProgress()]);
      setReady(true);
    })();
  }, []);

  React.useEffect(() => {
    i18n.changeLanguage(language);
    // RTL toggle for native; on web we rely on writing direction in styles
    if (Platform.OS !== 'web') {
      const want = language === 'he';
      if (I18nManager.isRTL !== want) {
        I18nManager.forceRTL(want);
      }
    }
  }, [language]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
