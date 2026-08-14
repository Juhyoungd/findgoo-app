import { FlatList, Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { BackButton } from "@/src/components/common/BackButton";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";
import type { Offer } from "@/src/types/findgoo";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useToast } from "@/src/state/ToastContext";

// [진행 중 거래] 홈에서 최근 채팅 대신 제공하는 실제 거래 중심 바로가기
export function MyTransactionsScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { offers, posts, transactions, updateTransactionStatus } = useAppData();
  const { showToast } = useToast();
  const activeTransactions = transactions.filter((item) => !["completed", "canceled"].includes(item.status));

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  async function openTradeChat(offer: Offer) {
    if (!offer.offererId || !isSupabaseConfigured) {
      router.push("/chat");
      return;
    }
    const { data } = await supabase.from("conversations").select("id").eq("post_id", offer.postId).eq("buyer_id", offer.offererId).maybeSingle();
    router.push(data ? `/chat/${data.id}` : "/chat");
  }

  async function changeStatus(transactionId: string, status: "in_progress" | "completed" | "canceled" | "disputed") {
    const { error } = await updateTransactionStatus(transactionId, status);
    if (error) showToast(error);
    else showToast(status === "completed" ? "거래를 완료했어요. 매너 점수에 반영됩니다." : "거래 상태를 변경했어요.");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <AppHeader />
      <View style={[styles.header, { borderBottomColor: palette.line }]}>
        <BackButton onPress={goBack} accessibilityLabel="홈으로 돌아가기" />
        <View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: palette.lime }]}>ACTIVE DEALS</Text><Text style={[styles.title, { color: palette.ink }]}>진행 중 거래</Text></View>
        <View style={[styles.count, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontSize: 11, fontWeight: "900" }}>{activeTransactions.length}</Text></View>
      </View>

      <FlatList
        data={activeTransactions}
        keyExtractor={(transaction) => transaction.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: 11 }} />}
        ListHeaderComponent={<View style={[styles.guide, { backgroundColor: palette.white, borderColor: palette.line }]}><Text style={[styles.guideTitle, { color: palette.ink }]}>거래가 성사된 제안만 모았어요</Text><Text style={[styles.guideBody, { color: palette.muted }]}>상대와 1:1 채팅으로 약속 장소와 시간을 확정하세요.</Text></View>}
        renderItem={({ item }) => {
          const offer = offers.find((candidate) => candidate.id === item.offerId);
          const post = posts.find((candidate) => candidate.id === item.postId);
          if (!offer) return null;
          return (
            <View style={[styles.card, { backgroundColor: palette.white, borderColor: palette.line }]}>
              <View style={styles.cardTop}><View style={[styles.avatar, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontWeight: "900" }}>{offer.nickname[0]}</Text></View><View style={{ flex: 1 }}><Text style={[styles.nickname, { color: palette.ink }]}>{offer.nickname}</Text><Text style={[styles.direction, { color: palette.muted }]}>{statusLabel(item.status)}</Text></View><Text style={[styles.price, { color: palette.ink }]}>{won(offer.price)}</Text></View>
              <Text style={[styles.postTitle, { color: palette.ink }]} numberOfLines={1}>{post?.title ?? "삭제된 게시글"}</Text>
              <MotionPressable accessibilityRole="button" accessibilityLabel={`${offer.nickname}님과 거래 채팅 열기`} onPress={() => openTradeChat(offer)} style={[styles.chatButton, { backgroundColor: palette.lime }]}><Text style={{ color: palette.white, fontSize: 12, fontWeight: "800" }}>1:1 거래 채팅</Text></MotionPressable>
              <View style={styles.actions}>
                {item.status === "accepted" && <Action label="거래 시작" onPress={() => changeStatus(item.id, "in_progress")} />}
                {["accepted", "in_progress"].includes(item.status) && <Action label="거래 완료" onPress={() => changeStatus(item.id, "completed")} primary />}
                {["accepted", "in_progress"].includes(item.status) && <Action label="취소" onPress={() => Alert.alert("거래 취소", "거래를 취소할까요?", [{ text: "아니요", style: "cancel" }, { text: "취소하기", style: "destructive", onPress: () => changeStatus(item.id, "canceled") }])} />}
                <Action label="분쟁 신고" onPress={() => changeStatus(item.id, "disputed")} warning />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<View style={styles.empty}><Text style={[styles.emptyTitle, { color: palette.ink }]}>진행 중인 거래가 없어요</Text><Text style={{ color: palette.muted, fontSize: 11 }}>제안을 수락하면 이곳에 표시됩니다.</Text></View>}
      />
    </SafeAreaView>
  );

  function Action({ label, onPress, primary = false, warning = false }: { label: string; onPress: () => void; primary?: boolean; warning?: boolean }) {
    return <MotionPressable onPress={onPress} style={[styles.action, { borderColor: warning ? palette.orange : primary ? palette.lime : palette.line, backgroundColor: primary ? `${palette.lime}12` : palette.white }]}><Text style={{ color: warning ? palette.orange : primary ? palette.lime : palette.muted, fontSize: 9, fontWeight: "900" }}>{label}</Text></MotionPressable>;
  }
}

function statusLabel(status: string) {
  return ({ requested: "거래 요청", accepted: "수락됨", in_progress: "거래 진행 중", completed: "거래 완료", canceled: "거래 취소", disputed: "분쟁 처리 중" } as Record<string, string>)[status] ?? status;
}

const styles = StyleSheet.create({
  header: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, borderBottomWidth: 1 },
  eyebrow: { fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  title: { fontSize: 19, fontWeight: "800", marginTop: 2 },
  count: { minWidth: 34, height: 28, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, paddingBottom: 36 },
  guide: { borderWidth: 1, borderRadius: 15, padding: 14, marginBottom: 14 },
  guideTitle: { fontSize: 13, fontWeight: "800" },
  guideBody: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  card: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 11 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  nickname: { fontSize: 13, fontWeight: "800" },
  direction: { fontSize: 9, marginTop: 2 },
  price: { fontSize: 14, fontWeight: "900" },
  postTitle: { fontSize: 12, fontWeight: "700" },
  chatButton: { alignItems: "center", borderRadius: 12, paddingVertical: 11 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  action: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  empty: { alignItems: "center", gap: 7, paddingVertical: 60 },
  emptyTitle: { fontSize: 14, fontWeight: "800" },
});
