import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNetwork, NetworkMatch } from '../contexts/NetworkContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type Props = { navigation: any };

const MatchesScreen = ({ navigation }: Props) => {
  const { theme } = useTheme();
  const { matches } = useNetwork();

  const renderItem = ({ item }: { item: NetworkMatch }) => {
    const p = item.profile;
    const since = new Date(item.matchedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => navigation.navigate('Chat', { matchId: item.id })}
        activeOpacity={0.75}
      >
        <View style={[styles.avatar, { backgroundColor: `${theme.accent}20` }]}>
          <Text style={[styles.avatarText, { color: theme.accent }]}>{p.avatar}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.foreground }]}>{p.name}</Text>
          <Text style={[styles.title, { color: theme.mutedForeground }]} numberOfLines={1}>{p.title} · {p.company}</Text>
          {item.lastMessage ? (
            <Text style={[styles.lastMsg, { color: theme.mutedForeground }]} numberOfLines={1}>{item.lastMessage}</Text>
          ) : (
            <Text style={[styles.newMatch, { color: theme.primary }]}>New match — say hello 👋</Text>
          )}
        </View>
        <View style={styles.meta}>
          <Text style={[styles.time, { color: theme.mutedForeground }]}>{since}</Text>
          {item.unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, { color: theme.mutedForeground }]}>Professional networking</Text>
          <Text style={[styles.title2, { color: theme.foreground }]}>Matches</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: `${theme.primary}15` }]}>
          <Text style={[styles.countText, { color: theme.primary }]}>{matches.length}</Text>
        </View>
      </View>

      {matches.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}12` }]}>
            <Ionicons name="people-outline" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.foreground }]}>No matches yet</Text>
          <Text style={[styles.emptySub, { color: theme.mutedForeground }]}>
            Switch to Networking mode on the Discover tab and swipe right on people you want to connect with.
          </Text>
          <TouchableOpacity
            style={[styles.discoverBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Jobs')}
            activeOpacity={0.85}
          >
            <Ionicons name="compass-outline" size={18} color="#fff" />
            <Text style={styles.discoverBtnText}>Go to Discover</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: theme.border }]} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  kicker: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: 2 },
  title2: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold },
  countBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  countText: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  list: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sep: { height: 10, backgroundColor: 'transparent' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold },
  info: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 2 },
  title: { fontSize: FontSize.sm, marginBottom: 3 },
  lastMsg: { fontSize: FontSize.sm },
  newMatch: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  meta: { alignItems: 'flex-end', gap: Spacing.xs },
  time: { fontSize: FontSize.xs },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: FontWeight.bold },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 22, marginBottom: Spacing['2xl'] },
  discoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  discoverBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});

export default MatchesScreen;
