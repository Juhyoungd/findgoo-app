import { useMemo, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";
import type { ChatMessage } from "@/src/types/findgoo";

// [채팅방] 거래가 성사된 상대와 나누는 1:1 채팅
export default function ChatThreadScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { posts, messages, sendMessage } = useAppData();
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const post = posts.find((item) => item.id === postId);
  const activeMessages = useMemo(() => messages.filter((message) => message.postId === postId), [messages, postId]);
  const counterparty = post ? (post.mine ? "거래 상대" : post.author) : "";

  if (!post) {
    return (
      <SafeAreaView style={[styles.missing, { backgroundColor: palette.paper }]}>
        <Text style={{ color: palette.muted }}>채팅방을 찾을 수 없어요.</Text>
      </SafeAreaView>
    );
  }

  function submit() {
    if (!draft.trim()) return;
    sendMessage(post!.id, draft);
    setDraft("");
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }}>
      <View style={[styles.header, { borderBottomColor: palette.line }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={{ fontSize: 18, color: palette.ink }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: palette.ink }]}>{counterparty}</Text>
          <Text style={{ color: palette.muted, fontSize: 11 }} numberOfLines={1}>{post.title}</Text>
        </View>
      </View>

      <View style={[styles.dealBanner, { backgroundColor: palette.blue }]}>
        <Text style={{ color: palette.ink, fontWeight: "700", fontSize: 12 }}>거래 성사</Text>
        <Text style={{ color: palette.ink, fontSize: 12 }}>{won(post.price)} · {post.region}</Text>
      </View>
      <Text style={[styles.notice, { color: palette.muted }]}>이 채팅은 거래가 성사된 두 사람에게만 열렸습니다.</Text>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
        <FlatList
          ref={listRef}
          data={activeMessages}
          keyExtractor={(message) => message.id}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.sender === "me" ? [styles.bubbleMe, { backgroundColor: palette.lime }] : [styles.bubblePartner, { backgroundColor: palette.white, borderColor: palette.line }]]}>
              <Text style={{ color: item.sender === "me" ? palette.white : palette.ink, fontSize: 13 }}>{item.text}</Text>
              <Text style={{ color: item.sender === "me" ? "rgba(255,255,255,0.75)" : palette.muted, fontSize: 9, marginTop: 4 }}>{item.time}</Text>
            </View>
          )}
        />
        <View style={[styles.compose, { borderTopColor: palette.line, backgroundColor: palette.white }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="거래 시간과 장소를 정해보세요"
            placeholderTextColor={palette.muted}
            style={[styles.composeInput, { color: palette.ink }]}
            onSubmitEditing={submit}
          />
          <Pressable onPress={submit} style={[styles.sendButton, { backgroundColor: palette.lime }]}>
            <Text style={{ color: palette.white, fontWeight: "700" }}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 15, fontWeight: "700" },
  dealBanner: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 20, marginTop: 12, borderRadius: 10, padding: 12 },
  notice: { fontSize: 10, textAlign: "center", marginTop: 10, marginBottom: 4 },
  messages: { padding: 20, gap: 10 },
  bubble: { maxWidth: "78%", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubblePartner: { alignSelf: "flex-start", borderWidth: 1, borderBottomLeftRadius: 4 },
  compose: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  composeInput: { flex: 1, fontSize: 13, paddingVertical: 8 },
  sendButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
});
