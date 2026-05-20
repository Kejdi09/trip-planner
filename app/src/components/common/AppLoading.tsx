import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

type AppLoadingProps = {
  message?: string;
};

export function AppLoading({ message = 'Getting things ready...' }: AppLoadingProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FCFD', paddingHorizontal: 24 }}>
      <ActivityIndicator size="large" color="#00A7B5" />
      <Text style={{ marginTop: 12, fontSize: 14, fontWeight: '600', color: '#0F766E', textAlign: 'center' }}>{message}</Text>
    </View>
  );
}
