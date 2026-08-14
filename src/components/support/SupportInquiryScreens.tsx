import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { DetailScaffold } from "@/src/components/common/DetailScaffold";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { createSupportInquiry, listSupportInquiries, type SupportInquiry } from "@/src/services/supportService";
import { useAuth } from "@/src/state/AuthContext";
import { useToast } from "@/src/state/ToastContext";
import { useTheme } from "@/src/theme/ThemeContext";

const categories = ["거래", "계정", "신고", "오류", "기타"];

export function SupportInquiryFormScreen() {
  const { palette } = useTheme();
  const { session } = useAuth();
  const { showToast } = useToast();
  const [category, setCategory] = useState("거래");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (title.trim().length < 3) return showToast("문의 제목을 3자 이상 입력해주세요.");
    if (body.trim().length < 10) return showToast("문의 내용을 10자 이상 입력해주세요.");
    setSubmitting(true);
    const { error } = await createSupportInquiry(session?.user.id, { category, title: title.trim(), body: body.trim() });
    setSubmitting(false);
    if (error) return showToast(error);
    setTitle(""); setBody("");
    showToast("문의가 접수됐어요. 문의 내역에서 확인할 수 있어요.");
  }

  return <DetailScaffold title="1:1 문의" eyebrow="SUPPORT"><View style={styles.chips}>{categories.map((item) => <MotionPressable key={item} onPress={() => setCategory(item)} style={[styles.chip, { backgroundColor: category === item ? palette.lime : palette.white, borderColor: category === item ? palette.lime : palette.line }]}><Text style={{ color: category === item ? "white" : palette.muted, fontSize: 10, fontWeight: "800" }}>{item}</Text></MotionPressable>)}</View><TextInput value={title} onChangeText={setTitle} placeholder="문의 제목" placeholderTextColor={palette.muted} style={[styles.input, { backgroundColor: palette.white, borderColor: palette.line, color: palette.ink }]} /><TextInput value={body} onChangeText={setBody} placeholder="문의 내용을 구체적으로 적어주세요." placeholderTextColor={palette.muted} multiline maxLength={1000} textAlignVertical="top" style={[styles.textarea, { backgroundColor: palette.white, borderColor: palette.line, color: palette.ink }]} /><MotionPressable onPress={submit} disabled={submitting} style={[styles.submit, { backgroundColor: palette.lime, opacity: submitting ? 0.6 : 1 }]}>{submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>문의 접수</Text>}</MotionPressable></DetailScaffold>;
}

export function SupportInquiryHistoryScreen() {
  const { palette } = useTheme();
  const { session } = useAuth();
  const [items, setItems] = useState<SupportInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { listSupportInquiries(session?.user.id).then(({ inquiries }) => setItems(inquiries)).finally(() => setLoading(false)); }, [session?.user.id]);
  return <DetailScaffold title="문의 내역" eyebrow="MY INQUIRIES">{loading && <ActivityIndicator color={palette.lime} />}{!loading && items.length === 0 && <View style={[styles.empty, { borderColor: palette.line }]}><Text style={{ color: palette.muted, fontSize: 10 }}>접수한 문의가 없어요.</Text></View>}{items.map((item) => <View key={item.id} style={[styles.card, { backgroundColor: palette.white, borderColor: palette.line }]}><View style={styles.cardTop}><Text style={[styles.category, { color: palette.lime }]}>{item.category}</Text><Text style={{ color: item.status === "answered" ? palette.lime : palette.orange, fontSize: 9, fontWeight: "900" }}>{item.status === "answered" ? "답변 완료" : "답변 대기"}</Text></View><Text style={[styles.title, { color: palette.ink }]}>{item.title}</Text><Text style={[styles.body, { color: palette.muted }]}>{item.body}</Text>{item.answer && <View style={[styles.answer, { backgroundColor: palette.paper }]}><Text style={[styles.body, { color: palette.ink }]}>답변 · {item.answer}</Text></View>}</View>)}</DetailScaffold>;
}

const styles = StyleSheet.create({ chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }, input: { borderWidth: 1, borderRadius: 14, minHeight: 48, paddingHorizontal: 14, fontSize: 12 }, textarea: { borderWidth: 1, borderRadius: 14, minHeight: 180, padding: 14, fontSize: 12, lineHeight: 18 }, submit: { minHeight: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" }, submitText: { color: "white", fontSize: 12, fontWeight: "900" }, empty: { alignItems: "center", borderWidth: 1, borderStyle: "dashed", borderRadius: 16, padding: 28 }, card: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 7 }, cardTop: { flexDirection: "row", justifyContent: "space-between" }, category: { fontSize: 9, fontWeight: "900" }, title: { fontSize: 13, fontWeight: "900" }, body: { fontSize: 10, lineHeight: 16 }, answer: { borderRadius: 12, padding: 12, marginTop: 4 } });
