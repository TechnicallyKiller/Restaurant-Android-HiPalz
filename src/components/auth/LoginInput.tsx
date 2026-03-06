import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors, neoInput } from '../../theme/neoBrutalism';

interface LoginInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  containerStyle?: object;
  inputStyle?: object;
}

export default function LoginInput({
  label,
  error,
  containerStyle,
  inputStyle,
  editable = true,
  ...inputProps
}: LoginInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : undefined,
          inputStyle,
        ]}
        placeholderTextColor={colors.mutedForeground}
        editable={editable}
        {...inputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    ...neoInput,
    padding: 16,
    fontSize: 16,
    color: colors.foreground,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
  },
});
