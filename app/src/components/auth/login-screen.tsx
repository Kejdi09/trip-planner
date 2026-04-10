import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/components/auth/login-screen.styles';

export function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <View style={styles.topSection}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Feather name="navigation" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>TripSync</Text>
          </View>

          <View style={styles.tabsRow}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: true }}
              style={[styles.tabButton, styles.tabButtonActive]}>
              <Text style={[styles.tabLabel, styles.tabLabelActive]}>Log in</Text>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: false }}
              style={styles.tabButton}>
              <Text style={styles.tabLabel}>Sign up</Text>
            </Pressable>
          </View>

          <Text style={styles.inputLabel}>Your Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
            placeholder="Enter email or username"
            placeholderTextColor="#A8A9AE"
            style={[styles.input, styles.emailInput]}
          />

          <Text style={styles.inputLabel}>Password</Text>

          <View style={styles.passwordInputContainer}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              secureTextEntry={!isPasswordVisible}
              placeholder="Enter password"
              placeholderTextColor="#A8A9AE"
              style={[styles.input, styles.passwordInput]}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
              style={styles.eyeButton}
              onPress={() => setIsPasswordVisible((current) => !current)}>
              <Feather name={isPasswordVisible ? 'eye' : 'eye-off'} size={19} color="#B8BAC0" />
            </Pressable>
          </View>

          <Pressable accessibilityRole="button" style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>

          <Pressable accessibilityRole="button" style={styles.forgotLink}>
            <Text style={styles.forgotLinkText}>Forgot password?</Text>
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{"Don't have an account? "}</Text>
          <Pressable accessibilityRole="button">
            <Text style={styles.footerAction}>Sign up</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
