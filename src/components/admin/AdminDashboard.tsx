import { StyleSheet, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { AdminShell } from "@/src/components/admin/AdminShell";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";

const modules: Array<{ icon: string; title: string; description: string; route: Href; tone: "orange" | "blue" }> = [
  { icon: "!", title: "신고 관리", description: "접수·검토·처리", route: "/admin/reports", tone: "orange" },
  { icon: "▤", title: "게시글 관리", description: "구매글·급구 점검", route: "/admin/posts", tone: "blue" },
  { icon: "◎", title: "회원 관리", description: "회원·신뢰도 확인", route: "/admin/users", tone: "blue" },
  { icon: "⇄", title: "제안·거래", description: "분쟁 거래 확인", route: "/admin/offers", tone: "blue" },
  { icon: "?", title: "고객센터", description: "1:1 문의 답변", route: "/admin/support", tone: "blue" },
  { icon: "●", title: "공지사항", description: "운영 공지 관리", route: "/admin/notices", tone: "blue" },
];

// [관리자 대시보드] 운영 지표와 관리 모듈 진입점
export function AdminDashboard() {
  const { palette } = useTheme();
  const router = useRouter();
  const { posts, offers, reports } = useAppData();
  const pendingReports = reports.filter((report) => report.status !== "resolved").length;
  const activePosts = posts.filter((post) => post.status === "open").length;
  const activeDeals = offers.filter((offer) => offer.status === "accepted").length;
  const members = new Set(posts.map((post) => post.author)).size + 1;

  return (
    <AdminShell title="관리자 대시보드" badge={`미처리 신고 ${pendingReports}`}>
      <View style={[styles.hero, { backgroundColor: palette.ink }]}>
        <View style={{ flex: 1 }}><Text style={styles.heroEyebrow}>TODAY'S OPERATION</Text><Text style={styles.heroTitle}>찾구 운영 현황</Text><Text style={styles.heroBody}>신고와 거래 이상 징후를 먼저 확인하세요.</Text></View>
        <View style={[styles.health, { backgroundColor: `${palette.white}18` }]}><View style={styles.healthDot} /><Text style={styles.healthText}>정상 운영</Text></View>
      </View>

      <View style={styles.stats}>
        <AdminStat label="미처리 신고" value={pendingReports} route="/admin/reports" highlight palette={palette} />
        <AdminStat label="거래 가능 글" value={activePosts} route="/admin/posts" palette={palette} />
        <AdminStat label="진행 중 거래" value={activeDeals} route="/admin/offers" palette={palette} />
        <AdminStat label="활동 회원" value={members} route="/admin/users" palette={palette} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: palette.ink }]}>관리 메뉴</Text><Text style={[styles.sectionHint, { color: palette.muted }]}>권한별 기능은 추후 세분화할 수 있어요.</Text></View>
        <View style={styles.moduleGrid}>
          {modules.map((module) => (
            <MotionPressable key={module.title} accessibilityRole="button" accessibilityLabel={`${module.title} 열기`} onPress={() => router.push(module.route)} style={[styles.module, { backgroundColor: palette.white, borderColor: module.tone === "orange" ? `${palette.orange}55` : palette.line }]}>
              <View style={[styles.moduleIcon, { backgroundColor: module.tone === "orange" ? `${palette.orange}16` : palette.blue }]}><Text style={{ color: module.tone === "orange" ? palette.orange : palette.lime, fontWeight: "900" }}>{module.icon}</Text></View>
              <Text style={[styles.moduleTitle, { color: palette.ink }]}>{module.title}</Text>
              <Text style={[styles.moduleBody, { color: palette.muted }]}>{module.description}</Text>
              <Text style={[styles.arrow, { color: palette.muted }]}>›</Text>
            </MotionPressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: palette.ink }]}>최근 신고</Text><MotionPressable onPress={() => router.push("/admin/reports")}><Text style={[styles.link, { color: palette.orange }]}>전체 보기  ›</Text></MotionPressable></View>
        <View style={styles.reportList}>
          {reports.slice(0, 2).map((report) => (
            <MotionPressable key={report.id} onPress={() => router.push(`/admin/reports/${report.id}`)} style={[styles.report, { backgroundColor: palette.white, borderColor: palette.line }]}><View style={[styles.reportMark, { backgroundColor: `${palette.orange}16` }]}><Text style={{ color: palette.orange, fontWeight: "900" }}>!</Text></View><View style={{ flex: 1 }}><Text style={[styles.reportTitle, { color: palette.ink }]}>{report.reportedUser} · {report.reason}</Text><Text style={[styles.reportMeta, { color: palette.muted }]}>{report.created} · {report.status === "pending" ? "접수" : report.status === "reviewing" ? "검토 중" : "처리 완료"}</Text></View><Text style={{ color: palette.muted }}>›</Text></MotionPressable>
          ))}
        </View>
      </View>
    </AdminShell>
  );
}

function AdminStat({ label, value, route, highlight = false, palette }: { label: string; value: number; route: Href; highlight?: boolean; palette: ReturnType<typeof useTheme>["palette"] }) {
  const router = useRouter();
  return <MotionPressable onPress={() => router.push(route)} style={[styles.stat, { backgroundColor: highlight ? `${palette.orange}10` : palette.white, borderColor: highlight ? `${palette.orange}55` : palette.line }]} accessibilityLabel={`${label} ${value}건 확인`}><Text style={[styles.statValue, { color: highlight ? palette.orange : palette.ink }]}>{value}</Text><Text style={[styles.statLabel, { color: palette.muted }]}>{label}</Text><Text style={[styles.statArrow, { color: palette.muted }]}>›</Text></MotionPressable>;
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, padding: 18 },
  heroEyebrow: { color: "rgba(255,255,255,0.55)", fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  heroTitle: { color: "white", fontSize: 19, fontWeight: "900", marginTop: 5 },
  heroBody: { color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 5 },
  health: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  healthDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#70d69d" },
  healthText: { color: "white", fontSize: 8, fontWeight: "800" },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stat: { width: "48.8%", borderWidth: 1, borderRadius: 15, padding: 14 },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 9, marginTop: 4 },
  statArrow: { position: "absolute", right: 11, bottom: 9, fontSize: 15 },
  section: { gap: 11 },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "900" },
  sectionHint: { flex: 1, fontSize: 8, textAlign: "right" },
  moduleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  module: { position: "relative", width: "48.8%", minHeight: 118, borderWidth: 1, borderRadius: 16, padding: 13 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  moduleIcon: { width: 31, height: 31, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  moduleTitle: { fontSize: 12, fontWeight: "900" },
  moduleBody: { fontSize: 9, marginTop: 3 },
  arrow: { position: "absolute", right: 11, bottom: 9, fontSize: 15 },
  link: { fontSize: 10, fontWeight: "800" },
  reportList: { gap: 8 },
  report: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, padding: 12 },
  reportMark: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  reportTitle: { fontSize: 11, fontWeight: "800" },
  reportMeta: { fontSize: 8, marginTop: 3 },
});
