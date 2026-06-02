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
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { jobService } from '../services/jobService';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';
import Logo from '../components/Logo';
import KeyboardDismissWrapper from '../components/KeyboardDismissWrapper';

type Props = { navigation: any };

const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, signInPreview, isLoading } = useAuth();
  const { theme, isDark } = useTheme();

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e?.message || 'Sign in failed. Please try again.');
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardDismissWrapper>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
            <View style={styles.logoRow}>
              <Logo size={56} color={theme.primary} />
            </View>

            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.heading}>
                <Text style={[styles.title, { color: theme.foreground }]}>Welcome back</Text>
                <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>Sign in to your SwipeConnect account</Text>
              </View>

              {/* Error banner */}
              {error ? (
                <View style={[styles.errorBanner, { backgroundColor: `${theme.destructive}12`, borderColor: `${theme.destructive}40` }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={theme.destructive} />
                  <Text style={[styles.errorText, { color: theme.destructive }]}>{error}</Text>
                </View>
              ) : null}

              {/* Email */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.foreground }]}>Email address</Text>
                <View style={[styles.inputWrap, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#fff' }]}>
                  <Ionicons name="mail-outline" size={20} color={theme.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.foreground }]}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.mutedForeground}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textContentType="emailAddress"
                    editable={!isLoading}
                  />
                </View>
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
                    textContentType="password"
                    editable={!isLoading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eye}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.forgotRow} onPress={() => navigation.navigate('ForgotPassword')} disabled={isLoading}>
                <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Sign in button */}
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primary }, isLoading && styles.disabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" />
                  : <View style={styles.btnRow}>
                      <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={18} color={theme.primaryForeground} />
                    </View>
                }
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.line, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.mutedForeground, backgroundColor: theme.card }]}>Or continue with</Text>
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

              <View style={styles.signupRow}>
                <Text style={[styles.signupText, { color: theme.mutedForeground }]}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isLoading}>
                  <Text style={[styles.signupLink, { color: theme.primary }]}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.footer, { color: theme.mutedForeground }]}>
              By signing in you agree to our Terms of Service and Privacy Policy
            </Text>
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: { flex: 1, fontSize: FontSize.sm },
  field: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.lg, height: 48 },
  inputIcon: { marginLeft: Spacing.md },
  input: { flex: 1, height: '100%', paddingHorizontal: Spacing.md, fontSize: FontSize.md },
  eye: { paddingHorizontal: Spacing.md, height: '100%', justifyContent: 'center' },
  forgotRow: { alignItems: 'flex-end', marginBottom: Spacing.xl },
  forgotText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
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
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing['2xl'] },
  signupText: { fontSize: FontSize.md },
  signupLink: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  footer: { textAlign: 'center', fontSize: FontSize.xs, marginTop: Spacing['2xl'], paddingHorizontal: Spacing['3xl'] },
});

export default LoginScreen;
