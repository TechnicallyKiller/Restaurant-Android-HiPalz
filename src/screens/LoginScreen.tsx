import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import LoginInput from '../components/auth/LoginInput';
import HipalzLogo from '../components/auth/HipalzLogo';
import { colors, neoCard, neoButtonTertiary, textUppercase } from '../theme/neoBrutalism';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const { login, isLoading, error } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    const trimmed = phone.trim();
    if (!trimmed || !password) return;
    const result = await login(trimmed, password);
    if (result.success) {
      navigation.replace('MainTabs');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <HipalzLogo showIcon />
          <Text style={styles.subtitle}>Staff sign in</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <LoginInput
            label="Phone"
            value={phone || '6863914480'}
            onChangeText={setPhone}
            placeholder="Phone"
            keyboardType="phone-pad"
            autoCapitalize="none"
            editable={!isLoading}
          />
          <LoginInput
            label="Password"
            value={password || '4480'}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            editable={!isLoading}
          />

          <Pressable
            style={({ pressed }) => [
              styles.button,
              isLoading && styles.buttonDisabled,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.buttonText}>Signing In...</Text>
            ) : (
              <Text style={styles.buttonText}>SIGN IN</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const cardStyle = { ...neoCard, padding: 24 };
const buttonStyle = { ...neoButtonTertiary, paddingVertical: 16, alignItems: 'center' as const, marginTop: 8 };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  card: cardStyle,
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  button: buttonStyle,
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    ...textUppercase,
  },
});

export default LoginScreen;
