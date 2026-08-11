import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { MotionPressable as Pressable } from "@/src/components/common/MotionPressable";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";

const statusLabel = { open: "거래 가능", reserved: "진행 중", closed: "마감" } as const;

// [게시글 상세] 구매글/급구 카드를 눌렀을 때 들어오는 상세 화면
export function PostDetailScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { posts, savedPostIds, toggleSaved, startOrGetConversation } = useAppData();
  const post = posts.find((item) => item.id === postId);
  const [openingChat, setOpeningChat] = useState(false);

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
        <Pressable accessibilityRole="button" accessibilityLabel="목록으로 돌아가기" onPress={goBack} style={({ pressed }) => [styles.back, { backgroundColor: palette.white, borderColor: palette.line }, pressed && styles.pressed]}>
          <Text style={[styles.backIcon, { color: palette.ink }]}>‹</Text>
        </Pressable>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="1:1 채팅 열기"
            onPress={openChat}
            disabled={openingChat}
            style={[styles.chatButton, { backgroundColor: palette.lime, opacity: openingChat ? 0.7 : 1 }]}
          >
            {openingChat ? <ActivityIndicator color={palette.white} /> : <Text style={{ color: palette.white, fontWeight: "800", fontSize: 15 }}>채팅하기</Text>}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, borderBottomWidth: 1 },
  back: { width: 38, height: 38, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 28, lineHeight: 30, marginTop: -2 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
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
  chatButton: { alignItems: "center", borderRadius: 14, paddingVertical: 15, marginTop: 4 },
});
