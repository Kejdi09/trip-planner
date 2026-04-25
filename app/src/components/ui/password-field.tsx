import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

type PasswordFieldProps = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  label: string;
  isPasswordVisible: boolean;
  onToggleVisibility?: () => void;
  showToggle?: boolean;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  eyeButtonStyle?: StyleProp<ViewStyle>;
};

export function PasswordField({
  label,
  isPasswordVisible,
  onToggleVisibility,
  showToggle = true,
  labelStyle,
  containerStyle,
  inputStyle,
  eyeButtonStyle,
  ...textInputProps
}: PasswordFieldProps) {
  const shouldRenderToggle = showToggle && Boolean(onToggleVisibility);

  return (
    <>
      <Text style={labelStyle}>{label}</Text>
      <View style={containerStyle}>
        <TextInput {...textInputProps} secureTextEntry={!isPasswordVisible} style={inputStyle} />

        {shouldRenderToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            style={eyeButtonStyle}
            onPress={onToggleVisibility}>
            <Feather name={isPasswordVisible ? 'eye' : 'eye-off'} size={19} color="#B8BAC0" />
          </Pressable>
        ) : null}
      </View>
    </>
  );
}
