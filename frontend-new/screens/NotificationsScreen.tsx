import React from 'react';
import {
  FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications, AppNotification } from '../contexts/NotificationContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type Props = { navigation: any };

const ICON_MAP: Record<AppNotification['type'], { name: any; color: string }> = {
  application: { name: 'send-outline', color: '#10B981' },
  match: { name: 'heart-outline', color: '#FF006E' },
  system: { name: 'information-circle-outline', color: '#00D4FF' },
};

const NotificationsScreen = ({ navigation }: Props) => {
  const { theme } = useTheme();
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotifications();

  const renderItem = ({ item }: { item: AppNotification }) => {
    const icon = ICON_MAP[item.type];
    const time = new Date(item.timestamp).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={[
          styles.item,
          { backgroundColor: item.read ? theme.card : `${theme.primary}08`, borderColor: theme.border },
        ]}
        onPress={() => markRead(item.id)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconBox, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.itemBody}>
          <View style={styles.itemHead}>
            <Text style={[styles.itemTitle, { color: theme.foreground }]} numberOfLines={1}>{item.title}</Text>
            {!item.read && <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
          </View>
          <Text style={[styles.itemBody2, { color: theme.mutedForeground }]} numberOfLines={2}>{item.body}</Text>
          <Text style={[styles.itemTime, { color: theme.mutedForeground }]}>{time}</Text>
          {item.meta?.emailSent && (
            <View style={styles.emailTag}>
              <Ionicons name="mail-outline" size={12} color={theme.success} />
              <Text style={[styles.emailTagText, { color: theme.success }]}>Confirmation email sent</Text>
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
          <Text style={[styles.kicker, { color: theme.mutedForeground }]}>Activity</Text>
          <Text style={[styles.title, { color: theme.foreground }]}>Notifications</Text>
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.headerBtn, { borderColor: theme.border }]}
              onPress={markAllRead}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerBtnText, { color: theme.primary }]}>Mark all read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              style={[styles.headerBtn, { borderColor: theme.border }]}
              onPress={clearAll}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={theme.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}12` }]}>
            <Ionicons name="notifications-outline" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.foreground }]}>No notifications yet</Text>
          <Text style={[styles.emptySub, { color: theme.mutedForeground }]}>
            Swipe right on jobs to apply — you'll get a confirmation here and by email.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  kicker: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: 2 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  headerBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  list: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  item: {
    flexDirection: 'row',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemBody: { flex: 1 },
  itemHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  itemTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: Spacing.sm },
  itemBody2: { fontSize: FontSize.sm, lineHeight: 19, marginBottom: 4 },
  itemTime: { fontSize: FontSize.xs },
  emailTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  emailTagText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['3xl'] },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },
});

export default NotificationsScreen;
