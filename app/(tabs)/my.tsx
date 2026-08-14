import { useMemo } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { appIcons, type AppIconName } from "@/src/assets/app-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useAppData } from "@/src/state/AppDataContext";
import { useAuth } from "@/src/state/AuthContext";
import { ProfileAvatar } from "@/src/components/profile/ProfileAvatar";
import { calculateMannerScore } from "@/src/utils/manner";
import { themeOptions } from "@/src/theme/palettes";
import { useTheme } from "@/src/theme/ThemeContext";

type MySummaryRoute = "/my/buy" | "/my/urgent" | "/my/saved" | "/my/notifications";

const activityMenus: Array<{ icon: string; label: string; caption: string; route: Href }> = [
  { icon: "✓", label: "진행 중 거래", caption: "거래 일정과 상태 확인", route: "/my/transactions" },
  { icon: "↓", label: "받은 제안", caption: "수락·거절할 제안", route: "/offers/received" },
  { icon: "↑", label: "보낸 제안", caption: "내 제안 진행 상태", route: "/offers/sent" },
  { icon: "●", label: "채팅", caption: "1:1 거래 대화", route: "/chat" },
];

const settingMenus: Array<{ icon: string; label: string; caption: string; route: Href }> = [
  { icon: "◎", label: "내 정보", caption: "프로필 사진과 회원정보", route: "/profile" },
  { icon: "⌖", label: "활동 지역", caption: "대전·세종 최대 3곳", route: "/profile/region" },
  { icon: "⌕", label: "관심 설정", caption: "카테고리와 알림 키워드", route: "/profile/preferences" },
  { icon: "⊘", label: "차단 회원", caption: "차단한 이용자 관리", route: "/profile/blocked" },
  { icon: "－", label: "회원 탈퇴", caption: "계정과 개인정보 삭제", route: "/profile/delete-account" },
];

const helpMenus: Array<{ icon: string; label: string; caption: string; route: Href }> = [
  { icon: "✎", label: "기술·개선사항", caption: "오류와 기능 아이디어 보내기", route: "/support/feedback" },
  { icon: "●", label: "공지사항", caption: "운영 소식과 업데이트", route: "/notices" },
  { icon: "?", label: "고객센터", caption: "FAQ와 1:1 문의", route: "/support" },
  { icon: "✓", label: "안전 거래 가이드", caption: "신고·결제 전 체크", route: "/support/safety" },
];

// [마이페이지] 내 활동과 설정을 중요도 순으로 묶고, 알림 본문은 상단 알림 페이지에서만 확인합니다.
export default function MyScreen() {
  const { palette, activeTheme, setTheme } = useTheme();
  const { nickname, region, posts, savedPostIds, unreadNoticeCount } = useAppData();
  const { signOut, isAdmin, profile } = useAuth();
  const router = useRouter();

  const myPosts = useMemo(() => posts.filter((post) => post.mine), [posts]);
  const buyPostCount = myPosts.filter((post) => post.type === "buy").length;
  const urgentPostCount = myPosts.filter((post) => post.type === "urgent").length;
  const savedPosts = useMemo(() => posts.filter((post) => savedPostIds.includes(post.id)), [posts, savedPostIds]);

  function confirmSignOut() {
    // react-native-web에서는 Alert.alert의 버튼 콜백(onPress)이 안정적으로 동작하지 않아서
    // 웹에서는 브라우저 기본 confirm으로, 앱(iOS/Android)에서는 네이티브 Alert로 분기합니다.
    if (Platform.OS === "web") {
      if (window.confirm("로그아웃 하시겠어요?")) signOut();
      return;
    }
    Alert.alert("로그아웃", "로그아웃 하시겠어요?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <ProfileAvatar nickname={nickname} avatarUrl={profile?.avatarUrl} size={50} onPress={() => router.push("/profile")} accessibilityLabel="프로필 사진과 내 정보 변경" />
          <View style={{ flex: 1 }}><Text style={[styles.nickname, { color: palette.ink }]}>{nickname}</Text><Text style={{ color: palette.muted, fontSize: 11, marginTop: 3 }}>⌖ {region}</Text><Text style={{ color: palette.limeDark, fontSize: 9, fontWeight: "800", marginTop: 5 }}>매너 온도 {calculateMannerScore(profile?.mannerStats ?? { completedTrades: 0, goodMannerReviews: 0, successfulUrgentMissions: 0, mannerReports: 0 }).toFixed(1)}°</Text></View>
          <MotionPressable onPress={() => router.push("/profile")} style={[styles.editButton, { borderColor: palette.line }]}><Text style={{ color: palette.muted, fontSize: 9, fontWeight: "800" }}>프로필</Text></MotionPressable>
        </View>

        <View style={styles.summaryRow}>
          <SummaryAction icon={appIcons.buy} label="구매글" value={buyPostCount} route="/my/buy" palette={palette} onNavigate={router.push} />
          <SummaryAction icon={appIcons.urgent} label="급구" value={urgentPostCount} route="/my/urgent" palette={palette} onNavigate={router.push} />
          <SummaryAction icon={appIcons.saved} label="찜한 글" value={savedPosts.length} route="/my/saved" palette={palette} onNavigate={router.push} />
          <SummaryAction icon={appIcons.bell} label="안 읽은 알림" value={unreadNoticeCount} route="/my/notifications" palette={palette} onNavigate={router.push} hasUpdate={unreadNoticeCount > 0} />
        </View>

        <View style={styles.section}>
          <View><Text style={[styles.sectionTitle, { color: palette.ink }]}>색상 테마</Text><Text style={[styles.sectionCaption, { color: palette.muted }]}>테마 이름을 눌러 바로 바꿀 수 있어요.</Text></View>
          <View style={styles.themeGrid}>
            {themeOptions.map((theme) => {
              const selected = theme.id === activeTheme.id;
              return (
                <MotionPressable key={theme.id} onPress={() => setTheme(theme.id)} style={[styles.themeChoice, { backgroundColor: selected ? theme.colors[1] : palette.white, borderColor: selected ? theme.colors[0] : palette.line }]} accessibilityLabel={`${theme.label} 테마 적용`}>
                  <Text style={{ color: selected ? palette.ink : palette.muted, fontSize: 10, fontWeight: selected ? "900" : "700" }}>{theme.label}</Text>
                </MotionPressable>
              );
            })}
          </View>
        </View>

        <MenuSection title="거래 관리" items={activityMenus} />
        <MenuSection title="계정 및 설정" items={settingMenus} />
        <MenuSection title="이용 안내" items={helpMenus} />

        {isAdmin && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>관리자</Text>
            <MotionPressable onPress={() => router.push("/admin")} style={[styles.adminCard, { backgroundColor: palette.ink }]} accessibilityLabel="관리자 센터 열기">
              <View style={[styles.menuIcon, { backgroundColor: `${palette.white}18` }]}><Text style={{ color: "white", fontWeight: "900" }}>A</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.adminTitle}>관리자 센터</Text><Text style={styles.adminCaption}>신고·회원·거래·게시글 운영</Text></View><Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 18 }}>›</Text>
            </MotionPressable>
          </View>
        )}

        <MotionPressable onPress={confirmSignOut} style={[styles.logoutButton, { borderColor: palette.line }]}><Text style={{ color: palette.muted, fontSize: 11, fontWeight: "800" }}>로그아웃</Text></MotionPressable>
      </ScrollView>
    </SafeAreaView>
  );

  function MenuSection({ title, items }: { title: string; items: typeof activityMenus }) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>{title}</Text>
        <View style={[styles.menuCard, { backgroundColor: palette.white, borderColor: palette.line }]}>
          {items.map((item, index) => (
            <MotionPressable key={item.label} onPress={() => router.push(item.route)} style={[styles.menuRow, index < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.line }]} accessibilityLabel={`${item.label} 열기`}>
              <View style={[styles.menuIcon, { backgroundColor: palette.paper }]}><Text style={{ color: palette.lime, fontWeight: "900" }}>{item.icon}</Text></View>
              <View style={{ flex: 1 }}><Text style={[styles.menuLabel, { color: palette.ink }]}>{item.label}</Text><Text style={[styles.menuCaption, { color: palette.muted }]}>{item.caption}</Text></View><Text style={{ color: palette.muted, fontSize: 18 }}>›</Text>
            </MotionPressable>
          ))}
        </View>
      </View>
    );
  }
}

