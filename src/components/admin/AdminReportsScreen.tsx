import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AdminShell } from "@/src/components/admin/AdminShell";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import type { ReportStatus } from "@/src/types/findgoo";

type ReportFilter = "all" | ReportStatus;
const filterCopy: Array<{ value: ReportFilter; label: string }> = [{ value: "all", label: "전체" }, { value: "pending", label: "접수" }, { value: "reviewing", label: "검토 중" }, { value: "resolved", label: "완료" }];
const statusCopy: Record<ReportStatus, string> = { pending: "접수", reviewing: "검토 중", resolved: "처리 완료" };

// [신고 관리] 채팅에서 접수된 신고를 검토하고 처리 상태를 변경하는 관리자 화면
export function AdminReportsScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { reports, posts, updateReportStatus } = useAppData();
  const [filter, setFilter] = useState<ReportFilter>("all");
  const filtered = reports.filter((report) => filter === "all" || report.status === filter);
  const pendingCount = reports.filter((report) => report.status !== "resolved").length;

  return (
    <AdminShell title="신고 관리" badge={`미처리 ${pendingCount}`}>
      <View style={styles.filters}>
        {filterCopy.map((item) => <MotionPressable key={item.value} onPress={() => setFilter(item.value)} style={[styles.filter, { backgroundColor: filter === item.value ? palette.ink : palette.white, borderColor: filter === item.value ? palette.ink : palette.line }]}><Text style={{ color: filter === item.value ? palette.white : palette.muted, fontSize: 10, fontWeight: "700" }}>{item.label}</Text></MotionPressable>)}
      </View>

      <View style={styles.list}>
        {filtered.map((report) => {
          const post = posts.find((candidate) => candidate.id === report.postId);
          const nextStatus: ReportStatus | null = report.status === "pending" ? "reviewing" : report.status === "reviewing" ? "resolved" : null;
          return (
            <View key={report.id} style={[styles.card, { backgroundColor: palette.white, borderColor: report.status === "pending" ? `${palette.orange}66` : palette.line }]}>
              <View style={styles.top}><View style={[styles.status, { backgroundColor: report.status === "resolved" ? palette.blue : `${palette.orange}16` }]}><Text style={{ color: report.status === "resolved" ? palette.lime : palette.orange, fontSize: 9, fontWeight: "900" }}>{statusCopy[report.status]}</Text></View><Text style={[styles.time, { color: palette.muted }]}>{report.created}</Text></View>
              <Text style={[styles.target, { color: palette.ink }]}>{report.reportedUser}</Text>
              <Text style={[styles.reason, { color: palette.orange }]}>{report.reason}</Text>
              <Text style={[styles.detail, { color: palette.ink }]}>{report.detail}</Text>
              <View style={[styles.meta, { borderTopColor: palette.line }]}><Text style={[styles.metaText, { color: palette.muted }]} numberOfLines={1}>신고자 {report.reporter} · {post?.title ?? "삭제된 게시글"}</Text></View>
              <View style={styles.actions}><MotionPressable onPress={() => router.push(`/admin/reports/${report.id}`)} style={[styles.detailButton, { backgroundColor: palette.white, borderColor: palette.line }]}><Text style={{ color: palette.ink, fontSize: 11, fontWeight: "800" }}>신고 내용 보기</Text></MotionPressable>{nextStatus && <MotionPressable accessibilityRole="button" accessibilityLabel={`${report.reportedUser} 신고 ${nextStatus === "reviewing" ? "검토 시작" : "처리 완료"}`} onPress={() => updateReportStatus(report.id, nextStatus)} style={[styles.action, { backgroundColor: nextStatus === "reviewing" ? palette.ink : palette.lime }]}><Text style={{ color: palette.white, fontSize: 11, fontWeight: "800" }}>{nextStatus === "reviewing" ? "검토 시작" : "처리 완료"}</Text></MotionPressable>}</View>
            </View>
          );
        })}
        {filtered.length === 0 && <View style={styles.empty}><Text style={[styles.emptyTitle, { color: palette.ink }]}>해당 상태의 신고가 없어요</Text><Text style={{ color: palette.muted, fontSize: 10 }}>새 신고가 접수되면 자동으로 표시됩니다.</Text></View>}
      </View>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", gap: 7 },
  filter: { flex: 1, alignItems: "center", borderWidth: 1, borderRadius: 999, paddingVertical: 8 },
  list: { gap: 10 },
  card: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 7 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  status: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  time: { fontSize: 9 },
  target: { fontSize: 15, fontWeight: "900", marginTop: 2 },
  reason: { fontSize: 10, fontWeight: "800" },
  detail: { fontSize: 12, lineHeight: 18 },
  meta: { borderTopWidth: 1, paddingTop: 9, marginTop: 2 },
  metaText: { fontSize: 9 },
  actions: { flexDirection: "row", gap: 8, marginTop: 3 },
  detailButton: { flex: 1, alignItems: "center", borderWidth: 1, borderRadius: 12, paddingVertical: 11 },
  action: { flex: 1, alignItems: "center", borderRadius: 12, paddingVertical: 11 },
  empty: { alignItems: "center", gap: 6, paddingVertical: 50 },
  emptyTitle: { fontSize: 13, fontWeight: "800" },
});
