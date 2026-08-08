import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { PostCard } from "@/src/components/market/PostCard";
import { categories } from "@/src/constants/feature-spec";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";
import type { Post } from "@/src/types/findgoo";

// [구매글] 웹의 /buy 페이지: 급구와 분리된 구매글 전용 목록
export default function BuyScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { posts, savedPostIds, toggleSaved } = useAppData();
  const [category, setCategory] = useState("전체");

  const filtered = useMemo(
    () => posts.filter((post) => post.type === "buy" && (category === "전체" || post.category === category)),
    [posts, category],
  );

  function openPost(post: Post) {
    Alert.alert(post.title, `${post.description}\n\n희망 가격: ${won(post.price)}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <AppHeader />
      <View style={styles.heading}>
        <Text style={[styles.headingLabel, { color: palette.lime }]}>NEARBY</Text>
        <Text style={[styles.headingTitle, { color: palette.ink }]}>이웃이 찾는 물건</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(post) => post.id}
        ListHeaderComponent={
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
            renderItem={({ item }) => (
              <Pressable onPress={() => setCategory(item)} style={[styles.categoryButton, { borderColor: palette.line, backgroundColor: category === item ? palette.ink : palette.white }]}>
                <Text style={{ color: category === item ? palette.white : palette.muted, fontSize: 12 }}>{item}</Text>
              </Pressable>
            )}
          />
        }
        renderItem={({ item }) => (
          <PostCard post={item} saved={savedPostIds.includes(item.id)} totalOfferCount={item.offerCount} onOpen={openPost} onToggleSaved={(post) => toggleSaved(post.id)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 28 }}>⌕</Text>
            <Text style={[styles.emptyTitle, { color: palette.ink }]}>조건에 맞는 글이 없어요</Text>
            <Text style={{ color: palette.muted, fontSize: 12 }}>카테고리를 바꾸거나 첫 글을 올려보세요.</Text>
            <Pressable onPress={() => router.push({ pathname: "/create", params: { type: "buy" } })} style={[styles.emptyButton, { backgroundColor: palette.ink }]}>
              <Text style={{ color: palette.white, fontWeight: "700", fontSize: 12 }}>글 올리기</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heading: { paddingHorizontal: 24, paddingTop: 16, gap: 6 },
  headingLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  headingTitle: { fontSize: 22, fontWeight: "800" },
  categoryRow: { gap: 8, paddingVertical: 16 },
  categoryButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  listContent: { paddingHorizontal: 24, paddingBottom: 110 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 60 },
  emptyTitle: { fontWeight: "700" },
  emptyButton: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginTop: 6 },
});
