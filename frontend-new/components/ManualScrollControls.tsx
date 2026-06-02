import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, Spacing } from '../constants/theme';

const SCROLL_STEP_RATIO = 0.72;

const ManualScrollControls = () => {
  const { theme } = useTheme();
  const [progress, setProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const [pathname, setPathname] = useState('');

  const scrollbarCss = useMemo(() => `
    html, body, #root {
      height: 100%;
      overflow: auto !important;
    }

    * {
      scrollbar-width: auto !important;
      scrollbar-color: ${theme.primary} transparent;
    }

    *::-webkit-scrollbar {
      width: 10px !important;
      height: 10px !important;
      display: block !important;
    }

    *::-webkit-scrollbar-thumb {
      background: ${theme.primary} !important;
      border-radius: 999px !important;
      border: 2px solid transparent !important;
      background-clip: content-box !important;
    }

    *::-webkit-scrollbar-track {
      background: transparent !important;
    }
  `, [theme.primary]);

  const getScrollableElements = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return [];

    const elements = [
      document.scrollingElement,
      document.documentElement,
      document.body,
      ...Array.from(document.querySelectorAll('div, main, section, article')),
    ].filter(Boolean) as HTMLElement[];

    return elements.filter((element) => {
      const rect = element.getBoundingClientRect();
      const computed = getComputedStyle(element);
      const hasScrollableOverflow =
        element === document.scrollingElement ||
        computed.overflowY === 'auto' ||
        computed.overflowY === 'scroll' ||
        computed.overflowY === 'overlay';

      return (
        rect.height > 120 &&
        element.scrollHeight - element.clientHeight > 20 &&
        hasScrollableOverflow &&
        computed.visibility !== 'hidden' &&
        computed.display !== 'none'
      );
    });
  };

  const getPrimaryScrollElement = () => {
    const scrollables = getScrollableElements();
    return scrollables.sort((a, b) => {
      const aOverflow = a.scrollHeight - a.clientHeight;
      const bOverflow = b.scrollHeight - b.clientHeight;
      return bOverflow - aOverflow;
    })[0];
  };

  const refreshProgress = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setPathname((current) => current === window.location.pathname ? current : window.location.pathname);
    }

    const target = getPrimaryScrollElement();
    if (!target) {
      setCanScroll(false);
      setProgress(0);
      return;
    }

    const maxScroll = target.scrollHeight - target.clientHeight;
    setCanScroll(maxScroll > 20);
    setProgress(maxScroll > 0 ? Math.min(1, Math.max(0, target.scrollTop / maxScroll)) : 0);
  };

  const scrollPage = (direction: 1 | -1) => {
    if (Platform.OS !== 'web') return;
    const amount = Math.max(280, window.innerHeight * SCROLL_STEP_RATIO) * direction;
    const target = getPrimaryScrollElement();

    if (target) {
      target.scrollTo({ top: target.scrollTop + amount, behavior: 'auto' });
    } else {
      window.scrollTo({ top: window.scrollY + amount, behavior: 'auto' });
    }

    window.setTimeout(refreshProgress, 240);
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const syncPathname = () => setPathname(window.location.pathname);
    const style = document.createElement('style');
    style.setAttribute('data-swipeconnect-scrollbars', 'true');
    style.textContent = scrollbarCss;
    document.head.appendChild(style);

    const interval = window.setInterval(refreshProgress, 1500);
    window.addEventListener('scroll', refreshProgress, true);
    window.addEventListener('resize', refreshProgress);
    window.addEventListener('popstate', syncPathname);
    syncPathname();
    refreshProgress();

    return () => {
      style.remove();
      window.clearInterval(interval);
      window.removeEventListener('scroll', refreshProgress, true);
      window.removeEventListener('resize', refreshProgress);
      window.removeEventListener('popstate', syncPathname);
    };
  }, [scrollbarCss]);

  if (Platform.OS !== 'web' || !canScroll || pathname.includes('settings')) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Scroll up"
        style={styles.button}
        onPress={() => scrollPage(-1)}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-up" size={22} color={theme.foreground} />
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="adjustable"
        accessibilityLabel="Manual page scrollbar"
        style={[styles.track, { backgroundColor: theme.muted }]}
        onPress={() => scrollPage(1)}
        activeOpacity={0.75}
      >
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: theme.primary,
              transform: [{ translateY: progress * 44 }],
            },
          ]}
        />
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Scroll down"
        style={styles.button}
        onPress={() => scrollPage(1)}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-down" size={22} color={theme.foreground} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'fixed' as any,
    right: Spacing.sm,
    bottom: 92,
    zIndex: 9999,
    width: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 8,
    height: 68,
    borderRadius: 4,
    marginVertical: 2,
    overflow: 'hidden',
  },
  thumb: {
    width: 8,
    height: 24,
    borderRadius: 4,
  },
});

export default ManualScrollControls;
