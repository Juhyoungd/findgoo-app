import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useTheme } from "@/src/theme/ThemeContext";

type MannerReviewModalProps = {
  visible: boolean;
  revieweeName: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (goodManner: boolean, body: string) => void;
};

// [매너 후기] 거래 완료 직후 뜨는 시트. 별점(👍/👎)만 필수고 텍스트는 선택이라
// 후기를 쓰기 싫은 사람도 매너 온도만 남길 수 있어요. 진행 중 거래 화면과 채팅방
// 양쪽에서 같은 모양으로 써서 컴포넌트로 뺐습니다.
export function MannerReviewModal({ visible, revieweeName, submitting, onClose, onSubmit }: MannerReviewModalProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const [goodManner, setGoodManner] = useState<boolean | null>(null);
  const [body, setBody] = useState("");

  useEffect(() => {
    if (visible) {
      setGoodManner(null);
      setBody("");
    }
  }, [visible]);

  function submit() {
    if (goodManner === null || submitting) return;
    onSubmit(goodManner, body.trim());
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}>
        <MotionPressable accessibilityRole="button" accessibilityLabel="매너 후기 작성 닫기" style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: palette.paper, paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          <View style={[styles.handle, { backgroundColor: palette.line }]} />
          <Text style={[styles.sheetTitle, { color: palette.ink }]}>매너 후기 남기기</Text>
          <Text style={[styles.sheetSub, { color: palette.muted }]}>{revieweeName}님과의 거래는 어떠셨나요?</Text>

          <View style={styles.ratingRow}>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel="매너 좋아요"
              onPress={() => setGoodManner(true)}
              style={[styles.ratingButton, { backgroundColor: goodManner === true ? palette.lime : palette.white, borderColor: goodManner === true ? palette.lime : palette.line }]}
            >
              <Text style={{ color: goodManner === true ? palette.white : palette.ink, fontWeight: "800", fontSize: 14 }}>👍 좋았어요</Text>
            </MotionPressable>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel="매너 아쉬워요"
              onPress={() => setGoodManner(false)}
              style={[styles.ratingButton, { backgroundColor: goodManner === false ? palette.orange : palette.white, borderColor: goodManner === false ? palette.orange : palette.line }]}
            >
              <Text style={{ color: goodManner === false ? palette.white : palette.ink, fontWeight: "800", fontSize: 14 }}>👎 아쉬워요</Text>
            </MotionPressable>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: palette.ink }]}>한마디 (선택)</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              multiline
              maxLength={200}
              textAlignVertical="top"
              placeholder="후기를 쓰고 싶지 않으면 비워두셔도 돼요."
              placeholderTextColor={palette.muted}
              style={[styles.textarea, { backgroundColor: palette.white, borderColor: palette.line, color: palette.ink }]}
            />
          </View>

          <View style={styles.reviewButtonRow}>
            <MotionPressable accessibilityRole="button" accessibilityLabel="나중에 남기기" onPress={onClose} style={[styles.skipButton, { backgroundColor: palette.white, borderColor: palette.line }]}>
              <Text style={{ color: palette.muted, fontWeight: "700", fontSize: 13 }}>나중에</Text>
            </MotionPressable>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel="매너 후기 제출"
              onPress={submit}
              disabled={goodManner === null || submitting}
              style={[styles.submitReview, { backgroundColor: palette.lime, opacity: goodManner === null || submitting ? 0.6 : 1 }]}
            >
              {submitting ? <ActivityIndicator color={palette.white} /> : <Text style={{ color: palette.white, fontWeight: "800", fontSize: 14 }}>제출하기</Text>}
            </MotionPressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(31,25,35,0.42)" },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 32, gap: 14 },
  handle: { alignSelf: "center", width: 38, height: 4, borderRadius: 2 },
  sheetTitle: { fontSize: 17, fontWeight: "900" },
  sheetSub: { fontSize: 12, marginTop: -8 },
  ratingRow: { flexDirection: "row", gap: 10 },
  ratingButton: { flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderRadius: 14, paddingVertical: 14 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "800" },
  textarea: { minHeight: 80, borderWidth: 1, borderRadius: 13, padding: 13, fontSize: 12, lineHeight: 18 },
  reviewButtonRow: { flexDirection: "row", gap: 10 },
  skipButton: { flex: 0.8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 14, paddingVertical: 15 },
  submitReview: { flex: 1.4, alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 15 },
});
