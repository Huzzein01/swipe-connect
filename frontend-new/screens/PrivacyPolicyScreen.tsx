import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type Props = { navigation: any };

const LAST_UPDATED = 'June 1, 2025';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.foreground }]}>{title}</Text>
      {children}
    </View>
  );
};

const P = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();
  return <Text style={[styles.para, { color: theme.mutedForeground }]}>{children}</Text>;
};

const Bullet = ({ text }: { text: string }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.bullet}>
      <View style={[styles.bulletDot, { backgroundColor: theme.primary }]} />
      <Text style={[styles.bulletText, { color: theme.mutedForeground }]}>{text}</Text>
    </View>
  );
};

const PrivacyPolicyScreen = ({ navigation }: Props) => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.updated, { color: theme.mutedForeground }]}>Last updated: {LAST_UPDATED}</Text>

        <Section title="1. Introduction">
          <P>SwipeConnect ("we", "us", or "our") operates the SwipeConnect mobile application (the "App"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App. Please read this policy carefully. If you disagree with its terms, please discontinue use of the App.</P>
        </Section>

        <Section title="2. Information We Collect">
          <P>We may collect the following categories of information:</P>
          <Bullet text="Account data: name, email address, professional title, and profile photo you provide during registration." />
          <Bullet text="Profile data: skills, work experience, education, career preferences, networking goals, and resume content you voluntarily enter." />
          <Bullet text="Usage data: swipe actions, saved jobs, applied jobs, and app navigation patterns used to improve recommendations." />
          <Bullet text="Device data: device type, operating system, and unique device identifiers for analytics and crash reporting." />
          <Bullet text="Communication data: messages exchanged with other users through the in-app networking chat feature." />
        </Section>

        <Section title="3. How We Use Your Information">
          <P>We use the information we collect to:</P>
          <Bullet text="Provide, maintain, and improve the SwipeConnect App and its features." />
          <Bullet text="Personalise job recommendations and networking matches using AI-powered scoring." />
          <Bullet text="Send transactional emails such as application confirmations and account notifications." />
          <Bullet text="Analyse usage trends to improve the user experience." />
          <Bullet text="Generate AI-tailored resumes and cover letters when you use those features." />
          <Bullet text="Comply with legal obligations and enforce our Terms of Service." />
        </Section>

        <Section title="4. AI Features and Your Data">
          <P>SwipeConnect offers AI-powered features including job match scoring, resume tailoring, and cover letter generation. These features may send portions of your resume, job descriptions, and profile data to third-party AI providers (such as Anthropic) solely to process your request. We do not store your data with AI providers, and your information is not used to train their models under standard commercial agreements.</P>
          <P>AI-generated content is provided for informational purposes. You should review all AI-generated resumes and cover letters before submitting them to employers.</P>
        </Section>

        <Section title="5. Data Sharing and Disclosure">
          <P>We do not sell your personal information. We may share information with:</P>
          <Bullet text="Service providers: third-party vendors who assist us in operating the App (e.g., cloud hosting, email delivery via Resend, analytics)." />
          <Bullet text="AI providers: limited profile and resume data sent to process AI feature requests (see Section 4)." />
          <Bullet text="Legal authorities: when required by law, court order, or to protect the rights, safety, or property of SwipeConnect or others." />
          <Bullet text="Business transfers: in connection with a merger, acquisition, or sale of assets, with notice provided to users." />
        </Section>

        <Section title="6. Data Retention">
          <P>We retain your personal data for as long as your account is active or as necessary to provide services. You may request deletion of your account and associated data at any time via the Account Settings screen. Upon deletion, we will remove your data within 30 days, except where retention is required by law.</P>
        </Section>

        <Section title="7. Data Security">
          <P>We implement industry-standard security measures including HTTPS encryption, JWT-based authentication, and access controls to protect your information. However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security and encourage you to use strong, unique passwords for your account.</P>
        </Section>

        <Section title="8. Your Rights">
          <P>Depending on your location, you may have the following rights regarding your personal data:</P>
          <Bullet text="Access: request a copy of the personal data we hold about you." />
          <Bullet text="Correction: request correction of inaccurate or incomplete data." />
          <Bullet text="Deletion: request deletion of your account and personal data." />
          <Bullet text="Portability: request your data in a machine-readable format." />
          <Bullet text="Objection: object to processing of your data for direct marketing or profiling." />
          <P>To exercise these rights, contact us at privacy@swipeconnect.app.</P>
        </Section>

        <Section title="9. Children's Privacy">
          <P>The App is not intended for use by individuals under the age of 16. We do not knowingly collect personal information from children under 16. If we become aware that a child under 16 has provided us with personal data, we will delete it promptly.</P>
        </Section>

        <Section title="10. Third-Party Links and Services">
          <P>The App may contain links to third-party websites (e.g., employer job application pages). We are not responsible for the privacy practices of those sites. We encourage you to review their privacy policies before providing any personal information.</P>
        </Section>

        <Section title="11. LinkedIn Integration">
          <P>If you choose to sign in with LinkedIn, we receive your basic profile information (name, email, profile photo) from LinkedIn's OAuth service. We do not access your LinkedIn connections, messages, or post on your behalf. You may revoke LinkedIn access at any time via your LinkedIn account settings.</P>
        </Section>

        <Section title="12. Changes to This Policy">
          <P>We may update this Privacy Policy periodically. We will notify you of significant changes via in-app notification or email. Continued use of the App after changes constitutes acceptance of the revised policy. We recommend reviewing this policy regularly.</P>
        </Section>

        <Section title="13. Contact Us">
          <P>If you have questions or concerns about this Privacy Policy or our data practices, please contact us:</P>
          <P>SwipeConnect{'\n'}Email: privacy@swipeconnect.app{'\n'}Website: https://swipeconnect.app</P>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  updated: { fontSize: FontSize.sm, marginBottom: Spacing.xl },
  section: { marginBottom: Spacing['2xl'] },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold, marginBottom: Spacing.md },
  para: { fontSize: FontSize.sm, lineHeight: 22, marginBottom: Spacing.md },
  bullet: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm, alignItems: 'flex-start' },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: FontSize.sm, lineHeight: 22 },
});

export default PrivacyPolicyScreen;
