import type { Table } from '../api/types';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Tables: undefined;
  POS: undefined;
  Bill: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
