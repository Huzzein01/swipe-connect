import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNetwork, Message } from '../contexts/NetworkContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type Props = { navigation: any; route: any };

const SIMULATED_REPLIES = [
  "That sounds really interesting! Tell me more.",
  "I'd love to connect on this — when are you free for a call?",
  "Great idea. I've been thinking about something similar.",
  "Let's set up a time to chat. What's your schedule like?",
  "Love this direction. Do you have a deck or doc I can look at?",
  "Yes! I've been looking for someone with exactly that background.",
];

const ChatScreen = ({ navigation, route }: Props) => {
  const { matchId } = route.params as { matchId: string };
  const { theme } = useTheme();
  const { matches, messages, sendMessage, markRead } = useNetwork();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const match = matches.find((m) => m.id === matchId);
  const thread: Message[] = messages[matchId] || [];

  useEffect(() => {
    if (match) {
      navigation.setOptions({ title: match.profile.name });
      markRead(matchId);
    }
  }, [matchId]);

  useEffect(() => {
    if (thread.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [thread.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !match) return;
    setInput('');
    sendMessage(matchId, text);
  };

  const handleAttach = () => {
    Alert.alert(
      'Attach',
      'Choose attachment type',
      [
        { text: 'GitHub repo', onPress: () => sendMessage(matchId, '[GitHub repo shared]', { type: 'github', url: 'https://github.com/', name: 'GitHub repo' }) },
        { text: 'PDF / Pitch deck', onPress: () => sendMessage(matchId, '[Pitch deck shared]', { type: 'pdf', url: '', name: 'pitch-deck.pdf' }) },
        { text: 'Link', onPress: () => sendMessage(matchId, '[Link shared]', { type: 'link', url: 'https://', name: 'Shared link' }) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === 'me';
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
        {!isMe && match && (
          <View style={[styles.msgAvatar, { backgroundColor: `${theme.accent}20` }]}>
            <Text style={[styles.msgAvatarText, { color: theme.accent }]}>{match.profile.avatar}</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isMe
              ? [styles.bubbleMe, { backgroundColor: theme.primary }]
              : [styles.bubbleThem, { backgroundColor: theme.card, borderColor: theme.border }],
          ]}
        >
          {item.attachment && (
            <View style={[styles.attachRow, { borderColor: isMe ? 'rgba(255,255,255,0.3)' : theme.border }]}>
              <Ionicons
                name={item.attachment.type === 'github' ? 'logo-github' : item.attachment.type === 'pdf' ? 'document-text-outline' : 'link-outline'}
                size={14}
                color={isMe ? 'rgba(255,255,255,0.8)' : theme.mutedForeground}
              />
              <Text style={[styles.attachName, { color: isMe ? 'rgba(255,255,255,0.9)' : theme.mutedForeground }]}>
                {item.attachment.name}
              </Text>
            </View>
          )}
          <Text style={[styles.bubbleText, { color: isMe ? '#fff' : theme.foreground }]}>{item.text}</Text>
          <Text style={[styles.timestamp, { color: isMe ? 'rgba(255,255,255,0.6)' : theme.mutedForeground }]}>
            {new Date(item.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (!match) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <Text style={{ color: theme.mutedForeground }}>Match not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Profile banner */}
      <TouchableOpacity
        style={[styles.profileBanner, { backgroundColor: theme.card, borderColor: theme.border }]}
        activeOpacity={0.8}
      >
        <View style={[styles.bannerAvatar, { backgroundColor: `${theme.accent}20` }]}>
          <Text style={[styles.bannerAvatarText, { color: theme.accent }]}>{match.profile.avatar}</Text>
        </View>
        <View style={styles.bannerInfo}>
          <Text style={[styles.bannerName, { color: theme.foreground }]}>{match.profile.name}</Text>
          <Text style={[styles.bannerTitle, { color: theme.mutedForeground }]}>{match.profile.title} · {match.profile.company}</Text>
        </View>
        <View style={[styles.matchBadge, { backgroundColor: `${theme.success}15` }]}>
          <Text style={[styles.matchBadgeText, { color: theme.success }]}>{match.profile.matchScore}% match</Text>
        </View>
      </TouchableOpacity>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={thread}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={[styles.emptyChatText, { color: theme.mutedForeground }]}>
              You matched with {match.profile.name}. {'\n'}Start the conversation!
            </Text>
          </View>
        }
      />

      {/* Input bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleAttach} activeOpacity={0.7}>
            <Ionicons name="attach" size={22} color={theme.mutedForeground} />
          </TouchableOpacity>
          <TextInput
            style={[styles.textInput, { color: theme.foreground, backgroundColor: theme.background, borderColor: theme.border }]}
            placeholder="Message..."
            placeholderTextColor={theme.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: input.trim() ? theme.primary : theme.muted }]}
            onPress={handleSend}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color={input.trim() ? '#fff' : theme.mutedForeground} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  bannerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerAvatarText: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold },
  bannerInfo: { flex: 1 },
  bannerName: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  bannerTitle: { fontSize: FontSize.sm },
  matchBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  matchBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  messageList: { padding: Spacing.lg, gap: Spacing.md },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.md },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowThem: { justifyContent: 'flex-start' },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  msgAvatarText: { fontSize: 11, fontWeight: FontWeight.extrabold },
  bubble: {
    maxWidth: '72%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleThem: { borderWidth: 1, borderBottomLeftRadius: 4 },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  attachName: { fontSize: FontSize.xs },
  bubbleText: { fontSize: FontSize.md, lineHeight: 21 },
  timestamp: { fontSize: 11, marginTop: 4, textAlign: 'right' },
  emptyChat: { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing['3xl'] },
  emptyChatText: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  attachBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;
