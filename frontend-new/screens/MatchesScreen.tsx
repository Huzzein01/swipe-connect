import React from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNetwork, NetworkMatch } from '../contexts/NetworkContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type Props = { navigation: any };

const NetworkScreen = ({ navigation }: Props) => {
  const { theme } = useTheme();
  const { matches } = useNetwork();

  const renderItem = ({ item }: { item: NetworkMatch }) => {
    const p = item.profile;
    const isNew = !item.lastMessage;

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: isNew ? `${theme.accent}40` : theme.border }]}>
        {/* Tap avatar + info to view full profile */}
        <TouchableOpacity
          style={styles.cardMain}
          onPress={() => navigation.navigate('ConnectionProfile', { profileId: p.id })}
          activeOpacity={0.75}
        >
          <View style={[styles.avatarWrap, { backgroundColor: `${theme.accent}18`, borderColor: `${theme.accent}30` }]}>
            <Text style={[styles.avatarText, { color: theme.accent }]}>{p.avatar}</Text>
            {isNew && <View style={[styles.activeDot, { backgroundColor: theme.success }]} />}
          </View>

          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.foreground }]}>{p.name}</Text>
            <Text style={[styles.role, { color: theme.mutedForeground }]} numberOfLines={1}>
              {p.title} · {p.company}
            </Text>
            {item.lastMessage ? (
              <Text style={[styles.lastMsg, { color: theme.mutedForeground }]} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            ) : (
              <View style={styles.newRow}>
                <View style={[styles.newTag, { backgroundColor: `${theme.accent}18` }]}>
                  <Text style={[styles.newTagText, { color: theme.accent }]}>Tap to view profile</Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Message button */}
        <TouchableOpacity
          style={[styles.msgBtn, { backgroundColor: `${theme.accent}15` }]}
          onPress={() => navigation.navigate('Chat', { matchId: item.id })}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={18} color={theme.accent} />
          {item.unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.accent }]}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, { color: theme.mutedForeground }]}>Connections &amp; conversations</Text>
          <Text style={[styles.pageTitle, { color: theme.foreground }]}>My Network</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}25` }]}>
          <Ionicons name="git-network-outline" size={14} color={theme.accent} />
          <Text style={[styles.countText, { color: theme.accent }]}>{matches.length}</Text>
        </View>
      </View>

      {/* Stats bar */}
      {matches.length > 0 && (
        <View style={[styles.statsBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.foreground }]}>{matches.length}</Text>
            <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>Connections</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.foreground }]}>
              {matches.filter((m) => m.lastMessage).length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>Conversations</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.foreground }]}>
              {matches.filter((m) => !m.lastMessage).length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>Pending</Text>
          </View>
        </View>
      )}

      {matches.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIconWrap, { backgroundColor: `${theme.accent}12` }]}>
            <Ionicons name="git-network-outline" size={42} color={theme.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.foreground }]}>No connections yet</Text>
          <Text style={[styles.emptySub, { color: theme.mutedForeground }]}>
            Go to Discover, switch to Networking mode, and swipe right on people you want to connect with.
          </Text>
          <TouchableOpacity
            style={[styles.discoverBtn, { backgroundColor: theme.accent }]}
            onPress={() => navigation.navigate('Discover')}
            activeOpacity={0.85}
          >
            <Ionicons name="compass-outline" size={18} color="#fff" />
            <Text style={styles.discoverBtnText}>Start Networking</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  kicker: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: 2 },
  pageTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1,
  },
  countText: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold },
  statsBar: {
    flexDirection: 'row', marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  statLabel: { fontSize: FontSize.xs, marginTop: 2 },
  statDivider: { width: 1, marginVertical: Spacing.xs },
  list: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, paddingBottom: Spacing['4xl'] },
  card: {
    flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.xl,
    borderWidth: 1, padding: Spacing.lg, gap: Spacing.md,
  },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  msgBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarWrap: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative',
  },
  avatarText: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold },
  activeDot: { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#fff' },
  info: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 2 },
  role: { fontSize: FontSize.sm, marginBottom: 4 },
  lastMsg: { fontSize: FontSize.sm },
  newRow: { flexDirection: 'row' },
  newTag: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  newTagText: { fontSize: 11, fontWeight: FontWeight.bold },
  meta: { alignItems: 'flex-end', gap: Spacing.xs },
  time: { fontSize: FontSize.xs },
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: FontWeight.bold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['3xl'] },
  emptyIconWrap: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 22, marginBottom: Spacing['2xl'] },
  discoverBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  discoverBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});

export default NetworkScreen;
