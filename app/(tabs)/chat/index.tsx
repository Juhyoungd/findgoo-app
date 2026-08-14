import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { appIcons } from "@/src/assets/app-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
import { MotionPressable as Pressable } from "@/src/components/common/MotionPressable";
import { ProfileAvatar } from "@/src/components/profile/ProfileAvatar";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { timeAgo, won } from "@/src/utils/format";
import type { Conversation } from "@/src/types/findgoo";

// [1:1 거래 채팅 목록] 내가 참여 중인 대화방을 최근 메시지 순으로 보여줍니다.
export default function ChatListScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { conversations, unreadConversationIds } = useAppData();

  function preview(conversation: Conversation) {
    return conversation.lastMessage ?? "대화를 시작해보세요.";
  }

  function subtitle(conversation: Conversation) {
    return conversation.lastMessageAt ? timeAgo(conversation.lastMessageAt) : "";
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["left", "right"]}>
      <Text style={[styles.heading, { color: palette.ink }]}>1:1 거래 채팅</Text>
      <View style={[styles.note, { backgroundColor: palette.blue }]}>
        <Text style={{ color: palette.ink, fontSize: 12 }}>글에 관심 있는 상대와 1:1로 대화할 수 있어요.</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(conversation) => conversation.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const unread = unreadConversationIds.has(item.id);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.counterpartyName}님과의 채팅${unread ? ", 안 읽은 메시지 있음" : ""}`}
              onPress={() => router.push(`/chat/${item.id}`)}
              style={[styles.row, { backgroundColor: unread ? `${palette.orange}0d` : palette.white, borderColor: unread ? palette.orange : palette.line }]}
            >
              <View>
                <ProfileAvatar nickname={item.counterpartyName} avatarUrl={item.counterpartyProfile.avatarUrl} size={40} />
                {unread && <View style={[styles.unreadDot, { backgroundColor: palette.orange, borderColor: palette.white }]} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.rowTop}>
                  <Text style={[styles.rowTitle, { color: palette.ink }]}>{item.counterpartyName}</Text>
                  <Text style={{ color: unread ? palette.orange : palette.muted, fontSize: 9, fontWeight: unread ? "800" : "400" }}>{subtitle(item)}</Text>
                </View>
                <Text style={{ color: palette.muted, fontSize: 11 }} numberOfLines={1}>{item.postTitle} · {won(item.postPrice)}</Text>
                <Text style={{ color: unread ? palette.ink : palette.muted, fontSize: 11, fontWeight: unread ? "700" : "400", marginTop: 4 }} numberOfLines={1}>{preview(item)}</Text>
              </View>
              <Text style={{ color: palette.muted, fontSize: 16 }}>›</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { borderColor: palette.line }]}><AppIcon name={appIcons.chat} color={palette.muted} size={24} /></View>
            <Text style={[styles.emptyTitle, { color: palette.ink }]}>열린 채팅이 없어요</Text>
            <Text style={{ color: palette.muted, fontSize: 12, textAlign: "center" }}>관심 있는 글의 상세 화면에서{"\n"}"채팅하기"를 누르면 대화방이 열려요.</Text>
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
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  unreadDot: { position: "absolute", top: -2, right: -2, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  rowTitle: { fontSize: 14, fontWeight: "700" },
  empty: { alignItems: "center", gap: 8, paddingVertical: 60 },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontWeight: "700" },
});
