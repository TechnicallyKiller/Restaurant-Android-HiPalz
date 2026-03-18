import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/store/authStore';
import { useThemeStore } from './src/store/themeStore';
import { updateApiClientBaseUrl } from './src/api/apiClient';
import { CONFIG } from './src/config/env';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorModal from './src/components/ErrorModal';
import PermissionPasswordModal from './src/components/permissions/PermissionPasswordModal';
import { navigationRef } from './src/navigation/rootNavigation';

const App = () => {
  const [ready, setReady] = useState(false);
  const hydrateAuth = useAuthStore((s: { hydrate: () => Promise<void> }) => s.hydrate);
  const hydrateTheme = useThemeStore(s => s.hydrate);

  useEffect(() => {
    updateApiClientBaseUrl(CONFIG.API_BASE_URL);
    Promise.all([hydrateAuth(), hydrateTheme()]).finally(() => setReady(true));
  }, [hydrateAuth, hydrateTheme]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
        <ErrorModal />
        <PermissionPasswordModal />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});

export default App;
