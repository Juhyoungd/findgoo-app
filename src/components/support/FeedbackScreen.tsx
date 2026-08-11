import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { DetailScaffold } from "@/src/components/common/DetailScaffold";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { saveFeedback, type FeedbackCategory } from "@/src/services/feedbackService";
import { useToast } from "@/src/state/ToastContext";
import { useTheme } from "@/src/theme/ThemeContext";

const categories: FeedbackCategory[] = ["기술 오류", "기능 제안", "UI·사용성", "기타"];

// [기술·개선사항 보내기] 회원이 오류와 개선 아이디어를 작성해 기기에 제출 내역을 보관합니다.
export function FeedbackScreen() {
  const { palette } = useTheme();
  const { showToast } = useToast();
  const [category, setCategory] = useState<FeedbackCategory>("기술 오류");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  async function submit() {
    if (title.trim().length < 3) return showToast("제목을 3자 이상 입력해주세요.");
    if (body.trim().length < 10) return showToast("내용을 10자 이상 구체적으로 입력해주세요.");
    try {
      setSubmitting(true);
      const saved = await saveFeedback({ category, title: title.trim(), body: body.trim() });
      setSubmittedId(saved.id);
      setTitle("");
      setBody("");
      showToast("개선사항이 저장됐어요. 감사합니다!");
    } catch {
      showToast("저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DetailScaffold title="기술·개선사항" eyebrow="FEEDBACK">
      <View style={[styles.guide, { backgroundColor: palette.blue }]}><Text style={[styles.guideTitle, { color: palette.ink }]}>찾구를 함께 개선해주세요</Text><Text style={[styles.guideBody, { color: palette.muted }]}>불편했던 흐름, 오류 재현 방법, 필요한 기능을 자유롭게 적어주세요.</Text></View>
      {submittedId && <View style={[styles.saved, { backgroundColor: `${palette.lime}10`, borderColor: `${palette.lime}55` }]}><Text style={{ color: palette.lime, fontSize: 10, fontWeight: "900" }}>✓ 최근 작성 내용이 기기에 저장됐어요</Text></View>}
      <View style={styles.section}><Text style={[styles.label, { color: palette.ink }]}>분류</Text><View style={styles.categories}>{categories.map((item) => <MotionPressable key={item} onPress={() => setCategory(item)} style={[styles.category, { backgroundColor: category === item ? palette.lime : palette.white, borderColor: category === item ? palette.lime : palette.line }]}><Text style={{ color: category === item ? "white" : palette.muted, fontSize: 10, fontWeight: "800" }}>{item}</Text></MotionPressable>)}</View></View>
      <View style={styles.section}><Text style={[styles.label, { color: palette.ink }]}>제목</Text><TextInput value={title} onChangeText={setTitle} maxLength={60} placeholder="예: 채팅 알림이 두 번 표시돼요" placeholderTextColor={palette.muted} style={[styles.input, { backgroundColor: palette.white, borderColor: palette.line, color: palette.ink }]} /></View>
      <View style={styles.section}><Text style={[styles.label, { color: palette.ink }]}>상세 내용</Text><TextInput value={body} onChangeText={setBody} maxLength={1000} multiline textAlignVertical="top" placeholder="발생한 화면과 순서 또는 개선 아이디어를 적어주세요." placeholderTextColor={palette.muted} style={[styles.textarea, { backgroundColor: palette.white, borderColor: palette.line, color: palette.ink }]} /><Text style={[styles.counter, { color: palette.muted }]}>{body.length}/1000</Text></View>
      <MotionPressable onPress={submit} disabled={submitting} haptic="medium" style={[styles.submit, { backgroundColor: palette.lime, opacity: submitting ? 0.7 : 1 }]}>{submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>개선사항 보내기</Text>}</MotionPressable>
    </DetailScaffold>
  );
}

const styles = StyleSheet.create({
  guide: { borderRadius: 18, padding: 16 }, guideTitle: { fontSize: 14, fontWeight: "900" }, guideBody: { fontSize: 10, lineHeight: 16, marginTop: 5 },
  saved: { borderWidth: 1, borderRadius: 13, padding: 11 }, section: { gap: 8 }, label: { fontSize: 12, fontWeight: "900" }, categories: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  category: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 }, input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, fontSize: 12 },
  textarea: { minHeight: 170, borderWidth: 1, borderRadius: 13, padding: 13, fontSize: 12, lineHeight: 18 }, counter: { alignSelf: "flex-end", fontSize: 9, marginTop: -3 },
  submit: { alignItems: "center", borderRadius: 14, paddingVertical: 14 }, submitText: { color: "white", fontSize: 12, fontWeight: "900" },
});
