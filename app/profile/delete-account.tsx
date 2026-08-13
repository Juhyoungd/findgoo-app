import { useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { DetailScaffold } from "@/src/components/common/DetailScaffold";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useAuth } from "@/src/state/AuthContext";
import { useToast } from "@/src/state/ToastContext";
import { useTheme } from "@/src/theme/ThemeContext";

// [회원 탈퇴] 오입력을 막기 위해 확인 문구를 받은 뒤 서버 Edge Function에서 auth.users를 삭제합니다.
export default function DeleteAccountScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const { showToast } = useToast();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function submit() {
    if (confirmation.trim() !== "찾구 탈퇴") return showToast("확인란에 ‘찾구 탈퇴’를 정확히 입력해주세요.");
    const approved = Platform.OS === "web" ? window.confirm("계정과 개인정보를 삭제할까요? 이 작업은 되돌릴 수 없습니다.") : true;
    if (!approved) return;
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) return showToast(error);
    router.replace("/login");
  }

  return (
    <DetailScaffold title="회원 탈퇴" eyebrow="DELETE ACCOUNT">
      <View style={[styles.warning, { backgroundColor: `${palette.orange}12`, borderColor: `${palette.orange}55` }]}>
        <Text style={[styles.title, { color: palette.orange }]}>탈퇴 전에 확인해주세요</Text>
        <Text style={[styles.body, { color: palette.muted }]}>계정, 프로필, 찜, 채팅 참여 정보와 작성글이 삭제됩니다. 진행 중이거나 분쟁 처리 중인 거래가 있으면 먼저 거래를 마무리해야 해요.</Text>
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: palette.ink }]}>계속하려면 ‘찾구 탈퇴’를 입력해주세요.</Text>
        <TextInput value={confirmation} onChangeText={setConfirmation} placeholder="찾구 탈퇴" placeholderTextColor={palette.muted} style={[styles.input, { backgroundColor: palette.white, borderColor: palette.line, color: palette.ink }]} />
      </View>
      <MotionPressable onPress={submit} disabled={deleting || confirmation.trim() !== "찾구 탈퇴"} haptic="medium" style={[styles.button, { backgroundColor: palette.orange, opacity: deleting || confirmation.trim() !== "찾구 탈퇴" ? 0.45 : 1 }]}>
        {deleting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>계정과 개인정보 삭제</Text>}
      </MotionPressable>
    </DetailScaffold>
  );
}

const styles = StyleSheet.create({
  warning: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 8 },
  title: { fontSize: 14, fontWeight: "900" },
  body: { fontSize: 10, lineHeight: 17 },
  field: { gap: 9 },
  label: { fontSize: 11, fontWeight: "800" },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 13 },
  button: { minHeight: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "white", fontSize: 12, fontWeight: "900" },
});