function SummaryAction({ icon, label, value, route, palette, onNavigate, hasUpdate = false }: { icon: AppIconName; label: string; value: number; route: MySummaryRoute; palette: ReturnType<typeof useTheme>["palette"]; onNavigate: (href: Href) => void; hasUpdate?: boolean }) {
  return (
    <MotionPressable accessibilityRole="button" accessibilityLabel={`${label} ${value}개${hasUpdate ? ", 새 알림 있음" : ""}`} onPress={() => onNavigate(route)} style={[styles.summaryStat, { backgroundColor: palette.white, borderColor: hasUpdate ? palette.orange : palette.line }]}>
      {hasUpdate && <View style={[styles.newBadge, { backgroundColor: palette.orange }]}><View style={styles.newBadgeDot} /><Text style={styles.newBadgeText}>NEW</Text></View>}
      <View style={[styles.summaryIcon, { borderColor: hasUpdate ? `${palette.orange}66` : palette.line }]}><AppIcon name={icon} color={hasUpdate ? palette.orange : palette.muted} size={16} /></View>
      <Text style={[styles.summaryValue, { color: palette.ink }]}>{value}</Text>
      <Text style={{ color: palette.muted, fontSize: 8, fontWeight: "700", textAlign: "center" }}>{label}</Text>
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 120, gap: 18 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 18, padding: 15 },
  nickname: { fontSize: 16, fontWeight: "900" },
  editButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  summaryRow: { flexDirection: "row", gap: 7 },
  summaryStat: { position: "relative", flex: 1, minHeight: 88, alignItems: "center", justifyContent: "center", gap: 3, borderWidth: 1, borderRadius: 16, paddingHorizontal: 3, paddingVertical: 10 },
  summaryIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 1 },
  summaryValue: { fontSize: 16, fontWeight: "900" },
  newBadge: { position: "absolute", top: -7, right: -4, flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 3 },
  newBadgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "white" },
  newBadgeText: { color: "white", fontSize: 7, fontWeight: "900", letterSpacing: 0.4 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "900" },
  sectionCaption: { fontSize: 9, marginTop: 3 },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  themeChoice: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  menuCard: { overflow: "hidden", borderWidth: 1, borderRadius: 18 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 11, minHeight: 66, paddingHorizontal: 13, paddingVertical: 11 },
  menuIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 12, fontWeight: "900" },
  menuCaption: { fontSize: 9, marginTop: 3 },
  adminCard: { flexDirection: "row", alignItems: "center", gap: 11, borderRadius: 18, padding: 14 },
  adminTitle: { color: "white", fontSize: 13, fontWeight: "900" },
  adminCaption: { color: "rgba(255,255,255,0.58)", fontSize: 9, marginTop: 3 },
  logoutButton: { alignItems: "center", borderWidth: 1, borderRadius: 14, paddingVertical: 13 },
});
