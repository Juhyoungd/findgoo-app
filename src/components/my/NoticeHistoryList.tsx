import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { appIcons, type AppIconName } from "@/src/assets/app-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useTheme } from "@/src/theme/ThemeContext";
import type { AppNotice } from "@/src/types/findgoo";

const noticeIcon: Record<AppNotice["kind"], AppIconName> = {
  offer: appIcons.send,
  trade: appIcons.done,
  chat: appIcons.chat,
  favorite: appIcons.saved,
  keyword: appIcons.search,
  urgent: appIcons.urgent,
  system: appIcons.bell,
};

type NoticeHistoryListProps = {
  notices: AppNotice[];
  onRead: (noticeId: string) => void;
  compact?: boolean;
};

// [전체 알림] 읽음·안 읽음 상태를 함께 보여주는 개인 알림 목록
export function NoticeHistoryList({ notices, onRead, compact = false }: NoticeHistoryListProps) {
  const { palette } = useTheme();
  const router = useRouter();

  function openNotice(notice: AppNotice) {
    onRead(notice.id);
    switch (notice.target.type) {
      case "post":
        router.push(`/post/${notice.target.postId}`);
        break;
      case "offer":
        router.push(`/offers/${notice.target.offerId}`);
        break;
      case "chat":
        router.push(`/chat/${notice.target.conversationId}`);
        break;
      case "transactions":
        router.push("/my/transactions");
        break;
      case "region":
        router.push("/profile/region");
        break;
    }
  }

  if (notices.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: palette.white, borderColor: palette.line }]}>
        <AppIcon name={appIcons.done} color={palette.muted} size={22} />
        <Text style={[styles.emptyTitle, { color: palette.ink }]}>새로운 알림이 없어요</Text>
        <Text style={[styles.emptyBody, { color: palette.muted }]}>거래나 관심 글에 변화가 생기면 여기에 알려드릴게요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {notices.map((notice) => (
        <MotionPressable
          key={notice.id}
          accessibilityRole="button"
          accessibilityLabel={`${notice.read ? "" : "새 알림, "}${notice.title}, 관련 화면 열기`}
          onPress={() => openNotice(notice)}
          style={[styles.row, { backgroundColor: palette.white, borderColor: notice.read ? palette.line : `${palette.orange}66` }]}
        >
          <View style={[styles.iconWrap, { borderColor: notice.read ? palette.line : `${palette.orange}66` }]}>
            <AppIcon name={noticeIcon[notice.kind]} color={notice.read ? palette.muted : palette.orange} size={17} />
          </View>
          <View style={styles.copy}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: palette.ink }]} numberOfLines={1}>{notice.title}</Text>
              <Text style={[styles.time, { color: palette.muted }]}>{notice.time}</Text>
            </View>
            <Text style={[styles.body, { color: palette.muted }]} numberOfLines={compact ? 1 : 2}>{notice.body}</Text>
          </View>
          <View style={styles.rightSide}>
            {!notice.read && (
              <View style={styles.unreadWrap}>
                <View style={[styles.unreadDot, { backgroundColor: palette.orange }]} />
                <Text style={[styles.unreadText, { color: palette.orange }]}>NEW</Text>
              </View>
            )}
            <Text style={[styles.chevron, { color: palette.muted }]}>›</Text>
          </View>
        </MotionPressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 9 },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 15, padding: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { flex: 1, fontSize: 13, fontWeight: "700" },
  time: { fontSize: 9 },
  body: { fontSize: 11, lineHeight: 16 },
  unreadWrap: { alignItems: "center", gap: 3 },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  unreadText: { fontSize: 6, fontWeight: "900", letterSpacing: 0.3 },
  rightSide: { minWidth: 18, alignItems: "center", justifyContent: "center", gap: 4 },
  chevron: { fontSize: 18, lineHeight: 20 },
  empty: { alignItems: "center", gap: 6, borderWidth: 1, borderStyle: "dashed", borderRadius: 15, paddingHorizontal: 20, paddingVertical: 28 },
  emptyTitle: { fontSize: 13, fontWeight: "700" },
  emptyBody: { fontSize: 10, textAlign: "center", lineHeight: 15 },
});
