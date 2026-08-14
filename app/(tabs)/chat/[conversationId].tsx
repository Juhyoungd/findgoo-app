import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Image, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { appIcons } from "@/src/assets/app-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
import { BackButton } from "@/src/components/common/BackButton";
import { MotionPressable as Pressable } from "@/src/components/common/MotionPressable";
import { CounterpartyProfileModal } from "@/src/components/profile/CounterpartyProfileModal";
import { ProfileAvatar } from "@/src/components/profile/ProfileAvatar";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { useAppData } from "@/src/state/AppDataContext";
import { useAuth } from "@/src/state/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";
import type { ChatMessage } from "@/src/types/findgoo";
import { pickImage, signChatImage, uploadChatImage } from "@/src/services/mediaService";
import { useToast } from "@/src/state/ToastContext";

type MessageRow = { id: string; conversation_id: string; sender_id: string; text: string; content_type?: "text" | "image"; image_path?: string | null; created_at: string };
type ChatSendError = { code?: string; message?: string } | null;

function isMissingChatMediaSchema(error: ChatSendError) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42703" || error?.code === "PGRST204" || message.includes("content_type") || message.includes("image_path");
}

function chatSendErrorMessage(error: ChatSendError) {
  const message = error?.message ?? "알 수 없는 서버 오류";
  const normalized = message.toLowerCase();
  if (isMissingChatMediaSchema(error)) return "채팅 DB 업데이트가 필요해요. 텍스트 메시지는 구버전 방식으로 다시 시도할게요.";
  if (error?.code === "42501" || normalized.includes("row-level security")) return "이 채팅방에 메시지를 보낼 권한이 없어요.";
  if (error?.code === "23503") return "종료되었거나 삭제된 채팅방이에요.";
  if (normalized.includes("failed to fetch") || normalized.includes("network")) return "인터넷 연결을 확인한 뒤 다시 시도해주세요.";
  if (normalized.includes("jwt") || normalized.includes("not authenticated")) return "로그인이 만료됐어요. 다시 로그인해주세요.";
  return `메시지를 보내지 못했어요. ${message}`;
}

