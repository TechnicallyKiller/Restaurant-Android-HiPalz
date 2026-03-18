import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { usePermissionStore } from '../../store/permissionStore';
import { permissionApi } from '../../api/permissionApi';
import {
  colors,
  neoModal,
  neoInput,
  neoButtonPrimary,
  neoButtonOutline,
  borderRadius,
} from '../../theme/neoBrutalism';

export default function PermissionPasswordModal() {
  const isOpen = usePermissionStore(s => s.isPasswordModalOpen);
  const pendingPermission = usePermissionStore(s => s.pendingPermission);
  const onConfirm = usePermissionStore(s => s.onConfirm);
  const closeModal = usePermissionStore(s => s.closePasswordModal);

  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!pendingPermission || !pin.trim()) return;
    setIsVerifying(true);
    setError(null);
    try {
      const valid = await permissionApi.verifyPassword({
        staffPermissionId: pendingPermission.id,
        password: pin.trim(),
      });
      if (valid) {
        onConfirm?.();
        handleClose();
      } else {
        setError('Incorrect PIN. Please try again.');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setError(null);
    setIsVerifying(false);
    closeModal();
  };

  if (!isOpen || !pendingPermission) return null;

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Password Required</Text>
          <Text style={styles.subtitle}>
            This action requires a password for{' '}
            <Text style={styles.permLabel}>
              {pendingPermission.permissionName || pendingPermission.permissionOdn}
            </Text>
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter PIN"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            keyboardType="number-pad"
            value={pin}
            onChangeText={setPin}
            editable={!isVerifying}
            autoFocus
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={({pressed}) => [
                styles.cancelBtn,
                {opacity: pressed ? 0.7 : 1},
              ]}
              onPress={handleClose}
              disabled={isVerifying}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={({pressed}) => [
                styles.submitBtn,
                {opacity: pressed || isVerifying ? 0.7 : 1},
              ]}
              onPress={handleSubmit}
              disabled={isVerifying || !pin.trim()}>
              {isVerifying ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Text style={styles.submitText}>Verify</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    ...neoModal,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 20,
    lineHeight: 20,
  },
  permLabel: {
    fontWeight: '700',
    color: colors.tertiary,
  },
  input: {
    ...neoInput,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    color: colors.foreground,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 12,
  },
  error: {
    fontSize: 13,
    color: colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    ...neoButtonOutline,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelText: {
    color: colors.foreground,
    fontWeight: '600',
    fontSize: 15,
  },
  submitBtn: {
    ...neoButtonPrimary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius,
  },
  submitText: {
    color: colors.primaryForeground,
    fontWeight: '700',
    fontSize: 15,
  },
});
