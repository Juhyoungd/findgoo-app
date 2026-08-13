import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BackButton } from "@/src/components/common/BackButton";
import { useAppData } from "@/src/state/AppDataContext";
import { MotionPressable as Pressable } from "@/src/components/common/MotionPressable";
import { useTheme } from "@/src/theme/ThemeContext";
import type { ReportReason } from "@/src/types/findgoo";

const reasons: ReportReason[] = ["사기 의심", "욕설·비방", "거래 불이행", "부적절한 상품", "기타"];

// [신고] 1:1 거래 채팅 상대를 신고하고 관리자 신고함으로 전달하는 화면
export default function ReportUserScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { postId, reportedUserId } = useLocalSearchParams<{ postId: string; reportedUserId?: string }>();
  const { posts, addReport } = useAppData();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const post = posts.find((candidate) => candidate.id === postId);
  const counterparty = post ? (post.mine ? "거래 상대" : post.author) : "거래 상대";

  async function submit() {
    if (!reason || !post || submitting) return;
    try {
      setSubmitting(true);
      const { error } = await addReport({ postId: post.id, reportedUser: counterparty, reportedUserId, reason, detail: detail.trim() || "추가 설명 없음" });
      if (error) return Alert.alert("신고 접수 실패", error);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (!post) {
    return <SafeAreaView style={[styles.missing, { backgroundColor: palette.paper }]}><Text style={{ color: palette.muted }}>신고할 거래를 찾을 수 없어요.</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <View style={[styles.header, { backgroundColor: palette.white, borderBottomColor: palette.line }]}>
        <BackButton onPress={() => router.back()} accessibilityLabel="채팅으로 돌아가기" />
        <View style={{ flex: 1 }}><Text style={[styles.headerTitle, { color: palette.ink }]}>거래 상대 신고</Text><Text style={[styles.headerSub, { color: palette.muted }]}>{counterparty}</Text></View>
      </View>

      {submitted ? (
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: `${palette.lime}18` }]}><Text style={{ color: palette.lime, fontSize: 25, fontWeight: "900" }}>✓</Text></View>
          <Text style={[styles.successTitle, { color: palette.ink }]}>신고가 접수됐어요</Text>
          <Text style={[styles.successBody, { color: palette.muted }]}>관리자가 내용을 확인합니다. 같은 상대와의 추가 거래는 신중하게 진행해주세요.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="채팅으로 돌아가기" onPress={() => router.back()} style={[styles.doneButton, { backgroundColor: palette.lime }]}><Text style={{ color: palette.white, fontWeight: "800" }}>채팅으로 돌아가기</Text></Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.targetCard, { backgroundColor: palette.white, borderColor: palette.line }]}>
            <View style={[styles.avatar, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontWeight: "900" }}>{counterparty[0]}</Text></View>
            <View style={{ flex: 1 }}><Text style={[styles.targetName, { color: palette.ink }]}>{counterparty}</Text><Text style={[styles.postTitle, { color: palette.muted }]} numberOfLines={1}>{post.title}</Text></View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: palette.ink }]}>신고 사유</Text>
            <View style={styles.reasonGrid}>
              {reasons.map((item) => (
                <Pressable key={item} accessibilityRole="button" accessibilityLabel={`신고 사유 ${item}`} onPress={() => setReason(item)} style={[styles.reason, { backgroundColor: reason === item ? `${palette.orange}18` : palette.white, borderColor: reason === item ? palette.orange : palette.line }]}>
                  <Text style={{ color: reason === item ? palette.orange : palette.muted, fontSize: 11, fontWeight: reason === item ? "800" : "600" }}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: palette.ink }]}>상세 내용</Text>
            <TextInput value={detail} onChangeText={setDetail} placeholder="관리자가 확인할 수 있도록 상황을 구체적으로 적어주세요." placeholderTextColor={palette.muted} multiline maxLength={500} textAlignVertical="top" style={[styles.input, { backgroundColor: palette.white, borderColor: palette.line, color: palette.ink }]} />
            <Text style={[styles.counter, { color: palette.muted }]}>{detail.length}/500</Text>
          </View>

          <View style={[styles.guide, { backgroundColor: palette.blue }]}><Text style={[styles.guideText, { color: palette.ink }]}>허위 신고는 서비스 이용 제한 사유가 될 수 있어요. 접수된 내용은 관리자 신고 관리 화면에 전달됩니다.</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="신고 접수하기" disabled={!reason || submitting} onPress={submit} style={[styles.submit, { backgroundColor: reason ? palette.orange : palette.line, opacity: submitting ? 0.7 : 1 }]}>{submitting ? <ActivityIndicator color={palette.white} /> : <Text style={{ color: palette.white, fontWeight: "900" }}>신고 접수하기</Text>}</Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  missing: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: "800" },
  headerSub: { fontSize: 9, marginTop: 2 },
  content: { padding: 20, paddingBottom: 36, gap: 20 },
  targetCard: { flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderRadius: 16, padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  targetName: { fontSize: 14, fontWeight: "800" },
  postTitle: { fontSize: 10, marginTop: 3 },
  section: { gap: 10 },
  label: { fontSize: 13, fontWeight: "800" },
  reasonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reason: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
  input: { minHeight: 130, borderWidth: 1, borderRadius: 15, padding: 14, fontSize: 12, lineHeight: 18 },
  counter: { alignSelf: "flex-end", fontSize: 9, marginTop: -5 },
  guide: { borderRadius: 13, padding: 13 },
  guideText: { fontSize: 10, lineHeight: 16 },
  submit: { alignItems: "center", borderRadius: 14, paddingVertical: 15 },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 28 },
  successIcon: { width: 64, height: 64, borderRadius: 23, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  successTitle: { fontSize: 20, fontWeight: "900" },
  successBody: { fontSize: 11, lineHeight: 17, textAlign: "center" },
  doneButton: { width: "100%", alignItems: "center", borderRadius: 14, paddingVertical: 14, marginTop: 10 },
});
