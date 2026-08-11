import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";
import type { Offer } from "@/src/types/findgoo";

const statusCopy: Record<Offer["status"], string> = { pending: "검토 대기", accepted: "제안 수락", rejected: "제안 거절", canceled: "제안 취소" };

// [제안 상세] 받은 제안 수락·거절, 보낸 제안 취소와 거래 채팅 연결
export function OfferDetailScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { offerId } = useLocalSearchParams<{ offerId: string }>();
  const { offers, posts, updateOfferStatus } = useAppData();
  const offer = offers.find((candidate) => candidate.id === offerId);
  const post = posts.find((candidate) => candidate.id === offer?.postId);

  if (!offer) {
    return <SafeAreaView style={[styles.missing, { backgroundColor: palette.paper }]}><Text style={{ color: palette.muted }}>제안을 찾을 수 없어요.</Text></SafeAreaView>;
  }

  const isIncoming = offer.direction === "incoming";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <AppHeader />
      <View style={[styles.header, { borderBottomColor: palette.line }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="제안 목록으로 돌아가기" onPress={() => router.back()} hitSlop={8}><Text style={[styles.back, { color: palette.ink }]}>‹</Text></Pressable>
        <View style={{ flex: 1 }}><Text style={[styles.headerTitle, { color: palette.ink }]}>제안 상세</Text><Text style={[styles.headerSub, { color: palette.muted }]}>{isIncoming ? "받은 제안" : "보낸 제안"}</Text></View>
        <View style={[styles.status, { backgroundColor: offer.status === "pending" ? `${palette.orange}18` : palette.blue }]}><Text style={{ color: offer.status === "pending" ? palette.orange : palette.lime, fontSize: 9, fontWeight: "800" }}>{statusCopy[offer.status]}</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.personCard, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <View style={[styles.avatar, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontWeight: "900" }}>{offer.nickname[0]}</Text></View>
          <View style={{ flex: 1 }}><Text style={[styles.nickname, { color: palette.ink }]}>{offer.nickname}</Text><Text style={[styles.time, { color: palette.muted }]}>{offer.created}</Text></View>
          <Text style={[styles.price, { color: palette.ink }]}>{won(offer.price)}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <Text style={[styles.label, { color: palette.muted }]}>관련 글</Text>
          <Text style={[styles.postTitle, { color: palette.ink }]}>{post?.title ?? "삭제된 게시글"}</Text>
          {post && <Text style={[styles.postMeta, { color: palette.muted }]}>{post.type === "buy" ? "구매글" : "급구"} · {post.region} · {won(post.price)}</Text>}
        </View>

        <View style={[styles.section, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <Text style={[styles.label, { color: palette.muted }]}>제안 메시지</Text>
          <Text style={[styles.message, { color: palette.ink }]}>{offer.message}</Text>
        </View>

        {offer.status === "pending" && isIncoming && (
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="제안 거절" onPress={() => updateOfferStatus(offer.id, "rejected")} style={[styles.secondaryButton, { backgroundColor: palette.white, borderColor: palette.line }]}><Text style={{ color: palette.muted, fontWeight: "700" }}>거절</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="제안 수락" onPress={() => updateOfferStatus(offer.id, "accepted")} style={[styles.primaryButton, { backgroundColor: palette.lime }]}><Text style={{ color: palette.white, fontWeight: "800" }}>수락하고 채팅 열기</Text></Pressable>
          </View>
        )}
        {offer.status === "pending" && !isIncoming && (
          <Pressable accessibilityRole="button" accessibilityLabel="보낸 제안 취소" onPress={() => updateOfferStatus(offer.id, "canceled")} style={[styles.fullButton, { backgroundColor: palette.white, borderColor: palette.line }]}><Text style={{ color: palette.orange, fontWeight: "800" }}>제안 취소</Text></Pressable>
        )}
        {offer.status === "accepted" && (
          // 제안은 아직 실제 회원과 연결된 DB 데이터가 아니라서(예시 닉네임), 특정 대화방으로 바로
          // 못 열고 채팅 목록으로 보냅니다. 제안 기능도 DB로 옮기면 실제 대화방으로 연결할 수 있어요.
          <Pressable accessibilityRole="button" accessibilityLabel="거래 채팅 열기" onPress={() => router.push("/chat")} style={[styles.fullButton, { backgroundColor: palette.lime, borderColor: palette.lime }]}><Text style={{ color: palette.white, fontWeight: "800" }}>1:1 거래 채팅 열기</Text></Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, borderBottomWidth: 1 },
  back: { fontSize: 30, lineHeight: 32 },
  headerTitle: { fontSize: 17, fontWeight: "800" },
  headerSub: { fontSize: 9, marginTop: 2 },
  status: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  content: { padding: 20, paddingBottom: 36, gap: 12 },
  personCard: { flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderRadius: 16, padding: 15 },
  avatar: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  nickname: { fontSize: 14, fontWeight: "800" },
  time: { fontSize: 9, marginTop: 3 },
  price: { fontSize: 16, fontWeight: "900" },
  section: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 7 },
  label: { fontSize: 9, fontWeight: "700" },
  postTitle: { fontSize: 14, fontWeight: "800" },
  postMeta: { fontSize: 10 },
  message: { fontSize: 13, lineHeight: 20 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  secondaryButton: { flex: 0.8, alignItems: "center", borderWidth: 1, borderRadius: 14, paddingVertical: 14 },
  primaryButton: { flex: 1.7, alignItems: "center", borderRadius: 14, paddingVertical: 14 },
  fullButton: { alignItems: "center", borderWidth: 1, borderRadius: 14, paddingVertical: 14, marginTop: 4 },
});
