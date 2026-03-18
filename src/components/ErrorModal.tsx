import * as React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useErrorStore } from '../store/errorStore';
import { useAuthStore } from '../store/authStore';
import { resetToLogin, resetToTables } from '../navigation/rootNavigation';
import type { ErrorActionType } from '../utils/errorHandling';
import { discoveryService } from '../services/discoveryService';

export default function ErrorModal() {
  const [isReconnecting, setIsReconnecting] = React.useState(false);
  const { isOpen, title, message, actions, clearError } = useErrorStore();
  const logout = useAuthStore(s => s.logout);

  const handleAction = async (type: ErrorActionType) => {
    if (type === 'reconnect') {
      setIsReconnecting(true);
      try {
        const found = await discoveryService.reDiscoverServer();
        if (found) {
          // Success! Clear error and let the app resume
          clearError();
          setIsReconnecting(false);
          return;
        }
        // If not found, stay open so user can try again
        useErrorStore.getState()
          .setError({
            isOpen: true,
            title: 'Still Not Found',
            message:
              "We scanned the network but still couldn't find the HiPalz Server. Please check if your computer is on and connected to the same Wi-Fi.",
            actions: [
              { type: 'reconnect', label: 'Try Again' },
              { type: 'dismiss', label: 'OK' },
            ],
          });
      } catch (e) {
        console.error('[ErrorModal] Reconnect failed:', e);
      }
      setIsReconnecting(false);
      return;
    }

    clearError();
    switch (type) {
      case 'go_to_login':
        await logout();
        resetToLogin();
        break;
      case 'go_home':
        resetToTables();
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
            <Text style={styles.title}>
              {isReconnecting ? 'Reconnecting...' : title}
            </Text>
            {isReconnecting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>
                  Searching for HiPalz Server on new IP...
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.message}>{message}</Text>
                <View style={styles.actions}>
                  {actions.map(({ type, label }) => (
                    <Pressable
                      key={`${type}-${label}`}
                      style={({ pressed }) => [
                        styles.button,
                        type === 'reconnect' && styles.buttonPrimary,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                      onPress={() => handleAction(type)}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          type === 'reconnect' && styles.buttonTextPrimary,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 15,
    fontSize: 14,
    textAlign: 'center',
  },
});
