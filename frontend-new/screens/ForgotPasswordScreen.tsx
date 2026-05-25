import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';
import KeyboardDismissWrapper from '../components/KeyboardDismissWrapper';

type ForgotPasswordScreenProps = {
  navigation: any;
};

const ForgotPasswordScreen = ({ navigation }: ForgotPasswordScreenProps) => {
  const { theme, isDark } = useTheme();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(email);
      Alert.alert(
        'Success',
        'Password reset email sent. Please check your inbox.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardDismissWrapper>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoRow}>
              <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}15` }]}>
                <Ionicons name="lock-open-outline" size={32} color={theme.primary} />
              </View>
            </View>

            {/* Card */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.headerSection}>
                <Text style={[styles.title, { color: theme.foreground }]}>Reset Password</Text>
                <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
                  Enter your email address and we'll send you a link to reset your password
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.foreground }]}>Email Address</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#FFFFFF' }]}>
                  <Ionicons name="mail-outline" size={20} color={theme.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.foreground }]}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.mutedForeground}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.primary }, isLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.primaryForeground} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={[styles.primaryButtonText, { color: theme.primaryForeground }]}>
                      Send Reset Link
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={theme.primaryForeground} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backRow}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={16} color={theme.mutedForeground} />
                <Text style={[styles.backText, { color: theme.mutedForeground }]}>
                  Back to Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </KeyboardDismissWrapper>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl },
  logoRow: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { borderRadius: BorderRadius['2xl'], borderWidth: 1, padding: Spacing['3xl'] },
  headerSection: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },
  fieldGroup: { marginBottom: Spacing.xl },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.sm },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    height: 48,
  },
  inputIcon: { marginLeft: Spacing.md },
  input: { flex: 1, height: '100%', paddingHorizontal: Spacing.md, fontSize: FontSize.md },
  primaryButton: {
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  primaryButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing['2xl'],
    gap: Spacing.xs,
  },
  backText: { fontSize: FontSize.md },
});

export default ForgotPasswordScreen;
