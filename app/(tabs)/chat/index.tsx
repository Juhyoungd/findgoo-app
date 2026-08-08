import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import type { Post } from "@/src/types/findgoo";

// [1:1 거래 채팅 목록] 메시지가 오간 글 기준으로 채팅방을 모아 보여줍니다.
export default function ChatListScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { posts, messages } = useAppData();

  const chatPosts = useMemo(() => {
    const postIds = new Set(messages.map((message) => message.postId));
    return posts.filter((post) => postIds.has(post.id));
  }, [posts, messages]);

  function lastMessage(post: Post) {
    return [...messages].reverse().find((message) => message.postId === post.id)?.text ?? "거래 채팅을 시작하세요.";
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }}>
      <AppHeader />
      <Text style={[styles.heading, { color: palette.ink }]}>1:1 거래 채팅</Text>
      <View style={[styles.note, { backgroundColor: palette.blue }]}>
        <Text style={{ color: palette.ink, fontSize: 12 }}>거래가 성사된 상대만 표시돼요. 제안 단계에서는 채팅이 열리지 않습니다.</Text>
      </View>
      <FlatList
        data={chatPosts}
        keyExtractor={(post) => post.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/chat/${item.id}`)} style={[styles.row, { backgroundColor: palette.white, borderColor: palette.line }]}>
            <View style={[styles.avatar, { backgroundColor: palette.blue }]}>
              <Text style={{ color: palette.lime, fontWeight: "700" }}>{(item.mine ? "상" : item.author)[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: palette.ink }]}>{item.mine ? "거래 상대" : item.author}</Text>
              <Text style={{ color: palette.muted, fontSize: 11 }} numberOfLines={1}>{item.title}</Text>
              <Text style={{ color: palette.muted, fontSize: 11, marginTop: 4 }} numberOfLines={1}>{lastMessage(item)}</Text>
            </View>
            <Text style={{ color: palette.muted, fontSize: 16 }}>›</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 26 }}>●</Text>
            <Text style={[styles.emptyTitle, { color: palette.ink }]}>열린 거래 채팅이 없어요</Text>
            <Text style={{ color: palette.muted, fontSize: 12, textAlign: "center" }}>제안이 선택되어 거래가 성사되면{"\n"}이곳에 1:1 채팅방이 생깁니다.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 20, fontWeight: "800", paddingHorizontal: 24, paddingTop: 16 },
  note: { marginHorizontal: 24, marginTop: 14, borderRadius: 10, padding: 12 },
  listContent: { padding: 24, paddingBottom: 110 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, padding: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 14, fontWeight: "700" },
  empty: { alignItems: "center", gap: 8, paddingVertical: 60 },
  emptyTitle: { fontWeight: "700" },
});
