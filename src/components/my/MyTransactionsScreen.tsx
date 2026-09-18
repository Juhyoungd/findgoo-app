import { useState } from "react";
import { FlatList, Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { BackButton } from "@/src/components/common/BackButton";
import { MannerReviewModal } from "@/src/components/profile/MannerReviewModal";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { useAppData } from "@/src/state/AppDataContext";
import { useAuth } from "@/src/state/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";
import type { Offer, Transaction } from "@/src/types/findgoo";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useToast } from "@/src/state/ToastContext";

type ReviewTarget = { transactionId: string; revieweeId: string; revieweeName: string };

// [진행 중 거래] 홈에서 최근 채팅 대신 제공하는 실제 거래 중심 바로가기
export function MyTransactionsScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { offers, posts, conversations, transactions, updateTransactionStatus, myReviewedTransactionIds, submitMannerReview } = useAppData();
  const { showToast } = useToast();
  const myId = session?.user.id;
  const activeTransactions = transactions.filter((item) => !["completed", "canceled"].includes(item.status));
  // 채팅방에서 "거래 완료"를 누르면 상대방에게 알림이 가는데, 알림을 눌러 여기로 왔을 때
  // 아무것도 안 보이면 안 되니까(완료된 거래는 활성 목록에서 빠지기 때문에), 아직 내가
  // 후기를 안 남긴 완료 거래를 별도로 보여줍니다.
  const pendingReviewTransactions = transactions.filter((item) => item.status === "completed" && !myReviewedTransactionIds.has(item.id));

  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  function counterpartyNameFor(transaction: Transaction) {
    const offer = offers.find((candidate) => candidate.id === transaction.offerId);
    if (offer) return offer.nickname;
    const counterpartyId = transaction.sellerId === myId ? transaction.buyerId : transaction.sellerId;
    const conversation = conversations.find((candidate) => candidate.postId === transaction.postId && (candidate.sellerId === counterpartyId || candidate.buyerId === counterpartyId));
    return conversation?.counterpartyName ?? "상대방";
  }

  function openReview(transaction: Transaction) {
    const revieweeId = transaction.sellerId === myId ? transaction.buyerId : transaction.sellerId;
    setReviewTarget({ transactionId: transaction.id, revieweeId, revieweeName: counterpartyNameFor(transaction) });
  }

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

  async function changeStatus(transaction: Transaction, status: "in_progress" | "completed" | "canceled" | "disputed") {
    const { error } = await updateTransactionStatus(transaction.id, status);
    if (error) return showToast(error);

    if (status === "completed" && myId && !myReviewedTransactionIds.has(transaction.id)) {
      openReview(transaction);
      return;
    }
    showToast("거래 상태를 변경했어요.");
  }

  async function submitReview(goodManner: boolean, body: string) {
    if (!reviewTarget) return;
    try {
      setSubmittingReview(true);
      const { error } = await submitMannerReview(reviewTarget.transactionId, reviewTarget.revieweeId, goodManner, body);
      if (error) return showToast(error);
      setReviewTarget(null);
      showToast("매너 후기를 남겼어요. 감사합니다!");
    } finally {
      setSubmittingReview(false);
    }
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
        ListHeaderComponent={
          <View style={{ gap: 11 }}>
            <View style={[styles.guide, { backgroundColor: palette.white, borderColor: palette.line }]}><Text style={[styles.guideTitle, { color: palette.ink }]}>거래가 성사된 제안만 모았어요</Text><Text style={[styles.guideBody, { color: palette.muted }]}>상대와 1:1 채팅으로 약속 장소와 시간을 확정하세요.</Text></View>
            {pendingReviewTransactions.length > 0 && (
              <View style={{ gap: 8, marginBottom: 3 }}>
                <Text style={[styles.sectionTitle, { color: palette.ink }]}>후기를 기다리는 완료 거래</Text>
                {pendingReviewTransactions.map((item) => {
                  const post = posts.find((candidate) => candidate.id === item.postId);
                  const name = counterpartyNameFor(item);
                  return (
                    <View key={item.id} style={[styles.card, { backgroundColor: palette.white, borderColor: `${palette.lime}55` }]}>
                      <View style={styles.cardTop}>
                        <View style={[styles.avatar, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontWeight: "900" }}>{name[0]}</Text></View>
                        <View style={{ flex: 1 }}><Text style={[styles.nickname, { color: palette.ink }]}>{name}</Text><Text style={[styles.direction, { color: palette.muted }]} numberOfLines={1}>{post?.title ?? "삭제된 게시글"}</Text></View>
                      </View>
                      <Action label="매너 후기 남기기" onPress={() => openReview(item)} primary />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        }
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
                {item.status === "accepted" && <Action label="거래 시작" onPress={() => changeStatus(item, "in_progress")} />}
                {["accepted", "in_progress"].includes(item.status) && <Action label="거래 완료" onPress={() => changeStatus(item, "completed")} primary />}
                {["accepted", "in_progress"].includes(item.status) && <Action label="취소" onPress={() => Alert.alert("거래 취소", "거래를 취소할까요?", [{ text: "아니요", style: "cancel" }, { text: "취소하기", style: "destructive", onPress: () => changeStatus(item, "canceled") }])} />}
                <Action label="분쟁 신고" onPress={() => changeStatus(item, "disputed")} warning />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<View style={styles.empty}><Text style={[styles.emptyTitle, { color: palette.ink }]}>진행 중인 거래가 없어요</Text><Text style={{ color: palette.muted, fontSize: 11 }}>제안을 수락하면 이곳에 표시됩니다.</Text></View>}
      />

      <MannerReviewModal
        visible={!!reviewTarget}
        revieweeName={reviewTarget?.revieweeName ?? "상대방"}
        submitting={submittingReview}
        onClose={() => setReviewTarget(null)}
        onSubmit={submitReview}
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
  sectionTitle: { fontSize: 13, fontWeight: "800" },
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
