import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { AdminShell } from "@/src/components/admin/AdminShell";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";

// [신고 내용 보기] 신고 전문, 연결 게시글, 신고자·피신고자와 처리 상태를 한 화면에서 확인합니다.
export function AdminReportDetailScreen() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const { palette } = useTheme();
  const { reports, posts, updateReportStatus } = useAppData();
  const report = reports.find((item) => item.id === reportId);
  const post = posts.find((item) => item.id === report?.postId);
  if (!report) return <AdminShell title="신고 상세"><View style={styles.empty}><Text style={{ color: palette.ink, fontWeight: "900" }}>신고 내역을 찾을 수 없어요.</Text></View></AdminShell>;
  return <AdminShell title="신고 상세" badge={report.status === "pending" ? "접수" : report.status === "reviewing" ? "검토 중" : "처리 완료"}><View style={[styles.hero, { backgroundColor: `${palette.orange}10`, borderColor: `${palette.orange}55` }]}><Text style={[styles.reason, { color: palette.orange }]}>{report.reason}</Text><Text style={[styles.target, { color: palette.ink }]}>{report.reportedUser}</Text><Text style={[styles.time, { color: palette.muted }]}>{report.created}</Text></View><Detail label="신고 내용" value={report.detail} /><Detail label="신고자" value={report.reporter} /><Detail label="연결 게시글" value={post ? `${post.type === "buy" ? "구매글" : "급구"} · ${post.title}` : "삭제된 게시글"} /><Detail label="거래 지역" value={post?.region ?? "확인 불가"} /><View style={styles.actions}>{report.status === "pending" && <MotionPressable onPress={() => updateReportStatus(report.id, "reviewing")} style={[styles.primary, { backgroundColor: palette.ink }]}><Text style={styles.buttonText}>검토 시작</Text></MotionPressable>}{report.status !== "resolved" && <MotionPressable onPress={() => updateReportStatus(report.id, "resolved")} style={[styles.primary, { backgroundColor: palette.lime }]}><Text style={styles.buttonText}>처리 완료</Text></MotionPressable>}</View></AdminShell>;
  function Detail({ label, value }: { label: string; value: string }) { return <View style={[styles.detail, { backgroundColor: palette.white, borderColor: palette.line }]}><Text style={[styles.label, { color: palette.muted }]}>{label}</Text><Text style={[styles.value, { color: palette.ink }]}>{value}</Text></View>; }
}
const styles = StyleSheet.create({ hero: { borderWidth: 1, borderRadius: 18, padding: 17 }, reason: { fontSize: 10, fontWeight: "900" }, target: { fontSize: 19, fontWeight: "900", marginTop: 6 }, time: { fontSize: 9, marginTop: 5 }, detail: { borderWidth: 1, borderRadius: 15, padding: 14 }, label: { fontSize: 9, fontWeight: "800" }, value: { fontSize: 12, lineHeight: 18, fontWeight: "700", marginTop: 5 }, actions: { flexDirection: "row", gap: 8 }, primary: { flex: 1, alignItems: "center", borderRadius: 14, paddingVertical: 13 }, buttonText: { color: "white", fontSize: 11, fontWeight: "900" }, empty: { alignItems: "center", paddingVertical: 50 } });
