import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

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
        placeholderTextColor="#94A3B8"
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
    color: '#94A3B8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#F87171',
  },
  errorText: {
    fontSize: 12,
    color: '#F87171',
    marginTop: 6,
  },
});
