import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

type StatusMessageProps = {
  message?: string | null;
  style?: StyleProp<TextStyle>;
};

export function StatusMessage({ message, style }: StatusMessageProps) {
  if (!message) {
    return null;
  }

  return <Text style={style}>{message}</Text>;
}