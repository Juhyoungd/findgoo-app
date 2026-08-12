import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { BackButton } from "@/src/components/common/BackButton";
import { MotionPressable as Pressable } from "@/src/components/common/MotionPressable";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";
import type { Offer } from "@/src/types/findgoo";

const statusCopy: Record<Offer["status"], string> = { pending: "검토 대기", accepted: "수락됨", rejected: "거절됨", canceled: "취소됨" };

// [받은 제안] [보낸 제안] 홈 활동 요약에서 이동하는 제안 목록
export function OfferListScreen({ direction }: { direction: Offer["direction"] }) {
  const { palette } = useTheme();
  const router = useRouter();
  const { offers, posts } = useAppData();
  const filtered = offers.filter((offer) => offer.direction === direction);
  const pendingCount = filtered.filter((offer) => offer.status === "pending").length;
  const title = direction === "incoming" ? "받은 제안" : "보낸 제안";
  const description = direction === "incoming" ? "내 글에 도착한 가격과 거래 조건을 확인하세요." : "내가 제안한 거래의 현재 상태를 확인하세요.";

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <AppHeader />
      <View style={[styles.header, { borderBottomColor: palette.line }]}>
        <BackButton onPress={goBack} accessibilityLabel="홈으로 돌아가기" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: palette.lime }]}>{direction === "incoming" ? "INCOMING" : "OUTGOING"}</Text>
          <Text style={[styles.title, { color: palette.ink }]}>{title}</Text>
        </View>
        <View style={[styles.pendingPill, { backgroundColor: pendingCount ? `${palette.orange}18` : palette.blue }]}>
          <Text style={{ color: pendingCount ? palette.orange : palette.lime, fontSize: 10, fontWeight: "800" }}>대기 {pendingCount}</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(offer) => offer.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={[styles.intro, { backgroundColor: palette.white, borderColor: palette.line }]}>
            <Text style={[styles.introTitle, { color: palette.ink }]}>{filtered.length}개의 제안</Text>
            <Text style={[styles.introBody, { color: palette.muted }]}>{description}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const post = posts.find((candidate) => candidate.id === item.postId);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${title} 상세, ${post?.title ?? "삭제된 글"}`}
              onPress={() => router.push(`/offers/${item.id}`)}
              style={({ pressed }) => [styles.card, { backgroundColor: palette.white, borderColor: item.status === "pending" ? `${palette.orange}66` : palette.line }, pressed && styles.pressed]}
            >
              <View style={styles.cardTop}>
                <Text style={[styles.nickname, { color: palette.ink }]}>{item.nickname}</Text>
                <View style={[styles.status, { backgroundColor: item.status === "pending" ? `${palette.orange}16` : palette.paper }]}>
                  <Text style={{ color: item.status === "pending" ? palette.orange : palette.muted, fontSize: 9, fontWeight: "800" }}>{statusCopy[item.status]}</Text>
                </View>
              </View>
              <Text style={[styles.postTitle, { color: palette.muted }]} numberOfLines={1}>{post?.title ?? "삭제된 게시글"}</Text>
              <Text style={[styles.message, { color: palette.ink }]} numberOfLines={2}>{item.message}</Text>
              <View style={[styles.priceRow, { borderTopColor: palette.line }]}>
                <Text style={[styles.time, { color: palette.muted }]}>{item.created}</Text>
                <Text style={[styles.price, { color: palette.ink }]}>{won(item.price)}</Text>
                <Text style={[styles.chevron, { color: palette.muted }]}>›</Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={<View style={styles.empty}><Text style={[styles.emptyTitle, { color: palette.ink }]}>아직 제안이 없어요</Text><Text style={{ color: palette.muted, fontSize: 11 }}>{direction === "incoming" ? "내 글에 제안이 오면 여기에 표시됩니다." : "관심 있는 글에 제안해보세요."}</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, borderBottomWidth: 1 },
  pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
  eyebrow: { fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  title: { fontSize: 19, fontWeight: "800", marginTop: 2 },
  pendingPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  content: { padding: 20, paddingBottom: 36 },
  intro: { borderWidth: 1, borderRadius: 15, padding: 14, marginBottom: 14 },
  introTitle: { fontSize: 13, fontWeight: "800" },
  introBody: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  card: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 8 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  nickname: { fontSize: 13, fontWeight: "800" },
  status: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  postTitle: { fontSize: 10 },
  message: { fontSize: 12, lineHeight: 17 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, paddingTop: 10, marginTop: 2 },
  time: { flex: 1, fontSize: 9 },
  price: { fontSize: 14, fontWeight: "900" },
  chevron: { fontSize: 16 },
  empty: { alignItems: "center", gap: 7, paddingVertical: 60 },
  emptyTitle: { fontSize: 14, fontWeight: "800" },
});
