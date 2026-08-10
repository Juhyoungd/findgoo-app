import { StyleSheet, Text, View } from "react-native";
import { AdminShell } from "@/src/components/admin/AdminShell";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { won } from "@/src/utils/format";

export type AdminModuleKind = "posts" | "users" | "offers" | "support" | "notices";

const moduleCopy: Record<AdminModuleKind, { title: string; description: string }> = {
  posts: { title: "게시글 관리", description: "구매글과 급구의 상태·작성자·신고 가능성을 확인합니다." },
  users: { title: "회원 관리", description: "활동 회원과 게시글 수를 기준으로 이용 현황을 확인합니다." },
  offers: { title: "제안·거래 관리", description: "제안 상태와 거래 성사 여부를 확인합니다." },
  support: { title: "고객센터", description: "접수된 1:1 문의의 우선순위와 처리 상태를 확인합니다." },
  notices: { title: "공지사항 관리", description: "서비스 점검과 안전 거래 공지를 관리합니다." },
};

const supportTickets = [
  { title: "거래 취소 후 알림이 남아있어요", user: "해피바이어", status: "답변 대기" },
  { title: "신고 처리 결과를 확인하고 싶어요", user: "둔산러너", status: "검토 중" },
  { title: "지역 설정이 저장되지 않아요", user: "모카하우스", status: "답변 완료" },
];

const announcements = [
  { title: "안전 거래 가이드 안내", status: "게시 중", date: "오늘" },
  { title: "서비스 점검 예정 안내", status: "예약", date: "금요일" },
  { title: "신고 정책 개정 안내", status: "초안", date: "다음 주" },
];

// [게시글 관리] [회원 관리] [제안·거래] [고객센터] [공지사항] 관리자 목록 공통 화면
export function AdminModuleScreen({ kind }: { kind: AdminModuleKind }) {
  const { palette } = useTheme();
  const { posts, offers } = useAppData();
  const copy = moduleCopy[kind];
  const authors = Array.from(new Set(posts.map((post) => post.author)));

  return (
    <AdminShell title={copy.title}>
      <View style={[styles.guide, { backgroundColor: palette.white, borderColor: palette.line }]}><Text style={[styles.guideTitle, { color: palette.ink }]}>{copy.title}</Text><Text style={[styles.guideBody, { color: palette.muted }]}>{copy.description}</Text></View>

      <View style={styles.list}>
        {kind === "posts" && posts.map((post) => <AdminRow key={post.id} title={post.title} subtitle={`${post.type === "buy" ? "구매글" : "급구"} · ${post.author} · ${post.region}`} value={post.status === "open" ? "거래 가능" : post.status === "reserved" ? "진행 중" : "마감"} palette={palette} />)}
        {kind === "users" && authors.map((author) => <AdminRow key={author} title={author} subtitle={`작성 글 ${posts.filter((post) => post.author === author).length}개`} value={`신뢰 ${posts.find((post) => post.author === author)?.manner ?? 36.5}`} palette={palette} />)}
        {kind === "offers" && offers.map((offer) => <AdminRow key={offer.id} title={offer.nickname} subtitle={`${offer.direction === "incoming" ? "받은 제안" : "보낸 제안"} · ${offer.created}`} value={`${won(offer.price)} · ${offer.status === "pending" ? "대기" : offer.status === "accepted" ? "수락" : offer.status === "rejected" ? "거절" : "취소"}`} palette={palette} />)}
        {kind === "support" && supportTickets.map((ticket) => <AdminRow key={ticket.title} title={ticket.title} subtitle={`문의자 ${ticket.user}`} value={ticket.status} palette={palette} />)}
        {kind === "notices" && announcements.map((notice) => <AdminRow key={notice.title} title={notice.title} subtitle={`게시 예정 ${notice.date}`} value={notice.status} palette={palette} />)}
      </View>
    </AdminShell>
  );
}

function AdminRow({ title, subtitle, value, palette }: { title: string; subtitle: string; value: string; palette: ReturnType<typeof useTheme>["palette"] }) {
  return <View style={[styles.row, { backgroundColor: palette.white, borderColor: palette.line }]}><View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: palette.ink }]} numberOfLines={1}>{title}</Text><Text style={[styles.rowSub, { color: palette.muted }]} numberOfLines={1}>{subtitle}</Text></View><Text style={[styles.rowValue, { color: palette.lime }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  guide: { borderWidth: 1, borderRadius: 16, padding: 15 },
  guideTitle: { fontSize: 14, fontWeight: "900" },
  guideBody: { fontSize: 10, lineHeight: 16, marginTop: 4 },
  list: { gap: 9 },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 15, padding: 13 },
  rowTitle: { fontSize: 12, fontWeight: "800" },
  rowSub: { fontSize: 9, marginTop: 4 },
  rowValue: { maxWidth: "38%", fontSize: 9, fontWeight: "800", textAlign: "right" },
});
