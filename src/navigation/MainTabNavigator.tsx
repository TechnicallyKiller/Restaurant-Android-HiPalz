import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import TablesScreen from '../screens/TablesScreen';
import BillingHistoryScreen from '../screens/BillingHistoryScreen';
import { colors } from '../theme/neoBrutalism';
import { useAuthStore } from '../store/authStore';
import { usePermissionStore } from '../store/permissionStore';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icon = label === 'Tables' ? '🍽' : '🧾';
  return (
    <View style={styles.tabIconWrap}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
    </View>
  );
}

export default function MainTabNavigator() {
  const user = useAuthStore(s => s.user);
  const permissions = usePermissionStore(s => s.permissions);
  const fetchPermissions = usePermissionStore(s => s.fetchPermissions);

  useEffect(() => {
    if (user?.outletId && user?.id && permissions.length === 0) {
      fetchPermissions(user.outletId, user.id);
    }
  }, [user?.outletId, user?.id, fetchPermissions, permissions.length]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.tertiary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="TablesTab"
        component={TablesScreen}
        options={{
          tabBarLabel: 'Tables',
          tabBarIcon: ({ focused }) => <TabIcon label="Tables" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="BillingTab"
        component={BillingHistoryScreen}
        options={{
          tabBarLabel: 'Billing',
          tabBarIcon: ({ focused }) => <TabIcon label="Billing" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.base100,
    borderTopWidth: 3,
    borderTopColor: colors.brutalBorder,
    height: 64,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
  },
  tabIconFocused: {
    fontSize: 22,
  },
});
