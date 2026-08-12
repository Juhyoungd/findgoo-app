import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { appIcons } from "@/src/assets/app-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
import { BackButton } from "@/src/components/common/BackButton";
import { MotionPressable as Pressable } from "@/src/components/common/MotionPressable";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { useAppData } from "@/src/state/AppDataContext";
import { useAuth } from "@/src/state/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";
import type { ChatMessage } from "@/src/types/findgoo";

type MessageRow = { id: string; conversation_id: string; sender_id: string; text: string; created_at: string };

// [채팅방] 대화방(conversation) 하나에 딸린 1:1 메시지. 열려있는 대화방의 메시지만 그때그때 불러와서
// 채팅방 100개가 동시에 떠도 서로 다른 방의 메시지까지 다 들고 있지 않도록 합니다.
export default function ChatThreadScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { session } = useAuth();
  const { conversations, setActiveConversationId } = useAppData();
  const insets = useSafeAreaInsets();

  // 이 화면이 보이는 동안은 "지금 이 대화방을 보고 있다"고 전역에 표시해서,
  // 새 메시지가 와도 상단 알림/안읽음 표시를 굳이 띄우지 않도록 합니다.
  useFocusEffect(
    useCallback(() => {
      setActiveConversationId(conversationId ?? null);
      return () => setActiveConversationId(null);
    }, [conversationId, setActiveConversationId]),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    const keyboardEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const subscription = Keyboard.addListener(keyboardEvent, () => {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    });
    return () => subscription.remove();
  }, []);

  // 채팅방에서는 하단 탭바가 숨겨지므로 입력창에는 기기 홈 인디케이터만큼의 안전 여백만 둡니다.
  const composerBottomInset = Math.max(insets.bottom, 10);

  const conversation = conversations.find((item) => item.id === conversationId);
  const myId = session?.user.id;

  const localDemoMessages = useMemo<ChatMessage[]>(
    () => [
      { id: "demo-1", conversationId: conversationId ?? "", senderId: "them", text: "제안 확인했어요. 오늘 7시 봉명동 괜찮으세요?", time: "10분 전", mine: false },
      { id: "demo-2", conversationId: conversationId ?? "", senderId: "me", text: "네, 2번 출구 앞에서 뵐게요.", time: "8분 전", mine: true },
    ],
    [conversationId],
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !myId || !conversationId) {
      setMessages(localDemoMessages);
      return;
    }

    let cancelled = false;

    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setMessages((data as MessageRow[]).map((row) => mapMessageRow(row, myId)));
      });

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((items) => (items.some((message) => message.id === row.id) ? items : [...items, mapMessageRow(row, myId)]));
          requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [conversationId, myId, localDemoMessages]);

  function mapMessageRow(row: MessageRow, myUserId: string): ChatMessage {
    return { id: row.id, conversationId: row.conversation_id, senderId: row.sender_id, text: row.text, time: "", mine: row.sender_id === myUserId };
  }

  async function submit() {
    const text = draft.trim();
    if (!text || !conversationId) return;
    setDraft("");

    if (!isSupabaseConfigured || !myId) {
      setMessages((items) => [...items, { id: `local-${Date.now()}`, conversationId, senderId: "me", text, time: "방금 전", mine: true }]);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
      return;
    }

    const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: myId, text });
    if (error) console.log("[messages] 전송 실패", error.message);
  }

  if (!conversation) {
    return (
      <SafeAreaView style={[styles.missing, { backgroundColor: palette.paper }]}>
        <Text style={{ color: palette.muted }}>채팅방을 찾을 수 없어요.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: palette.line }]}>
        <BackButton onPress={() => router.back()} accessibilityLabel="채팅 목록으로 돌아가기" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: palette.ink }]}>{conversation.counterpartyName}</Text>
          <Text style={{ color: palette.muted, fontSize: 11 }} numberOfLines={1}>{conversation.postTitle}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${conversation.counterpartyName}님 신고하기`}
          onPress={() => router.push(`/report/${conversation.postId}`)}
          style={[styles.reportButton, { backgroundColor: palette.white, borderColor: `${palette.orange}66` }]}
        >
          <Text style={{ color: palette.orange, fontSize: 10, fontWeight: "800" }}>신고</Text>
        </Pressable>
      </View>

      <View style={[styles.dealBanner, { backgroundColor: palette.blue }]}>
        <Text style={{ color: palette.ink, fontWeight: "700", fontSize: 12 }}>거래 채팅</Text>
        <Text style={{ color: palette.ink, fontSize: 12 }}>{won(conversation.postPrice)}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined} keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(message) => message.id}
          contentContainerStyle={styles.messages}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.mine ? [styles.bubbleMe, { backgroundColor: palette.lime }] : [styles.bubblePartner, { backgroundColor: palette.white, borderColor: palette.line }]]}>
              <Text style={{ color: item.mine ? palette.white : palette.ink, fontSize: 13 }}>{item.text}</Text>
            </View>
          )}
        />
        <View style={[styles.compose, { borderTopColor: palette.line, backgroundColor: palette.white, paddingBottom: composerBottomInset }]}>
          <View style={[styles.inputShell, { backgroundColor: palette.paper, borderColor: palette.line }]}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="메시지 입력"
              placeholderTextColor={palette.muted}
              multiline
              maxLength={1000}
              textAlignVertical="center"
              style={[styles.composeInput, { color: palette.ink }]}
              onFocus={() => requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))}
            />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="메시지 전송" disabled={!draft.trim()} onPress={submit} haptic="light" pressedScale={0.91} style={[styles.sendButton, { backgroundColor: palette.white, borderColor: draft.trim() ? palette.lime : palette.line }, Platform.OS === "web" ? { boxShadow: `0 3px 7px ${palette.ink}0f` } : { shadowColor: palette.ink }]}>
            <AppIcon name={appIcons.send} color={draft.trim() ? palette.lime : palette.muted} size={20} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  headerTitle: { fontSize: 15, fontWeight: "700" },
  reportButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  dealBanner: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 20, marginTop: 12, borderRadius: 10, padding: 12 },
  messages: { flexGrow: 1, justifyContent: "flex-end", paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14, gap: 10 },
  bubble: { maxWidth: "78%", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubblePartner: { alignSelf: "flex-start", borderWidth: 1, borderBottomLeftRadius: 4 },
  compose: { flexDirection: "row", alignItems: "flex-end", gap: 9, borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 10 },
  inputShell: { flex: 1, minHeight: 42, maxHeight: 104, borderWidth: 1, borderRadius: 21, justifyContent: "center", paddingHorizontal: 14 },
  composeInput: { minHeight: 40, maxHeight: 96, fontSize: 14, lineHeight: 20, paddingTop: 10, paddingBottom: 9 },
  sendButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 1, elevation: 2, ...Platform.select({ web: {}, default: { shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 7 } }) },
});
