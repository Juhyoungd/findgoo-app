import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { BackButton } from "@/src/components/common/BackButton";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";

// [진행 중 거래] 홈에서 최근 채팅 대신 제공하는 실제 거래 중심 바로가기
export function MyTransactionsScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { offers, posts } = useAppData();
  const activeOffers = offers.filter((offer) => offer.status === "accepted");

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <AppHeader />
      <View style={[styles.header, { borderBottomColor: palette.line }]}>
        <BackButton onPress={goBack} accessibilityLabel="홈으로 돌아가기" />
        <View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: palette.lime }]}>ACTIVE DEALS</Text><Text style={[styles.title, { color: palette.ink }]}>진행 중 거래</Text></View>
        <View style={[styles.count, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontSize: 11, fontWeight: "900" }}>{activeOffers.length}</Text></View>
      </View>

      <FlatList
        data={activeOffers}
        keyExtractor={(offer) => offer.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: 11 }} />}
        ListHeaderComponent={<View style={[styles.guide, { backgroundColor: palette.white, borderColor: palette.line }]}><Text style={[styles.guideTitle, { color: palette.ink }]}>거래가 성사된 제안만 모았어요</Text><Text style={[styles.guideBody, { color: palette.muted }]}>상대와 1:1 채팅으로 약속 장소와 시간을 확정하세요.</Text></View>}
        renderItem={({ item }) => {
          const post = posts.find((candidate) => candidate.id === item.postId);
          return (
            <View style={[styles.card, { backgroundColor: palette.white, borderColor: palette.line }]}>
              <View style={styles.cardTop}><View style={[styles.avatar, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontWeight: "900" }}>{item.nickname[0]}</Text></View><View style={{ flex: 1 }}><Text style={[styles.nickname, { color: palette.ink }]}>{item.nickname}</Text><Text style={[styles.direction, { color: palette.muted }]}>{item.direction === "incoming" ? "판매 제안 받음" : "내가 보낸 제안"}</Text></View><Text style={[styles.price, { color: palette.ink }]}>{won(item.price)}</Text></View>
              <Text style={[styles.postTitle, { color: palette.ink }]} numberOfLines={1}>{post?.title ?? "삭제된 게시글"}</Text>
              {/* 제안은 아직 실제 회원과 연결되지 않은 예시 데이터라 채팅 목록으로 보냅니다 */}
              <Pressable accessibilityRole="button" accessibilityLabel={`${item.nickname}님과 거래 채팅 열기`} onPress={() => router.push("/chat")} style={({ pressed }) => [styles.chatButton, { backgroundColor: palette.lime }, pressed && styles.pressed]}><Text style={{ color: palette.white, fontSize: 12, fontWeight: "800" }}>1:1 거래 채팅</Text></Pressable>
            </View>
          );
        }}
        ListEmptyComponent={<View style={styles.empty}><Text style={[styles.emptyTitle, { color: palette.ink }]}>진행 중인 거래가 없어요</Text><Text style={{ color: palette.muted, fontSize: 11 }}>제안을 수락하면 이곳에 표시됩니다.</Text></View>}
      />
    </SafeAreaView>
  );
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
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  empty: { alignItems: "center", gap: 7, paddingVertical: 60 },
  emptyTitle: { fontSize: 14, fontWeight: "800" },
});
