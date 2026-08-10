import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { NoticeHistoryList } from "@/src/components/my/NoticeHistoryList";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";

// [안 읽은 알림] 마이페이지의 알림 버튼에서 이동하는 전체 알림 화면
export function MyNotificationsScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { notices, markNoticeRead, unreadNoticeCount } = useAppData();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/my");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <AppHeader />
      <View style={[styles.pageHeader, { borderBottomColor: palette.line }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="마이페이지로 돌아가기" onPress={goBack} style={({ pressed }) => [styles.backButton, { backgroundColor: palette.white, borderColor: palette.line }, pressed && styles.pressed]}>
          <Text style={[styles.backIcon, { color: palette.ink }]}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: palette.lime }]}>NOTIFICATIONS</Text>
          <Text style={[styles.title, { color: palette.ink }]}>전체 알림</Text>
        </View>
        {unreadNoticeCount > 0 && (
          <View style={[styles.unreadPill, { backgroundColor: palette.orange }]}>
            <Text style={styles.unreadPillText}>새 알림 {unreadNoticeCount}</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.summaryCard, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <View style={[styles.bell, { backgroundColor: unreadNoticeCount > 0 ? `${palette.orange}18` : palette.blue }]}>
            <Text style={{ color: unreadNoticeCount > 0 ? palette.orange : palette.lime, fontSize: 18 }}>♧</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.summaryTitle, { color: palette.ink }]}>{unreadNoticeCount > 0 ? `${unreadNoticeCount}개의 새 소식이 있어요` : "모든 알림을 확인했어요"}</Text>
            <Text style={[styles.summaryBody, { color: palette.muted }]}>알림을 누르면 내용을 확인하고 읽음으로 바뀝니다.</Text>
          </View>
        </View>
        <NoticeHistoryList notices={notices} onRead={markNoticeRead} />
      </ScrollView>
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
  unreadPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  unreadPillText: { color: "white", fontSize: 9, fontWeight: "800" },
  content: { padding: 20, paddingBottom: 36, gap: 14 },
  summaryCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  bell: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  summaryTitle: { fontSize: 13, fontWeight: "800" },
  summaryBody: { fontSize: 10, lineHeight: 15, marginTop: 3 },
});
