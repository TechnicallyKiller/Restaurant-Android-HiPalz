import type { Table } from '../api/types';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Tables: undefined;
  POS: undefined;
  LiveCart: undefined;
  Bill: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
