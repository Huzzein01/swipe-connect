import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  children: React.ReactNode;
  navigation?: any;        // when provided, fallback shows a "Go back" action
  label?: string;          // optional screen name for the log
};
type State = { hasError: boolean; message: string };

/**
 * Error boundary. Used two ways:
 *  - Global (App.tsx): last-resort catch for provider/navigation errors.
 *  - Per-screen (withBoundary): isolates a screen crash so the tab bar / header
 *    rendered by the navigator stay alive and the user can navigate away.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, message: error?.message || String(error) || 'Unexpected error' };
  }

  componentDidCatch(error: any, info: any) {
    // Visible in console for diagnosis; never rethrows.
    console.error(`[ErrorBoundary${this.props.label ? ':' + this.props.label : ''}]`, error?.message, info?.componentStack);
  }

  reset = () => this.setState({ hasError: false, message: '' });

  goBack = () => {
    this.reset();
    const nav = this.props.navigation;
    try {
      if (nav?.canGoBack?.()) nav.goBack();
      else nav?.navigate?.('Home');
    } catch { /* ignore */ }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.iconWrap}>
            <Ionicons name="alert-circle-outline" size={44} color="#F59E0B" />
          </View>
          <Text style={styles.title}>This screen hit a snag</Text>
          <Text style={styles.msg}>{this.state.message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btn} onPress={this.reset} activeOpacity={0.85}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.btnText}>Try again</Text>
            </TouchableOpacity>
            {this.props.navigation && (
              <TouchableOpacity style={styles.btnGhost} onPress={this.goBack} activeOpacity={0.85}>
                <Ionicons name="arrow-back" size={16} color="#93C5FD" />
                <Text style={styles.btnGhostText}>Go back</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }
}

/** Wrap a screen component so its crashes never take down navigation. */
export function withBoundary<P extends { navigation?: any }>(
  Component: React.ComponentType<P>,
  label?: string
): React.FC<P> {
  return function Wrapped(props: P) {
    return (
      <ErrorBoundary navigation={(props as any).navigation} label={label}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { color: '#F1F5F9', fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  msg: { color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 24, maxWidth: 320 },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1D4ED8', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnGhost: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  btnGhostText: { color: '#93C5FD', fontSize: 15, fontWeight: '700' },
});
