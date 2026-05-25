import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { jobService } from '../services/jobService';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';
import Logo from '../components/Logo';

type LoginScreenProps = {
  navigation: any;
};

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const { theme, isDark } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Login Error', 'Invalid email or password. Please try again.');
    }
  };

  const handlePreviewLogin = async () => {
    try {
      await login('preview@swipeconnect.app', 'preview-password');
    } catch (error) {
      Alert.alert('Login Error', 'Unable to open the preview account.');
    }
  };

  const handleLinkedInLogin = async () => {
    const backendRoot = jobService.apiBaseUrl.replace(/\/api$/, '');
    const linkedInUrl = `${backendRoot}/auth/linkedin`;

    try {
      await Linking.openURL(linkedInUrl);
    } catch (error) {
      Alert.alert('LinkedIn setup needed', 'Add LinkedIn OAuth credentials to the backend .env, then try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoRow}>
              <Logo size={56} color={theme.primary} />
            </View>

            {/* Card */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {/* Header */}
              <View style={styles.headerSection}>
                <Text style={[styles.title, { color: theme.foreground }]}>
                  Welcome Back
                </Text>
                <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
                  Sign in to your SwipeConnect account
                </Text>
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.foreground }]}>
                  Email Address
                </Text>
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
                    textContentType="emailAddress"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.foreground }]}>
                  Password
                </Text>
                <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#FFFFFF' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.foreground }]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.mutedForeground}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    editable={!isLoading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={theme.mutedForeground}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot password */}
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotRow}
                disabled={isLoading}
              >
                <Text style={[styles.forgotText, { color: theme.primary }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.primary }, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.primaryForeground} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={[styles.primaryButtonText, { color: theme.primaryForeground }]}>
                      Sign In
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={theme.primaryForeground} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.mutedForeground, backgroundColor: theme.card }]}>
                  Or continue with
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              {/* LinkedIn Button */}
              <TouchableOpacity
                style={[styles.socialButton, { borderColor: theme.border }]}
                onPress={handleLinkedInLogin}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-linkedin" size={20} color="#0A66C2" />
                <Text style={[styles.socialButtonText, { color: theme.foreground }]}>
                  Continue with LinkedIn
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.previewButton, { borderColor: theme.border }]}
                onPress={handlePreviewLogin}
                activeOpacity={0.7}
              >
                <Ionicons name="person-circle-outline" size={20} color={theme.primary} />
                <Text style={[styles.socialButtonText, { color: theme.foreground }]}>
                  Preview Account
                </Text>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View style={styles.bottomLink}>
                <Text style={[styles.bottomLinkText, { color: theme.mutedForeground }]}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isLoading}>
                  <Text style={[styles.bottomLinkAction, { color: theme.primary }]}>
                    Sign up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <Text style={[styles.footerText, { color: theme.mutedForeground }]}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  card: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing['3xl'],
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    height: 48,
  },
  inputIcon: {
    marginLeft: Spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
  },
  eyeButton: {
    paddingHorizontal: Spacing.md,
    height: '100%',
    justifyContent: 'center',
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: Spacing.xl,
  },
  forgotText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  primaryButton: {
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing['2xl'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.sm,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  previewButton: {
    marginTop: Spacing.md,
  },
  socialButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  bottomLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing['2xl'],
  },
  bottomLinkText: {
    fontSize: FontSize.md,
  },
  bottomLinkAction: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  footerText: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    marginTop: Spacing['2xl'],
    paddingHorizontal: Spacing['3xl'],
  },
});

export default LoginScreen;
