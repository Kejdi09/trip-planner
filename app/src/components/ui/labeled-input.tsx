import React from 'react';
import { StyleProp, Text, TextInput, TextInputProps, TextStyle } from 'react-native';

type LabeledInputProps = Omit<TextInputProps, 'style'> & {
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function LabeledInput({
  label,
  labelStyle,
  inputStyle,
  ...textInputProps
}: LabeledInputProps) {
  return (
    <>
      <Text style={labelStyle}>{label}</Text>
      <TextInput style={inputStyle} {...textInputProps} />
    </>
  );
}
