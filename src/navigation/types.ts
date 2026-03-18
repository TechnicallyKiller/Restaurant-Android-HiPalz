import type { Table } from '../api/types';
import type { NavigatorScreenParams } from '@react-navigation/native';

// Bottom tab navigator (Tables + Billing)
export type MainTabParamList = {
  TablesTab: undefined;
  BillingTab: undefined;
};

// Root stack wraps auth screens + tab navigator + detail screens
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  POS: undefined;
  LiveCart: undefined;
  Bill: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
