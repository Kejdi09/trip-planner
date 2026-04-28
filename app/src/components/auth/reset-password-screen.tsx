import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../../lib/supabase';
import { styles } from '@/components/auth/reset-password-screen.styles';
import { BrandHeader } from '@/components/ui/brand-header';
import { PasswordField } from '@/components/ui/password-field';
import { StatusMessage } from '@/components/ui/status-message';

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isPreparingSession, setIsPreparingSession] = React.useState(true);
  const [isRecoveryReady, setIsRecoveryReady] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === 'PASSWORD_RECOVERY' && session) {
        setIsRecoveryReady(true);
        setErrorMessage(null);
        setStatusMessage('Enter your new password to continue.');
      }
    });

    const initializeRecoverySession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        if (data.session) {
          setIsRecoveryReady(true);
          setStatusMessage('Enter your new password to continue.');
          return;
        }

        setIsRecoveryReady(false);
        setErrorMessage('Open this page from the password reset link in your email.');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Open this page from the password reset link in your email.';

        setIsRecoveryReady(false);
        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsPreparingSession(false);
        }
      }
    };

    void initializeRecoverySession();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async () => {
    if (isSubmitting || isPreparingSession) {
      return;
    }

    setStatusMessage(null);
    setErrorMessage(null);

    if (!isRecoveryReady) {
      setErrorMessage('Open this page from the password reset link in your email.');
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw error;
      }

      await supabase.auth.signOut();

      router.replace({
        pathname: '/',
        params: { reset: 'success' },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update password right now.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting || isPreparingSession;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <View style={styles.topSection}>
          <BrandHeader
            containerStyle={styles.brandRow}
            badgeStyle={styles.logoBadge}
            brandTextStyle={styles.brandText}
          />

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Choose a new password for your account to finish recovery.</Text>

          <PasswordField
            label="New Password"
            labelStyle={styles.inputLabel}
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            placeholder="Enter your new password"
            placeholderTextColor="#A8A9AE"
            inputStyle={[styles.input, styles.passwordInput]}
            containerStyle={styles.passwordInputContainer}
            eyeButtonStyle={styles.eyeButton}
            isPasswordVisible={isPasswordVisible}
            onToggleVisibility={() => setIsPasswordVisible((current) => !current)}
            editable={!isBusy}
          />

          <PasswordField
            label="Confirm Password"
            labelStyle={styles.inputLabel}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            placeholder="Re-enter your new password"
            placeholderTextColor="#A8A9AE"
            inputStyle={[styles.input, styles.passwordInput]}
            containerStyle={styles.passwordInputContainer}
            isPasswordVisible={isPasswordVisible}
            showToggle={false}
            editable={!isBusy}
          />

          <StatusMessage message={errorMessage} style={styles.errorMessage} />
          <StatusMessage message={statusMessage} style={styles.statusMessage} />

          <Pressable
            accessibilityRole="button"
            style={[styles.primaryButton, isBusy && styles.primaryButtonDisabled]}
            onPress={onSubmit}
            disabled={isBusy}>
            <Text style={styles.primaryButtonText}>
              {isPreparingSession
                ? 'Verifying link...'
                : isSubmitting
                ? 'Updating password...'
                : 'Set new password'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={styles.backLink}
            onPress={() => router.replace('/')}
            disabled={isBusy}>
            <Text style={styles.backLinkText}>Back to login</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
