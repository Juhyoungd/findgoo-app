import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { PostCard } from "@/src/components/market/PostCard";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";
import type { Post } from "@/src/types/findgoo";

export type MyCollectionKind = "buy" | "urgent" | "saved";

const collectionCopy: Record<MyCollectionKind, { eyebrow: string; title: string; description: string; empty: string }> = {
  buy: { eyebrow: "MY BUY", title: "내 구매글", description: "내가 찾고 있는 물건과 받은 제안을 한눈에 확인하세요.", empty: "아직 작성한 구매글이 없어요." },
  urgent: { eyebrow: "MY URGENT", title: "내 급구", description: "등록한 급구의 지원 현황과 거래 상태를 확인하세요.", empty: "아직 작성한 급구가 없어요." },
  saved: { eyebrow: "SAVED", title: "찜한 글", description: "관심 있게 저장한 구매글과 급구를 모아봤어요.", empty: "아직 찜한 글이 없어요." },
};

// [구매글] [급구] [찜한 글] 마이페이지 요약 버튼에서 이동하는 공통 목록 화면
export function MyCollectionScreen({ kind }: { kind: MyCollectionKind }) {
  const { palette } = useTheme();
  const router = useRouter();
  const { posts, savedPostIds, toggleSaved } = useAppData();
  const copy = collectionCopy[kind];
  const filtered = posts.filter((post) => {
    if (kind === "saved") return savedPostIds.includes(post.id);
    return post.mine && post.type === kind;
  });

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/my");
  }

  function openPost(post: Post) {
    const priceLabel = post.type === "buy" ? "희망 가격" : "지원 금액";
    Alert.alert(post.title, `${post.description}\n\n${priceLabel}: ${won(post.price)}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <AppHeader />
      <View style={[styles.pageHeader, { borderBottomColor: palette.line }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="마이페이지로 돌아가기" onPress={goBack} style={({ pressed }) => [styles.backButton, { backgroundColor: palette.white, borderColor: palette.line }, pressed && styles.pressed]}>
          <Text style={[styles.backIcon, { color: palette.ink }]}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: palette.lime }]}>{copy.eyebrow}</Text>
          <Text style={[styles.title, { color: palette.ink }]}>{copy.title}</Text>
        </View>
        <View style={[styles.countPill, { backgroundColor: palette.blue }]}>
          <Text style={[styles.countText, { color: palette.lime }]}>{filtered.length}</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            saved={savedPostIds.includes(item.id)}
            totalOfferCount={item.offerCount}
            onOpen={openPost}
            onToggleSaved={(post) => toggleSaved(post.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={[styles.introCard, { backgroundColor: palette.white, borderColor: palette.line }]}>
            <View style={[styles.introIcon, { backgroundColor: palette.blue }]}>
              <Text style={{ color: palette.lime, fontSize: 18, fontWeight: "800" }}>{kind === "buy" ? "⌕" : kind === "urgent" ? "ϟ" : "♥"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.introTitle, { color: palette.ink }]}>{filtered.length}개의 글</Text>
              <Text style={[styles.description, { color: palette.muted }]}>{copy.description}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: palette.white, borderColor: palette.line }]}>
            <Text style={[styles.emptyIcon, { color: palette.lime }]}>⌕</Text>
            <Text style={[styles.emptyTitle, { color: palette.ink }]}>{copy.empty}</Text>
            <Text style={[styles.emptyBody, { color: palette.muted }]}>새 글을 등록하거나 관심 있는 글에 하트를 눌러보세요.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pageHeader: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 72, paddingHorizontal: 20, borderBottomWidth: 1 },
  backButton: { width: 38, height: 38, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 28, lineHeight: 30, marginTop: -2 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  headerCopy: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  title: { fontSize: 19, fontWeight: "800" },
  countPill: { minWidth: 34, height: 28, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  countText: { fontSize: 12, fontWeight: "800" },
  listContent: { padding: 20, paddingBottom: 36 },
  introCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 16 },
  introIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  introTitle: { fontSize: 13, fontWeight: "800" },
  description: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  empty: { alignItems: "center", gap: 7, borderWidth: 1, borderStyle: "dashed", borderRadius: 16, paddingHorizontal: 24, paddingVertical: 42 },
  emptyIcon: { fontSize: 25, fontWeight: "800" },
  emptyTitle: { fontSize: 14, fontWeight: "700" },
  emptyBody: { fontSize: 10, lineHeight: 15, textAlign: "center" },
});
