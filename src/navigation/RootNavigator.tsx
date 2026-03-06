import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import TablesScreen from '../screens/TablesScreen';
import POSScreen from '../screens/POSScreen';
import LiveCartScreen from '../screens/LiveCartScreen';
import BillScreen from '../screens/BillScreen';
import OfflineBanner from '../components/OfflineBanner';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <View style={styles.container}>
      <OfflineBanner />
      <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0c0a09' },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Tables" component={TablesScreen} />
      <Stack.Screen name="POS" component={POSScreen} />
      <Stack.Screen name="LiveCart" component={LiveCartScreen} />
      <Stack.Screen name="Bill" component={BillScreen} />
    </Stack.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
