import React, { useState, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { isValidEmail, getPasswordStrength, getPasswordStrengthColor } from '../utils/validation';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';
import Logo from '../components/Logo';

type RegisterScreenProps = {
  navigation: any;
};

const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
  const [emailError, setEmailError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { register, isLoading } = useAuth();
  const { theme, isDark } = useTheme();

  useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    }
  }, [password]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name.');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email.');
      return false;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return false;
    }
    if (!password) {
      Alert.alert('Validation Error', 'Please enter a password.');
      return false;
    }
    if (passwordStrength.score < 3) {
      Alert.alert('Validation Error', 'Please choose a stronger password.');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return false;
    }
    if (!agreedToTerms) {
      Alert.alert('Validation Error', 'Please agree to the Terms and Privacy Policy.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    try {
      await register(email, password, name);
      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Registration Error', 'Failed to create account. Please try again.');
    }
  };

  const strengthBarWidth = password ? `${(passwordStrength.score / 5) * 100}%` : '0%';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <View style={styles.logoRow}>
              <Logo size={56} color={theme.primary} />
            </View>

            {/* Card */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.headerSection}>
                <Text style={[styles.title, { color: theme.foreground }]}>
                  Join SwipeConnect
                </Text>
                <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
                  Start swiping your way to your dream job
                </Text>
              </View>

              {/* Full Name */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.foreground }]}>Full Name</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#FFFFFF' }]}>
                  <Ionicons name="person-outline" size={20} color={theme.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.foreground }]}
                    placeholder="John Doe"
                    placeholderTextColor={theme.mutedForeground}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    textContentType="name"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.foreground }]}>Email Address</Text>
                <View style={[
                  styles.inputWrapper,
                  { borderColor: emailError ? theme.destructive : theme.border, backgroundColor: isDark ? theme.card : '#FFFFFF' },
                ]}>
                  <Ionicons name="mail-outline" size={20} color={theme.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.foreground }]}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.mutedForeground}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setEmailError(text && !isValidEmail(text) ? 'Invalid email format' : '');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textContentType="emailAddress"
                    editable={!isLoading}
                  />
                </View>
                {emailError ? (
                  <Text style={[styles.errorText, { color: theme.destructive }]}>{emailError}</Text>
                ) : null}
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.foreground }]}>Password</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#FFFFFF' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.foreground }]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.mutedForeground}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
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
                {password ? (
                  <View style={styles.strengthContainer}>
                    <View style={[styles.strengthBar, { backgroundColor: theme.muted }]}>
                      <View
                        style={[
                          styles.strengthFill,
                          {
                            width: strengthBarWidth as any,
                            backgroundColor: getPasswordStrengthColor(passwordStrength.score),
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.strengthText, { color: theme.mutedForeground }]}>
                      {passwordStrength.feedback}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: theme.foreground }]}>Confirm Password</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#FFFFFF' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.foreground }]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.mutedForeground}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Terms */}
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: agreedToTerms ? theme.primary : theme.border },
                  agreedToTerms && { backgroundColor: theme.primary },
                ]}>
                  {agreedToTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.termsText, { color: theme.mutedForeground }]}>
                  I agree to the{' '}
                  <Text style={{ color: theme.primary }}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={{ color: theme.primary }}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              {/* Create Account Button */}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.primary }, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.primaryForeground} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={[styles.primaryButtonText, { color: theme.primaryForeground }]}>
                      Create Account
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={theme.primaryForeground} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.mutedForeground, backgroundColor: theme.card }]}>
                  Or sign up with
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              {/* LinkedIn */}
              <TouchableOpacity
                style={[styles.socialButton, { borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-linkedin" size={20} color={isDark ? theme.foreground : '#0A66C2'} />
                <Text style={[styles.socialButtonText, { color: theme.foreground }]}>LinkedIn</Text>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.bottomLink}>
                <Text style={[styles.bottomLinkText, { color: theme.mutedForeground }]}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
                  <Text style={[styles.bottomLinkAction, { color: theme.primary }]}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Benefits */}
            <View style={styles.benefits}>
              {['Start swiping immediately', 'Free AI resume parsing', 'Match with perfect jobs'].map((benefit, idx) => (
                <View key={idx} style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                  <Text style={[styles.benefitText, { color: theme.mutedForeground }]}>{benefit}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['3xl'],
  },
  logoRow: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  card: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing['3xl'],
  },
  headerSection: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.md, textAlign: 'center' },
  fieldGroup: { marginBottom: Spacing.lg },
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
  eyeButton: { paddingHorizontal: Spacing.md, height: '100%', justifyContent: 'center' },
  errorText: { fontSize: FontSize.xs, marginTop: Spacing.xs },
  strengthContainer: { marginTop: Spacing.sm },
  strengthBar: { height: 4, borderRadius: 2, marginBottom: Spacing.xs },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthText: { fontSize: FontSize.xs },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20 },
  primaryButton: {
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  primaryButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing['2xl'] },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: Spacing.md, fontSize: FontSize.sm },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  socialButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  bottomLink: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing['2xl'] },
  bottomLinkText: { fontSize: FontSize.md },
  bottomLinkAction: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  benefits: { marginTop: Spacing['3xl'], gap: Spacing.md },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  benefitText: { fontSize: FontSize.sm },
});

export default RegisterScreen;
