import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
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
      markConversationRead();
      return () => setActiveConversationId(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId, setActiveConversationId]),
  );

  function markConversationRead() {
    if (!isSupabaseConfigured || !conversationId) return;
    supabase.rpc("mark_conversation_read", { p_conversation_id: conversationId }).then(({ error }) => {
      if (error) console.log("[mark_conversation_read] 실패", error.message);
    });
  }

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);
  // 리스트를 inverted로 뒤집어서 그리기 때문에, 스크롤 오프셋 0이 곧 "맨 아래(최신 메시지)"예요.
  // 사용자가 과거 대화를 보려고 위로 올린 상태(오프셋이 0보다 큼)라면 새 메시지가 와도
  // 화면을 강제로 끌어내리지 않습니다.
  const isNearBottomRef = useRef(true);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    isNearBottomRef.current = event.nativeEvent.contentOffset.y < 120;
  }

  useEffect(() => {
    const keyboardEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const subscription = Keyboard.addListener(keyboardEvent, () => {
      requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
    });
    return () => subscription.remove();
  }, []);

  // 채팅방에서는 하단 탭바가 숨겨지므로 입력창에는 기기 홈 인디케이터만큼의 안전 여백만 둡니다.
  const composerBottomInset = Math.max(insets.bottom, 10);

  const conversation = conversations.find((item) => item.id === conversationId);
  const myId = session?.user.id;
  // FlatList는 inverted라 index 0이 화면 맨 아래에 그려져요 — 최신 메시지가 앞에 오도록 뒤집어줍니다.
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const localDemoMessages = useMemo<ChatMessage[]>(
    () => [
      { id: "demo-1", conversationId: conversationId ?? "", senderId: "them", text: "제안 확인했어요. 오늘 7시 봉명동 괜찮으세요?", time: "10분 전", createdAt: new Date(Date.now() - 10 * 60000).toISOString(), mine: false },
      { id: "demo-2", conversationId: conversationId ?? "", senderId: "me", text: "네, 2번 출구 앞에서 뵐게요.", time: "8분 전", createdAt: new Date(Date.now() - 8 * 60000).toISOString(), mine: true },
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
          let added = false;
          setMessages((items) => {
            if (items.some((message) => message.id === row.id)) return items;
            added = true;
            return [...items, mapMessageRow(row, myId)];
          });
          if (!added) return;

          // 내가 보낸 메시지(다른 기기 등)는 항상, 상대가 보낸 메시지는 이미 맨 아래를 보고
          // 있을 때만 자동으로 따라 내려갑니다. 위로 올려서 지난 대화를 보는 중이면 그대로 둬요.
          if (row.sender_id === myId || isNearBottomRef.current) {
            requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
          }
          // 이 채팅방 화면이 열려있는 동안 상대 메시지가 오면 바로 읽음 처리합니다.
          // (react-navigation의 포커스 판정은 웹에서 타이밍이 어긋날 수 있어서, 포커스 여부
          // 대신 이 화면이 마운트돼 실시간 구독이 살아있다는 사실 자체를 신호로 씁니다.)
          if (row.sender_id !== myId) markConversationRead();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [conversationId, myId, localDemoMessages]);

  function mapMessageRow(row: MessageRow, myUserId: string): ChatMessage {
    return { id: row.id, conversationId: row.conversation_id, senderId: row.sender_id, text: row.text, time: "", createdAt: row.created_at, mine: row.sender_id === myUserId };
  }

  // 1:1 채팅이라 "안 읽음"은 항상 0 또는 1이에요. 상대가 이 메시지 시각 이후로 대화방을
  // 읽은 적이 없으면(counterpartyLastReadAt이 더 이전이거나 아예 없으면) 안 읽은 거예요.
  function isUnreadByCounterparty(message: ChatMessage) {
    if (!conversation) return false;
    if (!conversation.counterpartyLastReadAt) return true;
    return message.createdAt > conversation.counterpartyLastReadAt;
  }

  // 웹은 물리 키보드가 있어서 Enter로 바로 보내고 Shift+Enter로 줄바꿈하는 게 자연스러워요.
  // 앱은 소프트 키보드라 줄바꿈 키와 전송 버튼이 분리돼 있는 게 표준 동작이라 그대로 둡니다.
  function handleKeyPress(event: { nativeEvent: { key: string; shiftKey?: boolean } }) {
    if (Platform.OS !== "web") return;
    if (event.nativeEvent.key === "Enter" && !event.nativeEvent.shiftKey) {
      (event as unknown as { preventDefault?: () => void }).preventDefault?.();
      submit();
    }
  }

  async function submit() {
    const text = draft.trim();
    if (!text || !conversationId) return;
    setDraft("");

    if (!isSupabaseConfigured || !myId) {
      setMessages((items) => [...items, { id: `local-${Date.now()}`, conversationId, senderId: "me", text, time: "방금 전", createdAt: new Date().toISOString(), mine: true }]);
      requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
      return;
    }

    // 실시간 구독이 이 insert를 다시 받아서 그려줄 때까지 기다리면 내가 보낸 메시지가 바로
    // 안 보이고 스크롤도 안 내려가서, insert 응답을 받는 즉시 내 화면에 바로 추가합니다.
    // (실시간 이벤트가 뒤이어 와도 아래 id 중복 체크 덕분에 두 번 그려지지 않아요.)
    const { data, error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: myId, text }).select("*").single();
    if (error || !data) {
      console.log("[messages] 전송 실패", error?.message);
      return;
    }
    const row = data as MessageRow;
    setMessages((items) => (items.some((message) => message.id === row.id) ? items : [...items, mapMessageRow(row, myId)]));
    requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
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
        <BackButton onPress={() => router.replace("/chat")} accessibilityLabel="채팅 목록으로 돌아가기" />
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
          inverted
          data={reversedMessages}
          keyExtractor={(message) => message.id}
          contentContainerStyle={styles.messages}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={100}
          renderItem={({ item }) => {
            const showUnreadBadge = item.mine && isUnreadByCounterparty(item);
            return (
              <View style={[styles.messageRow, item.mine ? styles.messageRowMine : styles.messageRowPartner]}>
                {showUnreadBadge && <Text style={[styles.unreadBadge, { color: palette.orange }]}>1</Text>}
                <View style={[styles.bubble, item.mine ? [styles.bubbleMe, { backgroundColor: palette.lime }] : [styles.bubblePartner, { backgroundColor: palette.white, borderColor: palette.line }]]}>
                  <Text style={{ color: item.mine ? palette.white : palette.ink, fontSize: 13 }}>{item.text}</Text>
                </View>
              </View>
            );
          }}
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
              onFocus={() => requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }))}
              onKeyPress={handleKeyPress}
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
  // inverted 리스트라 대화가 짧아도 자연스럽게 하단에 붙고, justifyContent:"flex-end" 같은
  // flex 트릭이 필요 없어서 웹 스크롤 방향 버그도 없습니다. 단, 위아래가 뒤집혀 그려지는 만큼
  // paddingTop/paddingBottom도 화면상 위아래가 서로 바뀌어 적용돼요.
  messages: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, gap: 10 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 5 },
  messageRowMine: { justifyContent: "flex-end" },
  messageRowPartner: { justifyContent: "flex-start" },
  unreadBadge: { fontSize: 10, fontWeight: "800", marginBottom: 4 },
  bubble: { maxWidth: "78%", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubblePartner: { borderWidth: 1, borderBottomLeftRadius: 4 },
  compose: { flexDirection: "row", alignItems: "flex-end", gap: 9, borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 10 },
  inputShell: { flex: 1, minHeight: 42, maxHeight: 104, borderWidth: 1, borderRadius: 21, justifyContent: "center", paddingHorizontal: 14 },
  composeInput: { minHeight: 40, maxHeight: 96, fontSize: 14, lineHeight: 20, paddingTop: 10, paddingBottom: 9 },
  sendButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 1, elevation: 2, ...Platform.select({ web: {}, default: { shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 7 } }) },
});
