import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from './src/store/authStore';
import { updateApiClientBaseUrl } from './src/api/apiClient';
import { CONFIG } from './src/config/env';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorModal from './src/components/ErrorModal';
import { navigationRef } from './src/navigation/rootNavigation';

const App = () => {
  const [ready, setReady] = useState(false);
  const hydrate = useAuthStore((s: { hydrate: () => Promise<void> }) => s.hydrate);

  useEffect(() => {
    updateApiClientBaseUrl(CONFIG.API_BASE_URL);
    hydrate().finally(() => setReady(true));
  }, [hydrate]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigator />
      <ErrorModal />
    </NavigationContainer>
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
