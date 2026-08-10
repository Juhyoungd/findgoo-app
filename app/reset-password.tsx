import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/src/theme/ThemeContext";
import { supabase } from "@/src/lib/supabase";
import { BackgroundBlobs } from "@/src/components/common/BackgroundBlobs";
import { authStyles as s } from "@/src/components/auth/authStyles";

// [비밀번호 재설정 완료] 비밀번호 찾기 이메일의 링크(?code=...)를 통해서만 들어올 수 있는 화면.
// code를 세션으로 교환한 뒤 새 비밀번호를 입력받아 저장합니다.
export default function ResetPasswordScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const [ready, setReady] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function exchange() {
      if (!params.code) {
        Alert.alert("잘못된 접근", "이메일로 받은 재설정 링크를 통해서만 들어올 수 있어요.");
        router.replace("/login");
        return;
      }
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (error) {
        Alert.alert("링크 만료", "재설정 링크가 만료됐거나 이미 사용됐어요. 다시 요청해주세요.");
        router.replace("/forgot-password");
        return;
      }
      setReady(true);
    }
    exchange();
  }, [params.code, router]);

  async function submit() {
    if (newPassword.length < 8) return Alert.alert("비밀번호는 8자 이상 입력해주세요");
    if (newPassword !== confirmPassword) return Alert.alert("비밀번호가 서로 달라요");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) return Alert.alert("변경 실패", error.message);

    Alert.alert("변경 완료", "비밀번호가 재설정됐어요.");
    router.replace("/(tabs)");
  }

  if (!ready) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: palette.paper, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={palette.lime} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: palette.paper }]}>
      <BackgroundBlobs />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.hero}>
            <View style={[s.logoSmall, { backgroundColor: palette.lime }]}>
              <Text style={s.logoTextSmall}>찾</Text>
            </View>
            <Text style={[s.brandText, { color: palette.ink }]}>새 비밀번호 설정</Text>
            <Text style={[s.tagline, { color: palette.muted }]}>새로 쓸 비밀번호를 입력해주세요</Text>
          </View>

          <View style={[s.card, { backgroundColor: palette.white, borderColor: palette.line }]}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="새 비밀번호 (8자 이상)"
              placeholderTextColor={palette.muted}
              secureTextEntry
              autoCapitalize="none"
              style={[s.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="새 비밀번호 확인"
              placeholderTextColor={palette.muted}
              secureTextEntry
              autoCapitalize="none"
              style={[s.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
            />
            <Pressable onPress={submit} disabled={loading} style={[s.submit, { backgroundColor: palette.lime, opacity: loading ? 0.7 : 1 }]}>
              {loading ? <ActivityIndicator color={palette.white} /> : <Text style={{ color: palette.white, fontWeight: "700", fontSize: 15 }}>비밀번호 변경</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
