import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
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

  // 웹 미리보기에서는 탭바 숨김 처리가 반영되지 않는 경우가 있어 입력창을 가릴 수 있어서
  // 탭바 높이만큼 여백을 더해주지만, 실제 앱(iOS/Android)에서는 탭바가 정상적으로 숨겨지므로
  // 여백을 더하면 오히려 입력창이 불필요하게 커져서 웹에서만 적용합니다.
  const tabBarClearance = Platform.OS === "web" ? 66 + Math.max(insets.bottom, 10) + 10 : 0;

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
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }}>
      <View style={[styles.header, { borderBottomColor: palette.line }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={{ fontSize: 18, color: palette.ink }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: palette.ink }]}>{conversation.counterpartyName}</Text>
          <Text style={{ color: palette.muted, fontSize: 11 }} numberOfLines={1}>{conversation.postTitle}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${conversation.counterpartyName}님 신고하기`}
          onPress={() => router.push(`/report/${conversation.postId}`)}
          style={[styles.reportButton, { backgroundColor: `${palette.orange}12`, borderColor: `${palette.orange}66` }]}
        >
          <Text style={{ color: palette.orange, fontSize: 10, fontWeight: "800" }}>신고</Text>
        </Pressable>
      </View>

      <View style={[styles.dealBanner, { backgroundColor: palette.blue }]}>
        <Text style={{ color: palette.ink, fontWeight: "700", fontSize: 12 }}>거래 채팅</Text>
        <Text style={{ color: palette.ink, fontSize: 12 }}>{won(conversation.postPrice)}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(message) => message.id}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.mine ? [styles.bubbleMe, { backgroundColor: palette.lime }] : [styles.bubblePartner, { backgroundColor: palette.white, borderColor: palette.line }]]}>
              <Text style={{ color: item.mine ? palette.white : palette.ink, fontSize: 13 }}>{item.text}</Text>
            </View>
          )}
        />
        <View style={[styles.compose, { borderTopColor: palette.line, backgroundColor: palette.white, paddingBottom: tabBarClearance }]}>
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
  reportButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  dealBanner: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 20, marginTop: 12, borderRadius: 10, padding: 12 },
  messages: { padding: 20, gap: 10 },
  bubble: { maxWidth: "78%", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubblePartner: { alignSelf: "flex-start", borderWidth: 1, borderBottomLeftRadius: 4 },
  compose: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  composeInput: { flex: 1, fontSize: 13, paddingVertical: 8 },
  sendButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
});
