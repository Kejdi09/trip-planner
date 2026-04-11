import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkUsernameAvailability, checkEmailAvailability } from '../../../lib/auth-api';
import { supabase } from '../../../lib/supabase';
import { styles } from '@/components/auth/login-screen.styles';

type AuthMode = 'login' | 'signup';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;

export function LoginScreen() {
  const [mode, setMode] = React.useState<AuthMode>('login');
  const isSignup = mode === 'signup';

  const [fullName, setFullName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const onSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setStatusMessage(null);
    setErrorMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    if (isSignup) {
      if (!fullName.trim()) {
        setErrorMessage('Full name is required.');
        return;
      }

      if (!USERNAME_REGEX.test(normalizedUsername)) {
        setErrorMessage('Username must be 3-24 characters using lowercase letters, numbers, or underscores.');
        return;
      }

      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isSignup) {
        const isEmailAvailable = await checkEmailAvailability(normalizedEmail);

if (!isEmailAvailable) {
  setErrorMessage('An account with this email already exists. Try logging in.');
  return;
}

const isAvailable = await checkUsernameAvailability(normalizedUsername);

        if (!isAvailable) {
          setErrorMessage('That username is already taken. Try a different one.');
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              username: normalizedUsername,
            },
          },
        });

        if (error) {
          throw error;
        }

        setPassword('');
        setConfirmPassword('');
        switchMode('login');
        setStatusMessage('Check your email and click the confirmation link to complete sign-up.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        throw error;
      }

      router.replace('/explore');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete authentication.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              accessibilityState={{ selected: mode === 'login' }}
              style={[styles.tabButton, mode === 'login' && styles.tabButtonActive]}
              onPress={() => switchMode('login')}>
              <Text style={[styles.tabLabel, mode === 'login' && styles.tabLabelActive]}>Log in</Text>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'signup' }}
              style={[styles.tabButton, mode === 'signup' && styles.tabButtonActive]}
              onPress={() => switchMode('signup')}>
              <Text style={[styles.tabLabel, mode === 'signup' && styles.tabLabelActive]}>Sign up</Text>
            </Pressable>
          </View>

          {isSignup ? (
            <>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                placeholder="Enter your full name"
                placeholderTextColor="#A8A9AE"
                style={[styles.input, styles.emailInput]}
                editable={!isSubmitting}
              />

              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                placeholder="Choose a unique username"
                placeholderTextColor="#A8A9AE"
                style={[styles.input, styles.emailInput]}
                editable={!isSubmitting}
              />
            </>
          ) : null}

          <Text style={styles.inputLabel}>Your Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="Enter your email"
            placeholderTextColor="#A8A9AE"
            style={[styles.input, styles.emailInput]}
            editable={!isSubmitting}
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
              editable={!isSubmitting}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
              style={styles.eyeButton}
              onPress={() => setIsPasswordVisible((current) => !current)}>
              <Feather name={isPasswordVisible ? 'eye' : 'eye-off'} size={19} color="#B8BAC0" />
            </Pressable>
          </View>

          {isSignup ? (
            <>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                secureTextEntry={!isPasswordVisible}
                placeholder="Re-enter password"
                placeholderTextColor="#A8A9AE"
                style={[styles.input, styles.confirmPasswordInput]}
                editable={!isSubmitting}
              />
            </>
          ) : null}

          {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
          {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}

          <Pressable
            accessibilityRole="button"
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={onSubmit}
            disabled={isSubmitting}>
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Please wait...' : isSignup ? 'Sign up' : 'Continue'}</Text>
          </Pressable>

          {mode === 'login' ? (
            <Pressable accessibilityRole="button" style={styles.forgotLink}>
              <Text style={styles.forgotLinkText}>Forgot password?</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}</Text>
          <Pressable accessibilityRole="button" onPress={() => switchMode(mode === 'signup' ? 'login' : 'signup')}>
            <Text style={styles.footerAction}>{mode === 'signup' ? 'Log in' : 'Sign up'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
