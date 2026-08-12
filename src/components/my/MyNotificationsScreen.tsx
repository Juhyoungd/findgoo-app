import { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { appIcons } from "@/src/assets/app-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
import { BackButton } from "@/src/components/common/BackButton";
import { NoticeHistoryList } from "@/src/components/my/NoticeHistoryList";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";

// [안 읽은 알림] 마이페이지의 알림 버튼에서 이동하는 전체 알림 화면
export function MyNotificationsScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { notices, markNoticeRead, markAllNoticesRead, unreadNoticeCount } = useAppData();

  // 헤더의 알림 숫자는 "이 화면을 열어봤는지"를 뜻하도록, 화면을 열 때마다 그 시점까지
  // 온 알림을 한 번에 읽음 처리합니다.
  useFocusEffect(useCallback(() => { markAllNoticesRead(); }, [markAllNoticesRead]));

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/my");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <AppHeader />
      <View style={[styles.pageHeader, { borderBottomColor: palette.line }]}>
        <BackButton onPress={goBack} accessibilityLabel="마이페이지로 돌아가기" />
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: palette.lime }]}>NOTIFICATIONS</Text>
          <Text style={[styles.title, { color: palette.ink }]}>전체 알림</Text>
        </View>
        {unreadNoticeCount > 0 && (
          <View style={[styles.unreadPill, { backgroundColor: palette.white, borderColor: `${palette.orange}66` }]}>
            <Text style={[styles.unreadPillText, { color: palette.orange }]}>새 알림 {unreadNoticeCount}</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.summaryCard, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <View style={[styles.bell, { borderColor: unreadNoticeCount > 0 ? `${palette.orange}66` : palette.line }]}>
            <AppIcon name={appIcons.bell} color={unreadNoticeCount > 0 ? palette.orange : palette.lime} size={19} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.summaryTitle, { color: palette.ink }]}>{unreadNoticeCount > 0 ? `${unreadNoticeCount}개의 새 소식이 있어요` : "모든 알림을 확인했어요"}</Text>
            <Text style={[styles.summaryBody, { color: palette.muted }]}>알림을 누르면 관련 글·제안·채팅 화면으로 이동하고 읽음으로 바뀝니다.</Text>
          </View>
        </View>
        <NoticeHistoryList notices={notices} onRead={markNoticeRead} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pageHeader: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 72, paddingHorizontal: 20, borderBottomWidth: 1 },
  headerCopy: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  title: { fontSize: 19, fontWeight: "800" },
  unreadPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  unreadPillText: { fontSize: 9, fontWeight: "800" },
  content: { padding: 20, paddingBottom: 36, gap: 14 },
  summaryCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  bell: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  summaryTitle: { fontSize: 13, fontWeight: "800" },
  summaryBody: { fontSize: 10, lineHeight: 15, marginTop: 3 },
});