// [채팅방] 대화방(conversation) 하나에 딸린 1:1 메시지. 열려있는 대화방의 메시지만 그때그때 불러와서
// 채팅방 100개가 동시에 떠도 서로 다른 방의 메시지까지 다 들고 있지 않도록 합니다.
export default function ChatThreadScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { session } = useAuth();
  const { conversations, posts, setActiveConversationId, blockMember } = useAppData();
  const { showToast } = useToast();
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
  const [profileVisible, setProfileVisible] = useState(false);
  const [imageSending, setImageSending] = useState(false);
  const [chatMediaSupported, setChatMediaSupported] = useState<boolean | null>(isSupabaseConfigured ? null : true);
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
      { id: "demo-1", conversationId: conversationId ?? "", senderId: "them", text: "제안 확인했어요. 오늘 7시 봉명동 괜찮으세요?", kind: "text", time: "10분 전", createdAt: new Date(Date.now() - 10 * 60000).toISOString(), mine: false, deliveryStatus: "read" },
      { id: "demo-2", conversationId: conversationId ?? "", senderId: "me", text: "네, 2번 출구 앞에서 뵐게요.", kind: "text", time: "8분 전", createdAt: new Date(Date.now() - 8 * 60000).toISOString(), mine: true, deliveryStatus: "read" },
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
      .then(async ({ data, error }) => {
        if (cancelled || error || !data) return;
        const hydrated = await Promise.all((data as MessageRow[]).map((row) => hydrateMessageRow(row, myId)));
        if (!cancelled) setMessages(hydrated);
      });

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const row = payload.new as MessageRow;
          const mapped = await hydrateMessageRow(row, myId);
          setMessages((items) => {
            const optimisticIndex = items.findIndex((message) => message.mine && message.deliveryStatus === "sending" && message.text === row.text && message.kind === (row.content_type ?? "text"));
            if (optimisticIndex >= 0) return items.map((message, index) => index === optimisticIndex ? mapped : message);
            if (items.some((message) => message.id === row.id)) return items;
            return [...items, mapped];
          });

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

  // [사진 보내기] 원격 DB가 아직 최신 이미지 메시지 컬럼을 갖지 않은 베타 환경에서는
  // 사진을 먼저 업로드해 고아 파일을 만들지 않고, 텍스트 채팅만 호환 모드로 유지합니다.
  useEffect(() => {
    if (!isSupabaseConfigured || !myId) {
      setChatMediaSupported(true);
      return;
    }
    let cancelled = false;
    supabase
      .from("messages")
      .select("content_type,image_path")
      .limit(1)
      .then(({ error }) => {
        if (!cancelled) setChatMediaSupported(isMissingChatMediaSchema(error) ? false : true);
      });
    return () => {
      cancelled = true;
    };
  }, [myId]);

  async function hydrateMessageRow(row: MessageRow, myUserId: string): Promise<ChatMessage> {
    const mine = row.sender_id === myUserId;
    const kind = row.content_type ?? "text";
    const signed = kind === "image" && row.image_path ? await signChatImage(row.image_path) : { url: null };
    return { id: row.id, conversationId: row.conversation_id, senderId: row.sender_id, text: row.text, kind, imagePath: row.image_path, imageUrl: signed.url, time: "", createdAt: row.created_at, mine, deliveryStatus: mine && isUnreadByTimestamp(row.created_at) ? "sent" : "read" };
  }

  function isUnreadByTimestamp(createdAt: string) {
    if (!conversation?.counterpartyLastReadAt) return true;
    return createdAt > conversation.counterpartyLastReadAt;
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
    await sendMessage({ text, kind: "text" });
  }

  async function sendMessage(input: { text: string; kind: "text" | "image"; imagePath?: string | null; imageUrl?: string | null }, retryId?: string) {
    if (!conversationId) return;
    const pendingId = retryId ?? `pending-${Date.now()}`;
    const optimistic: ChatMessage = { id: pendingId, conversationId, senderId: myId ?? "me", text: input.text, kind: input.kind, imagePath: input.imagePath, imageUrl: input.imageUrl, time: "방금 전", createdAt: new Date().toISOString(), mine: true, deliveryStatus: "sending" };
    setMessages((items) => retryId ? items.map((message) => message.id === retryId ? optimistic : message) : [...items, optimistic]);
    requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));

    if (!isSupabaseConfigured || !myId) {
      setMessages((items) => items.map((message) => message.id === pendingId ? { ...message, deliveryStatus: "sent" } : message));
      return;
    }

    // 실시간 구독이 이 insert를 다시 받아서 그려줄 때까지 기다리면 내가 보낸 메시지가 바로
    // 안 보이고 스크롤도 안 내려가서, insert 응답을 받는 즉시 내 화면에 바로 추가합니다.
    // (실시간 이벤트가 뒤이어 와도 아래 id 중복 체크 덕분에 두 번 그려지지 않아요.)
    let { data, error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: myId, text: input.text, content_type: input.kind, image_path: input.imagePath ?? null }).select("*").single();

    // 원격 DB가 아직 content_type/image_path 마이그레이션 전이면 텍스트만 기존 스키마로
    // 한 번 자동 재시도합니다. 마이그레이션 후에는 첫 요청이 성공하므로 이 경로를 타지 않아요.
    if (error && input.kind === "text" && isMissingChatMediaSchema(error)) {
      setChatMediaSupported(false);
      const legacyResult = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: myId, text: input.text }).select("*").single();
      data = legacyResult.data;
      error = legacyResult.error;
    }
    if (error || !data) {
      setMessages((items) => items.map((message) => message.id === pendingId ? { ...message, deliveryStatus: "failed" } : message));
      showToast(chatSendErrorMessage(error));
      return;
    }
    const row = data as MessageRow;
    const mapped = await hydrateMessageRow(row, myId);
    setMessages((items) => items.map((message) => message.id === pendingId ? mapped : message));
    requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
  }

  async function chooseChatImage() {
    if (!conversationId || imageSending) return;
    if (chatMediaSupported === false) {
      showToast("사진 전송은 Supabase 채팅 DB 업데이트 후 사용할 수 있어요. 지금은 텍스트 메시지를 이용해주세요.");
      return;
    }
    const picked = await pickImage();
    if (picked.error) return showToast(picked.error);
    if (!picked.asset) return;
    setImageSending(true);
    if (!isSupabaseConfigured || !myId) {
      await sendMessage({ text: "사진", kind: "image", imageUrl: picked.asset.uri });
      setImageSending(false);
      return;
    }
    const uploaded = await uploadChatImage(picked.asset, conversationId, myId);
    if (uploaded.error || !uploaded.path) {
      setImageSending(false);
      return showToast(uploaded.error ?? "사진을 올리지 못했어요.");
    }
    await sendMessage({ text: "사진", kind: "image", imagePath: uploaded.path, imageUrl: uploaded.url });
    setImageSending(false);
  }

  function retryMessage(message: ChatMessage) {
    if (message.deliveryStatus !== "failed") return;
    sendMessage({ text: message.text, kind: message.kind, imagePath: message.imagePath, imageUrl: message.imageUrl }, message.id);
  }

  function confirmBlock() {
    if (!conversation) return;
    const run = async () => {
      const { error } = await blockMember(conversation.counterpartyProfile);
      if (error) return showToast(error);
      showToast(`${conversation.counterpartyName}님을 차단했어요.`);
      router.replace("/chat");
    };
    if (Platform.OS === "web") {
      if (window.confirm(`${conversation.counterpartyName}님을 차단할까요? 글과 채팅이 숨겨집니다.`)) run();
      return;
    }
    Alert.alert("회원 차단", `${conversation.counterpartyName}님의 글과 채팅을 숨길까요?`, [{ text: "취소", style: "cancel" }, { text: "차단", style: "destructive", onPress: run }]);
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
        <ProfileAvatar nickname={conversation.counterpartyName} avatarUrl={conversation.counterpartyProfile.avatarUrl} size={40} onPress={() => setProfileVisible(true)} />
        <Pressable onPress={() => setProfileVisible(true)} style={styles.headerCopy} accessibilityLabel={`${conversation.counterpartyName} 프로필 요약 열기`}>
          <Text style={[styles.headerTitle, { color: palette.ink }]}>{conversation.counterpartyName}</Text>
          <Text style={{ color: palette.muted, fontSize: 11 }} numberOfLines={1}>{conversation.postTitle}</Text>
        </Pressable>
        <View style={styles.headerActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${conversation.counterpartyName}님 신고하기`}
          onPress={() => router.push({ pathname: "/report/[postId]", params: { postId: conversation.postId, reportedUserId: conversation.counterpartyId } })}
          style={[styles.reportButton, { backgroundColor: palette.white, borderColor: `${palette.orange}66` }]}
        >
          <Text style={{ color: palette.orange, fontSize: 10, fontWeight: "800" }}>신고</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`${conversation.counterpartyName}님 차단하기`} onPress={confirmBlock} style={[styles.reportButton, { backgroundColor: palette.white, borderColor: palette.line }]}><Text style={{ color: palette.muted, fontSize: 10, fontWeight: "800" }}>차단</Text></Pressable>
        </View>
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
            const deliveryStatus = item.mine ? item.deliveryStatus === "sending" ? "전송 중" : item.deliveryStatus === "failed" ? "전송 실패 · 다시 누르기" : (isUnreadByCounterparty(item) ? "전송됨" : "읽음") : null;
            return (
              <View style={[styles.messageRow, item.mine ? styles.messageRowMine : styles.messageRowPartner]}>
                {!item.mine && <ProfileAvatar nickname={conversation.counterpartyName} avatarUrl={conversation.counterpartyProfile.avatarUrl} size={30} onPress={() => setProfileVisible(true)} />}
                {deliveryStatus && <Pressable disabled={item.deliveryStatus !== "failed"} onPress={() => retryMessage(item)}><Text style={[styles.deliveryStatus, { color: deliveryStatus === "읽음" ? palette.muted : palette.orange }]}>{deliveryStatus}</Text></Pressable>}
                <View style={[styles.bubble, item.kind === "image" && styles.imageBubble, item.mine ? [styles.bubbleMe, { backgroundColor: palette.lime }] : [styles.bubblePartner, { backgroundColor: palette.white, borderColor: palette.line }]]}>
                  {item.kind === "image" && item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.messageImage} resizeMode="cover" /> : <Text style={{ color: item.mine ? palette.white : palette.ink, fontSize: 13 }}>{item.kind === "image" ? "이미지를 불러오지 못했어요" : item.text}</Text>}
                </View>
              </View>
            );
          }}
        />
        <View style={[styles.compose, { borderTopColor: palette.line, backgroundColor: palette.white, paddingBottom: composerBottomInset }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={chatMediaSupported === false ? "사진 보내기, 데이터베이스 업데이트 필요" : "사진 보내기"} accessibilityHint={chatMediaSupported === false ? "현재는 텍스트 메시지만 전송할 수 있어요" : undefined} onPress={chooseChatImage} disabled={imageSending} haptic="light" style={[styles.attachButton, { borderColor: palette.line, backgroundColor: palette.paper }]}>
            <Text style={{ color: chatMediaSupported === false ? `${palette.muted}88` : palette.muted, fontSize: 20, fontWeight: "500" }}>{imageSending ? "…" : "+"}</Text>
          </Pressable>
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
      <CounterpartyProfileModal
        visible={profileVisible}
        profile={conversation.counterpartyProfile}
        postCount={posts.filter((post) => post.authorId === conversation.counterpartyId || post.author === conversation.counterpartyName).length}
        onClose={() => setProfileVisible(false)}
        onOpenPosts={() => {
          setProfileVisible(false);
          router.push({ pathname: "/profile/member", params: { userId: conversation.counterpartyId } });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  headerCopy: { flex: 1, borderRadius: 10, paddingVertical: 4 },
  headerTitle: { fontSize: 15, fontWeight: "700" },
  reportButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 5 },
  dealBanner: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 20, marginTop: 12, borderRadius: 10, padding: 12 },
  // inverted 리스트라 대화가 짧아도 자연스럽게 하단에 붙고, justifyContent:"flex-end" 같은
  // flex 트릭이 필요 없어서 웹 스크롤 방향 버그도 없습니다. 단, 위아래가 뒤집혀 그려지는 만큼
  // paddingTop/paddingBottom도 화면상 위아래가 서로 바뀌어 적용돼요.
  messages: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, gap: 10 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 5 },
  messageRowMine: { justifyContent: "flex-end" },
  messageRowPartner: { justifyContent: "flex-start" },
  deliveryStatus: { fontSize: 9, fontWeight: "800", marginBottom: 4 },
  bubble: { maxWidth: "78%", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubblePartner: { borderWidth: 1, borderBottomLeftRadius: 4 },
  imageBubble: { paddingHorizontal: 4, paddingVertical: 4, overflow: "hidden" },
  messageImage: { width: 190, height: 190, borderRadius: 11 },
  compose: { flexDirection: "row", alignItems: "flex-end", gap: 9, borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 10 },
  inputShell: { flex: 1, minHeight: 42, maxHeight: 104, borderWidth: 1, borderRadius: 21, justifyContent: "center", paddingHorizontal: 14 },
  composeInput: { minHeight: 40, maxHeight: 96, fontSize: 14, lineHeight: 20, paddingTop: 10, paddingBottom: 9 },
  attachButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 1 },
  sendButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 1, elevation: 2, ...Platform.select({ web: {}, default: { shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 7 } }) },
});
