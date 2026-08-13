import { useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { appIcons } from "@/src/assets/app-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
import { MotionPressable as Pressable } from "@/src/components/common/MotionPressable";
import { PostCard } from "@/src/components/market/PostCard";
import { PostSearchBar } from "@/src/components/market/PostSearchBar";
import { categories } from "@/src/constants/feature-spec";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import type { Post } from "@/src/types/findgoo";

// [구매글] 웹의 /buy 페이지: 급구와 분리된 구매글 전용 목록
export default function BuyScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { posts, savedPostIds, toggleSaved } = useAppData();
  const [category, setCategory] = useState("전체");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ko-KR");
    return posts.filter((post) => {
      if (post.type !== "buy" || (category !== "전체" && post.category !== category)) return false;
      if (!keyword) return true;
      return [post.title, post.description, post.category, post.region, post.author].some((value) => value.toLocaleLowerCase("ko-KR").includes(keyword));
    });
  }, [posts, category, query]);

  function openPost(post: Post) {
    router.push(`/post/${post.id}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["left", "right"]}>
      <View style={styles.heading}>
        <Text style={[styles.headingLabel, { color: palette.lime }]}>NEARBY</Text>
        <Text style={[styles.headingTitle, { color: palette.ink }]}>이웃이 찾는 물건</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(post) => post.id}
        ListHeaderComponent={
          <View>
            <PostSearchBar query={query} onChangeQuery={setQuery} placeholder="구매글 제목, 물건, 지역을 검색해요" resultCount={filtered.length} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {categories.map((item) => (
                <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryButton, { borderColor: palette.line, backgroundColor: category === item ? palette.ink : palette.white }]}>
                  <Text style={{ color: category === item ? palette.white : palette.muted, fontSize: 12 }}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard post={item} saved={savedPostIds.includes(item.id)} totalOfferCount={item.offerCount} onOpen={openPost} onToggleSaved={(post) => toggleSaved(post.id)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { borderColor: palette.line }]}><AppIcon name={appIcons.search} color={palette.muted} size={24} /></View>
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
  categoryRow: { gap: 8, paddingVertical: 14 },
  categoryButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  listContent: { paddingHorizontal: 24, paddingBottom: 110 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 60 },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontWeight: "700" },
  emptyButton: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginTop: 6 },
});
