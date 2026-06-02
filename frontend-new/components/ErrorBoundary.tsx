import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type State = { hasError: boolean; message: string };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackLabel?: string },
  State
> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, message: error?.message || 'Something went wrong.' };
  }

  componentDidCatch(error: any, info: any) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Ionicons name="warning-outline" size={40} color="#D97706" />
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.msg}>{this.state.message}</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => this.setState({ hasError: false, message: '' })}
        >
          <Text style={styles.btnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#0F172A' },
  title: { color: '#F1F5F9', fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  msg: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btn: { backgroundColor: '#1D4ED8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
