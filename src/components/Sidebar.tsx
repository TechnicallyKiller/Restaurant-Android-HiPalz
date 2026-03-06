import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../theme/neoBrutalism';
import { CONFIG } from '../config/env';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function Sidebar({ visible, onClose, onLogout }: SidebarProps) {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const isDark = useThemeStore(s => s.isDark);
  const setDark = useThemeStore(s => s.setDark);
  const c = getColors(isDark);

  useEffect(() => {
    useThemeStore.getState().hydrate();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        onClose();
        await logout();
        onLogout();
      }},
    ]);
  };

  const displayName = user?.nickName ?? user?.userId ?? 'Guest';
  const connectedDisplay = (() => {
    const url = CONFIG.API_BASE_URL || '';
    if (!url) return '—';
    try {
      const u = new URL(url);
      const host = u.hostname || u.host || url;
      return u.port && u.port !== '80' && u.port !== '443' ? `${host}:${u.port}` : host;
    } catch {
      return url;
    }
  })();

  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent>
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[styles.sheet, { backgroundColor: c.base100, borderRightColor: c.brutalBorder }]}>
        <View style={[styles.section, { borderBottomColor: c.brutalBorder }]}>
          <Text style={[styles.label, { color: c.mutedForeground }]}>Logged in as</Text>
          <Text style={[styles.value, { color: c.foreground }]} numberOfLines={1}>{displayName}</Text>
        </View>
        <View style={[styles.section, { borderBottomColor: c.brutalBorder }]}>
          <Text style={[styles.label, { color: c.mutedForeground }]}>Connected IP</Text>
          <Text style={[styles.value, { color: c.foreground }]} numberOfLines={2} selectable>
            {connectedDisplay}
          </Text>
        </View>
        <View style={[styles.section, styles.row, { borderBottomColor: c.brutalBorder }]}>
          <Text style={[styles.label, { color: c.foreground }]}>Dark mode</Text>
          <Switch
            value={isDark}
            onValueChange={v => setDark(v)}
            trackColor={{ false: c.base300, true: c.tertiary }}
            thumbColor={c.base100}
          />
        </View>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: c.error, borderWidth: 3 }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutBtnText, { color: c.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    borderRightWidth: 3,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  section: {
    paddingVertical: 16,
    borderBottomWidth: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '600' },
  spacer: { flex: 1 },
  logoutBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutBtnText: { fontSize: 16, fontWeight: '700', textTransform: 'uppercase' },
});
