import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext";
import type { AppNotice } from "@/src/types/findgoo";

const noticeIcon: Record<AppNotice["kind"], string> = {
  offer: "⇄",
  trade: "✓",
  chat: "●",
  favorite: "♥",
  keyword: "⌕",
  urgent: "ϟ",
  system: "♧",
};

type NoticeHistoryListProps = {
  notices: AppNotice[];
  onRead: (noticeId: string) => void;
  compact?: boolean;
};

// [전체 알림] 읽음·안 읽음 상태를 함께 보여주는 개인 알림 목록
export function NoticeHistoryList({ notices, onRead, compact = false }: NoticeHistoryListProps) {
  const { palette } = useTheme();

  function openNotice(notice: AppNotice) {
    onRead(notice.id);
    Alert.alert(notice.title, notice.body);
  }

  if (notices.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: palette.white, borderColor: palette.line }]}>
        <Text style={[styles.emptyIcon, { color: palette.lime }]}>✓</Text>
        <Text style={[styles.emptyTitle, { color: palette.ink }]}>새로운 알림이 없어요</Text>
        <Text style={[styles.emptyBody, { color: palette.muted }]}>거래나 관심 글에 변화가 생기면 여기에 알려드릴게요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {notices.map((notice) => (
        <Pressable
          key={notice.id}
          accessibilityRole="button"
          accessibilityLabel={`${notice.read ? "" : "새 알림, "}${notice.title}`}
          onPress={() => openNotice(notice)}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: notice.read ? palette.white : `${palette.orange}0d`, borderColor: notice.read ? palette.line : `${palette.orange}66` },
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: notice.read ? palette.paper : `${palette.orange}18` }]}>
            <Text style={{ color: notice.read ? palette.lime : palette.orange, fontSize: 14, fontWeight: "800" }}>{noticeIcon[notice.kind]}</Text>
          </View>
          <View style={styles.copy}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: palette.ink }]} numberOfLines={1}>{notice.title}</Text>
              <Text style={[styles.time, { color: palette.muted }]}>{notice.time}</Text>
            </View>
            <Text style={[styles.body, { color: palette.muted }]} numberOfLines={compact ? 1 : 2}>{notice.body}</Text>
          </View>
          {!notice.read && (
            <View style={styles.unreadWrap}>
              <View style={[styles.unreadDot, { backgroundColor: palette.orange }]} />
              <Text style={[styles.unreadText, { color: palette.orange }]}>NEW</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 9 },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 15, padding: 12 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  iconWrap: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { flex: 1, fontSize: 13, fontWeight: "700" },
  time: { fontSize: 9 },
  body: { fontSize: 11, lineHeight: 16 },
  unreadWrap: { alignItems: "center", gap: 3 },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  unreadText: { fontSize: 6, fontWeight: "900", letterSpacing: 0.3 },
  empty: { alignItems: "center", gap: 6, borderWidth: 1, borderStyle: "dashed", borderRadius: 15, paddingHorizontal: 20, paddingVertical: 28 },
  emptyIcon: { fontSize: 20, fontWeight: "800" },
  emptyTitle: { fontSize: 13, fontWeight: "700" },
  emptyBody: { fontSize: 10, textAlign: "center", lineHeight: 15 },
});
