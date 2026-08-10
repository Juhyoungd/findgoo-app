import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/state/AuthContext";
import { BackgroundBlobs } from "@/src/components/common/BackgroundBlobs";
import { authStyles as s } from "@/src/components/auth/authStyles";

// [비밀번호 찾기] 이메일로 Supabase 비밀번호 재설정 링크를 보냅니다.
// 로그인이 이메일 기반이라 "아이디 찾기"는 의미가 없어져서 이 화면 하나로 단순화했습니다.
export default function ForgotPasswordScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!email.trim()) return Alert.alert("이메일을 입력해주세요");
    setLoading(true);
    const { error } = await resetPassword(email.trim());
    setLoading(false);
    if (error) return Alert.alert("전송 실패", error);
    setSent(true);
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: palette.paper }]}>
      <BackgroundBlobs />
      <View style={s.backRow}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={[s.backText, { color: palette.muted }]}>‹ 뒤로</Text>
        </Pressable>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.hero}>
            <View style={[s.logoSmall, { backgroundColor: palette.lime }]}>
              <Text style={s.logoTextSmall}>찾</Text>
            </View>
            <Text style={[s.brandText, { color: palette.ink }]}>비밀번호 찾기</Text>
            <Text style={[s.tagline, { color: palette.muted }]}>가입한 이메일로 재설정 링크를 보내드려요</Text>
          </View>

          <View style={[s.card, { backgroundColor: palette.white, borderColor: palette.line }]}>
            {sent ? (
              <View style={s.resultBlock}>
                <Text style={{ color: palette.muted, fontSize: 12, textAlign: "center" }}>
                  {email} 주소로{"\n"}재설정 링크를 보냈어요.
                </Text>
                <Pressable
                  onPress={() => router.replace("/login")}
                  style={[s.submit, { backgroundColor: palette.lime, marginTop: 12, alignSelf: "stretch" }]}
                >
                  <Text style={{ color: palette.white, fontWeight: "700", fontSize: 15 }}>로그인하러 가기</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="이메일"
                  placeholderTextColor={palette.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={[s.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
                />
                <Pressable onPress={submit} disabled={loading} style={[s.bigPillButton, { backgroundColor: palette.lime, opacity: loading ? 0.7 : 1 }]}>
                  {loading ? <ActivityIndicator color={palette.white} /> : <Text style={{ color: palette.white, fontWeight: "700", fontSize: 16 }}>재설정 링크 보내기</Text>}
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
