import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { BackButton } from "@/src/components/common/BackButton";
import { MotionPressable as Pressable } from "@/src/components/common/MotionPressable";
import { useAppData } from "@/src/state/AppDataContext";
import { useToast } from "@/src/state/ToastContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";

const statusLabel = { open: "거래 가능", reserved: "진행 중", closed: "마감" } as const;

// [게시글 상세] 구매글/급구 카드를 눌렀을 때 들어오는 상세 화면
export function PostDetailScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { posts, savedPostIds, toggleSaved, startOrGetConversation, addOffer } = useAppData();
  const { showToast } = useToast();
  const post = posts.find((item) => item.id === postId);
  const [openingChat, setOpeningChat] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  async function openChat() {
    if (!post) return;
    setOpeningChat(true);
    const { conversationId, error } = await startOrGetConversation(post);
    setOpeningChat(false);
    if (error || !conversationId) {
      Alert.alert("채팅 시작 실패", error ?? "잠시 후 다시 시도해주세요.");
      return;
    }
    router.push(`/chat/${conversationId}`);
  }

  function openOfferModal() {
    setOfferPrice(post ? String(post.price) : "");
    setOfferMessage("");
    setOfferModalVisible(true);
  }

  async function submitOffer() {
    if (!post || submittingOffer) return;
    const price = Number(offerPrice.replace(/[^0-9]/g, ""));
    if (!price) return showToast("제안 금액을 입력해주세요.");
    if (offerMessage.trim().length < 5) return showToast("제안 메시지를 5자 이상 입력해주세요.");

    try {
      setSubmittingOffer(true);
      const { error } = await addOffer({ postId: post.id, price, message: offerMessage.trim() });
      if (error) return showToast(error);
      setOfferModalVisible(false);
      showToast("제안을 보냈어요.");
    } finally {
      setSubmittingOffer(false);
    }
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.missing, { backgroundColor: palette.paper }]}>
        <Text style={{ color: palette.muted }}>게시글을 찾을 수 없어요.</Text>
      </SafeAreaView>
    );
  }

  const isUrgent = post.type === "urgent";
  const saved = savedPostIds.includes(post.id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <AppHeader />
      <View style={[styles.header, { borderBottomColor: palette.line }]}>
        <BackButton onPress={goBack} accessibilityLabel="목록으로 돌아가기" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: palette.lime }]}>{isUrgent ? "URGENT" : "BUY"}</Text>
          <Text style={[styles.headerTitle, { color: palette.ink }]} numberOfLines={1}>{post.title}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={saved ? "찜 해제" : "찜하기"} onPress={() => toggleSaved(post.id)} hitSlop={8} style={[styles.heart, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <Text style={{ fontSize: 17, color: saved ? palette.orange : palette.muted }}>{saved ? "♥" : "♡"}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: palette.white, borderColor: palette.line }, isUrgent && { borderLeftColor: palette.orange, borderLeftWidth: 3 }]}>
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, { backgroundColor: isUrgent ? `${palette.orange}22` : palette.blue, color: isUrgent ? palette.orange : palette.lime }]}>{isUrgent ? "급구" : "구매해요"}</Text>
            <Text style={[styles.badge, { backgroundColor: palette.paper, color: palette.muted }]}>{post.category}</Text>
            <Text style={[styles.badge, { backgroundColor: palette.paper, color: palette.muted }]}>{statusLabel[post.status]}</Text>
            {post.mine && <Text style={[styles.badge, { backgroundColor: palette.paper, color: palette.muted }]}>내가 쓴 글</Text>}
          </View>
          <Text style={[styles.title, { color: palette.ink }]}>{post.title}</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>⌖ {post.region} · {post.created}</Text>
          {post.deadline && <Text style={[styles.deadline, { color: palette.orange }]}>{post.deadline}까지</Text>}
        </View>

        <View style={[styles.card, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <View style={styles.priceRow}>
            <View>
              <Text style={[styles.priceLabel, { color: palette.muted }]}>{isUrgent ? "지원 금액" : "희망 가격"}</Text>
              <Text style={[styles.priceValue, { color: palette.ink }]}>{won(post.price)}</Text>
            </View>
            <View style={[styles.offerBubble, { backgroundColor: palette.paper }]}>
              <Text style={{ color: palette.lime, fontWeight: "700" }}>{post.offerCount}</Text>
              <Text style={{ color: palette.muted, fontSize: 11 }}>{isUrgent ? "명 지원" : "개의 제안"}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <Text style={[styles.label, { color: palette.muted }]}>상세 설명</Text>
          <Text style={[styles.description, { color: palette.ink }]}>{post.description}</Text>
        </View>

        <View style={[styles.card, styles.authorCard, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <View style={[styles.avatar, { backgroundColor: palette.blue }]}>
            <Text style={{ color: palette.lime, fontWeight: "900" }}>{post.author[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.authorName, { color: palette.ink }]}>{post.author}</Text>
            <Text style={{ color: palette.muted, fontSize: 10, marginTop: 2 }}>신뢰도 {post.manner} · 조회 {post.views}</Text>
          </View>
        </View>

        {!post.mine && (
          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="제안하기"
              onPress={openOfferModal}
              style={[styles.offerButton, { backgroundColor: palette.white, borderColor: palette.lime }]}
            >
              <Text style={{ color: palette.lime, fontWeight: "800", fontSize: 14 }}>제안하기</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="1:1 채팅 열기"
              onPress={openChat}
              disabled={openingChat}
              style={[styles.chatButton, { backgroundColor: palette.lime, opacity: openingChat ? 0.7 : 1 }]}
            >
              {openingChat ? <ActivityIndicator color={palette.white} /> : <Text style={{ color: palette.white, fontWeight: "800", fontSize: 15 }}>채팅하기</Text>}
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal visible={offerModalVisible} transparent animationType="slide" onRequestClose={() => setOfferModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}>
          <Pressable accessibilityRole="button" accessibilityLabel="제안 작성 닫기" style={styles.backdrop} onPress={() => setOfferModalVisible(false)} />
          <View style={[styles.sheet, { backgroundColor: palette.paper, paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
            <View style={[styles.handle, { backgroundColor: palette.line }]} />
            <Text style={[styles.sheetTitle, { color: palette.ink }]}>가격 제안하기</Text>
            <Text style={[styles.sheetSub, { color: palette.muted }]} numberOfLines={1}>{post.title}</Text>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: palette.ink }]}>제안 금액</Text>
              <TextInput
                value={offerPrice}
                onChangeText={setOfferPrice}
                keyboardType="number-pad"
                placeholder="금액을 입력하세요"
                placeholderTextColor={palette.muted}
                style={[styles.input, { backgroundColor: palette.white, borderColor: palette.line, color: palette.ink }]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: palette.ink }]}>메시지</Text>
              <TextInput
                value={offerMessage}
                onChangeText={setOfferMessage}
                multiline
                maxLength={300}
                textAlignVertical="top"
                placeholder="거래 조건이나 원하는 시간을 적어주세요."
                placeholderTextColor={palette.muted}
                style={[styles.textarea, { backgroundColor: palette.white, borderColor: palette.line, color: palette.ink }]}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="제안 보내기"
              onPress={submitOffer}
              disabled={submittingOffer}
              style={[styles.submitOffer, { backgroundColor: palette.lime, opacity: submittingOffer ? 0.7 : 1 }]}
            >
              {submittingOffer ? <ActivityIndicator color={palette.white} /> : <Text style={{ color: palette.white, fontWeight: "800", fontSize: 14 }}>제안 보내기</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, borderBottomWidth: 1 },
  eyebrow: { fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  headerTitle: { fontSize: 14, fontWeight: "800", marginTop: 2 },
  heart: { width: 38, height: 38, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { fontSize: 10, fontWeight: "700", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, overflow: "hidden" },
  title: { fontSize: 19, fontWeight: "800", marginTop: 2 },
  meta: { fontSize: 11 },
  deadline: { fontSize: 11, fontWeight: "700" },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priceLabel: { fontSize: 10 },
  priceValue: { fontSize: 20, fontWeight: "900", marginTop: 3 },
  offerBubble: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  label: { fontSize: 10, fontWeight: "700" },
  description: { fontSize: 13, lineHeight: 20 },
  authorCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  authorName: { fontSize: 14, fontWeight: "800" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  offerButton: { flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderRadius: 14, paddingVertical: 15 },
  chatButton: { flex: 1.4, alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 15 },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(31,25,35,0.42)" },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 32, gap: 14 },
  handle: { alignSelf: "center", width: 38, height: 4, borderRadius: 2 },
  sheetTitle: { fontSize: 17, fontWeight: "900" },
  sheetSub: { fontSize: 11, marginTop: -8 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "800" },
  input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, fontSize: 13 },
  textarea: { minHeight: 100, borderWidth: 1, borderRadius: 13, padding: 13, fontSize: 12, lineHeight: 18 },
  submitOffer: { alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 15 },
});
