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
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { jobService } from '../services/jobService';
import { isValidEmail, getPasswordStrength, getPasswordStrengthColor } from '../utils/validation';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';
import Logo from '../components/Logo';
import KeyboardDismissWrapper from '../components/KeyboardDismissWrapper';

type Props = { navigation: any };

const RegisterScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState({ score: 0, feedback: '' });
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { register, signInPreview, isLoading } = useAuth();
  const { theme, isDark } = useTheme();

  useEffect(() => {
    if (password) setStrength(getPasswordStrength(password));
  }, [password]);

  const validate = (): string | null => {
    if (!name.trim()) return 'Please enter your full name.';
    if (!email.trim()) return 'Please enter your email address.';
    if (!isValidEmail(email)) return 'Please enter a valid email address.';
    if (!password) return 'Please choose a password.';
    if (strength.score < 3) return 'Please choose a stronger password.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    if (!agreedToTerms) return 'Please agree to the Terms and Privacy Policy.';
    return null;
  };

  const handleRegister = async () => {
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    try {
      await register(email.trim(), password, name.trim());
    } catch (e: any) {
      setError(e?.message || 'Failed to create account. Please try again.');
    }
  };

  const handlePreview = async () => {
    try {
      await signInPreview();
    } catch (e: any) {
      setError(e?.message || 'Preview login unavailable.');
    }
  };

  const handleLinkedIn = () => {
    const backendRoot = jobService.apiBaseUrl.replace(/\/api$/, '');
    const url = `${backendRoot}/auth/linkedin`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = url;
    } else {
      Linking.openURL(url).catch(() => setError('LinkedIn setup needed. Check backend .env.'));
    }
  };

  const strengthBarWidth = password ? `${(strength.score / 5) * 100}%` : '0%';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardDismissWrapper>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.logoRow}>
              <Logo size={56} color={theme.primary} />
            </View>

            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.heading}>
                <Text style={[styles.title, { color: theme.foreground }]}>Join SwipeConnect</Text>
                <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>Start swiping your way to your dream job</Text>
              </View>

              {/* Error banner */}
              {error ? (
                <View style={[styles.errorBanner, { backgroundColor: `${theme.destructive}12`, borderColor: `${theme.destructive}40` }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={theme.destructive} />
                  <Text style={[styles.errorText, { color: theme.destructive }]}>{error}</Text>
                </View>
              ) : null}

              {/* Name */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.foreground }]}>Full Name</Text>
                <View style={[styles.inputWrap, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#fff' }]}>
                  <Ionicons name="person-outline" size={20} color={theme.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.foreground }]}
                    placeholder="John Doe"
                    placeholderTextColor={theme.mutedForeground}
                    value={name}
                    onChangeText={(t) => { setName(t); setError(''); }}
                    autoCapitalize="words"
                    textContentType="name"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.foreground }]}>Email Address</Text>
                <View style={[styles.inputWrap, { borderColor: emailError ? theme.destructive : theme.border, backgroundColor: isDark ? theme.card : '#fff' }]}>
                  <Ionicons name="mail-outline" size={20} color={theme.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.foreground }]}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.mutedForeground}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      setError('');
                      setEmailError(t && !isValidEmail(t) ? 'Invalid email format' : '');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textContentType="emailAddress"
                    editable={!isLoading}
                  />
                </View>
                {emailError ? <Text style={[styles.fieldError, { color: theme.destructive }]}>{emailError}</Text> : null}
              </View>

              {/* Password */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.foreground }]}>Password</Text>
                <View style={[styles.inputWrap, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#fff' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.foreground }]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.mutedForeground}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setError(''); }}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    editable={!isLoading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eye}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.mutedForeground} />
                  </TouchableOpacity>
                </View>
                {password ? (
                  <View style={styles.strengthWrap}>
                    <View style={[styles.strengthBar, { backgroundColor: theme.muted }]}>
                      <View style={[styles.strengthFill, { width: strengthBarWidth as any, backgroundColor: getPasswordStrengthColor(strength.score) }]} />
                    </View>
                    <Text style={[styles.strengthText, { color: theme.mutedForeground }]}>{strength.feedback}</Text>
                  </View>
                ) : null}
              </View>

              {/* Confirm Password */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.foreground }]}>Confirm Password</Text>
                <View style={[styles.inputWrap, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#fff' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.foreground }]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.mutedForeground}
                    value={confirmPassword}
                    onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Terms */}
              <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedToTerms(!agreedToTerms)} activeOpacity={0.7}>
                <View style={[styles.checkbox, { borderColor: agreedToTerms ? theme.primary : theme.border }, agreedToTerms && { backgroundColor: theme.primary }]}>
                  {agreedToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[styles.termsText, { color: theme.mutedForeground }]}>
                  I agree to the <Text style={{ color: theme.primary }}>Terms of Service</Text> and <Text style={{ color: theme.primary }}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              {/* Create account */}
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primary }, isLoading && styles.disabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" />
                  : <View style={styles.btnRow}>
                      <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>Create Account</Text>
                      <Ionicons name="arrow-forward" size={18} color={theme.primaryForeground} />
                    </View>
                }
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.line, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.mutedForeground, backgroundColor: theme.card }]}>Or sign up with</Text>
                <View style={[styles.line, { backgroundColor: theme.border }]} />
              </View>

              {/* LinkedIn */}
              <TouchableOpacity style={[styles.socialBtn, { borderColor: theme.border }]} onPress={handleLinkedIn} activeOpacity={0.7}>
                <Ionicons name="logo-linkedin" size={20} color="#0A66C2" />
                <Text style={[styles.socialBtnText, { color: theme.foreground }]}>Continue with LinkedIn</Text>
              </TouchableOpacity>

              {/* Preview */}
              <TouchableOpacity style={[styles.socialBtn, styles.previewBtn, { borderColor: theme.border }]} onPress={handlePreview} activeOpacity={0.7}>
                <Ionicons name="person-circle-outline" size={20} color={theme.primary} />
                <Text style={[styles.socialBtnText, { color: theme.foreground }]}>Preview Account</Text>
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={[styles.loginText, { color: theme.mutedForeground }]}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
                  <Text style={[styles.loginLink, { color: theme.primary }]}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.benefits}>
              {['Start swiping immediately', 'Free AI resume parsing', 'Match with perfect jobs'].map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                  <Text style={[styles.benefitText, { color: theme.mutedForeground }]}>{b}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </KeyboardDismissWrapper>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing['3xl'] },
  logoRow: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  card: { borderRadius: BorderRadius['2xl'], borderWidth: 1, padding: Spacing['3xl'] },
  heading: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.md, textAlign: 'center' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.lg },
  errorText: { flex: 1, fontSize: FontSize.sm },
  field: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.lg, height: 48 },
  inputIcon: { marginLeft: Spacing.md },
  input: { flex: 1, height: '100%', paddingHorizontal: Spacing.md, fontSize: FontSize.md },
  eye: { paddingHorizontal: Spacing.md, height: '100%', justifyContent: 'center' },
  fieldError: { fontSize: FontSize.xs, marginTop: Spacing.xs },
  strengthWrap: { marginTop: Spacing.sm },
  strengthBar: { height: 4, borderRadius: 2, marginBottom: Spacing.xs },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthText: { fontSize: FontSize.xs },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.xl, gap: Spacing.md },
  checkbox: { width: 20, height: 20, borderRadius: BorderRadius.sm, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  termsText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20 },
  primaryBtn: { height: 52, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.7 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  primaryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing['2xl'] },
  line: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: Spacing.md, fontSize: FontSize.sm },
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.sm },
  previewBtn: { marginTop: Spacing.md },
  socialBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing['2xl'] },
  loginText: { fontSize: FontSize.md },
  loginLink: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  benefits: { marginTop: Spacing['3xl'], gap: Spacing.md },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  benefitText: { fontSize: FontSize.sm },
});

export default RegisterScreen;
