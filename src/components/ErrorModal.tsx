import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useErrorStore } from '../store/errorStore';
import { useAuthStore } from '../store/authStore';
import { resetToLogin, resetToTables } from '../navigation/rootNavigation';
import type { ErrorActionType } from '../utils/errorHandling';

export default function ErrorModal() {
  const { isOpen, title, message, actions, clearError } = useErrorStore();
  const logout = useAuthStore(s => s.logout);

  const handleAction = async (type: ErrorActionType) => {
    clearError();
    switch (type) {
      case 'go_to_login':
        await logout();
        resetToLogin();
        break;
      case 'go_home':
        resetToTables();
        break;
      case 'reconnect':
        try {
          const { discoveryService } = require('../services/discoveryService');
          await discoveryService.reDiscoverServer();
        } catch (e) {
          console.error('[ErrorModal] Reconnect failed:', e);
        }
        break;
      case 'refresh':
        break;
      case 'dismiss':
      default:
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.centered}>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.actions}>
              {actions.map(({ type, label }) => (
                <TouchableOpacity
                  key={`${type}-${label}`}
                  style={[
                    styles.button,
                    type === 'dismiss' && styles.buttonPrimary,
                  ]}
                  onPress={() => handleAction(type)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      type === 'dismiss' && styles.buttonTextPrimary,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  centered: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#334155',
  },
  buttonPrimary: {
    backgroundColor: '#FFD700',
  },
  buttonText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 15,
  },
  buttonTextPrimary: {
    color: '#0F172A',
  },
});
