import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminShell } from "@/src/components/admin/AdminShell";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { answerSupportInquiry, listAllSupportInquiries, type SupportInquiry } from "@/src/services/supportService";
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

  const [supportInquiries, setSupportInquiries] = useState<SupportInquiry[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(kind === "support");
  const [answering, setAnswering] = useState<SupportInquiry | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  useEffect(() => {
    if (kind !== "support") return;
    let cancelled = false;
    listAllSupportInquiries()
      .then(({ inquiries }) => {
        if (!cancelled) setSupportInquiries(inquiries);
      })
      .finally(() => {
        if (!cancelled) setLoadingSupport(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  function openAnswer(inquiry: SupportInquiry) {
    setAnswering(inquiry);
    setAnswerText(inquiry.answer ?? "");
  }

  async function submitAnswer() {
    if (!answering || answerText.trim().length < 2 || submittingAnswer) return;
    try {
      setSubmittingAnswer(true);
      const { error } = await answerSupportInquiry(answering.id, answerText.trim());
      if (error) return;
      setSupportInquiries((items) => items.map((item) => (item.id === answering.id ? { ...item, status: "answered", answer: answerText.trim() } : item)));
      setAnswering(null);
    } finally {
      setSubmittingAnswer(false);
    }
  }

  return (
    <AdminShell title={copy.title}>
      <View style={[styles.guide, { backgroundColor: palette.white, borderColor: palette.line }]}><Text style={[styles.guideTitle, { color: palette.ink }]}>{copy.title}</Text><Text style={[styles.guideBody, { color: palette.muted }]}>{copy.description}</Text></View>

      <View style={styles.list}>
        {kind === "posts" && posts.map((post) => <AdminRow key={post.id} title={post.title} subtitle={`${post.type === "buy" ? "구매글" : "급구"} · ${post.author} · ${post.region}`} value={post.status === "open" ? "거래 가능" : post.status === "reserved" ? "진행 중" : "마감"} palette={palette} />)}
        {kind === "users" && authors.map((author) => <AdminRow key={author} title={author} subtitle={`작성 글 ${posts.filter((post) => post.author === author).length}개`} value={`신뢰 ${posts.find((post) => post.author === author)?.manner ?? 36.5}`} palette={palette} />)}
        {kind === "offers" && offers.map((offer) => <AdminRow key={offer.id} title={offer.nickname} subtitle={`${offer.direction === "incoming" ? "받은 제안" : "보낸 제안"} · ${offer.created}`} value={`${won(offer.price)} · ${offer.status === "pending" ? "대기" : offer.status === "accepted" ? "수락" : offer.status === "rejected" ? "거절" : "취소"}`} palette={palette} />)}
        {kind === "support" && loadingSupport && <ActivityIndicator color={palette.lime} />}
        {kind === "support" && !loadingSupport && supportInquiries.length === 0 && <Text style={{ color: palette.muted, fontSize: 11 }}>접수된 문의가 없어요.</Text>}
        {kind === "support" && !loadingSupport && supportInquiries.map((item) => (
          <AdminRow key={item.id} title={item.title} subtitle={`${item.category} · ${item.status === "answered" ? "답변 완료" : "답변 대기"}`} value={item.status === "answered" ? "완료" : "답변하기"} palette={palette} onPress={() => openAnswer(item)} />
        ))}
        {kind === "notices" && announcements.map((notice) => <AdminRow key={notice.title} title={notice.title} subtitle={`게시 예정 ${notice.date}`} value={notice.status} palette={palette} />)}
      </View>

      <Modal visible={!!answering} transparent animationType="slide" onRequestClose={() => setAnswering(null)}>
        <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}>
          <MotionPressable accessibilityRole="button" accessibilityLabel="답변 작성 닫기" style={styles.backdrop} onPress={() => setAnswering(null)} />
          <SafeAreaView edges={["bottom"]} style={[styles.sheet, { backgroundColor: palette.paper }]}>
            <View style={[styles.handle, { backgroundColor: palette.line }]} />
            <Text style={[styles.sheetTitle, { color: palette.ink }]}>{answering?.title}</Text>
            <Text style={[styles.sheetCategory, { color: palette.lime }]}>{answering?.category}</Text>
            <Text style={[styles.sheetBody, { color: palette.ink }]}>{answering?.body}</Text>

            <TextInput
              value={answerText}
              onChangeText={setAnswerText}
              multiline
              maxLength={800}
              textAlignVertical="top"
              placeholder="답변 내용을 입력하세요."
              placeholderTextColor={palette.muted}
              style={[styles.textarea, { backgroundColor: palette.white, borderColor: palette.line, color: palette.ink }]}
            />

            <MotionPressable accessibilityRole="button" accessibilityLabel="답변 등록" onPress={submitAnswer} disabled={submittingAnswer} style={[styles.submit, { backgroundColor: palette.lime, opacity: submittingAnswer ? 0.7 : 1 }]}>
              {submittingAnswer ? <ActivityIndicator color={palette.white} /> : <Text style={{ color: palette.white, fontWeight: "800", fontSize: 14 }}>답변 등록</Text>}
            </MotionPressable>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </AdminShell>
  );
}

function AdminRow({ title, subtitle, value, palette, onPress }: { title: string; subtitle: string; value: string; palette: ReturnType<typeof useTheme>["palette"]; onPress?: () => void }) {
  const content = <><View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: palette.ink }]} numberOfLines={1}>{title}</Text><Text style={[styles.rowSub, { color: palette.muted }]} numberOfLines={1}>{subtitle}</Text></View><Text style={[styles.rowValue, { color: palette.lime }]}>{value}</Text></>;
  if (onPress) return <MotionPressable accessibilityRole="button" accessibilityLabel={`${title} 상세`} onPress={onPress} style={[styles.row, { backgroundColor: palette.white, borderColor: palette.line }]}>{content}</MotionPressable>;
  return <View style={[styles.row, { backgroundColor: palette.white, borderColor: palette.line }]}>{content}</View>;
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
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(31,25,35,0.42)" },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 24, gap: 10 },
  handle: { alignSelf: "center", width: 38, height: 4, borderRadius: 2, marginBottom: 4 },
  sheetTitle: { fontSize: 16, fontWeight: "900" },
  sheetCategory: { fontSize: 10, fontWeight: "800" },
  sheetBody: { fontSize: 12, lineHeight: 18, marginBottom: 4 },
  textarea: { minHeight: 120, borderWidth: 1, borderRadius: 13, padding: 13, fontSize: 12, lineHeight: 18 },
  submit: { alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 15, marginTop: 4 },
});
