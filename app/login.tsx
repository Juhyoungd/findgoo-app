import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/state/AuthContext";
import { BackgroundBlobs } from "@/src/components/common/BackgroundBlobs";
import { MotionPressable as Pressable } from "@/src/components/common/MotionPressable";
import { authStyles as s } from "@/src/components/auth/authStyles";

// [로그인] Supabase Auth 이메일/비밀번호 로그인. 다른 인증 화면들과 같은 그라데이션 블롭 + 화이트 카드 톤을 재사용
export default function LoginScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { session, isAdmin, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // signIn()이 끝난 직후 바로 router.replace를 부르면, AuthContext의 session 상태가
  // 아직 갱신되기 전이라 (tabs)/admin 레이아웃의 로그인 가드가 다시 /login으로 되돌려보내는
  // 경합 상태가 생길 수 있어요. 그래서 session이 실제로 채워지는 걸 보고 이동시킵니다.
  // isAdmin도 session에서 파생되는 값이라 같이 반영된 뒤에 이동해요.
  useEffect(() => {
    if (session) router.replace(isAdmin ? "/admin" : "/(tabs)");
  }, [session, isAdmin, router]);

  async function submit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("이메일과 비밀번호를 입력해주세요");
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert("로그인 실패", error);
    }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: palette.paper }]}>
      <BackgroundBlobs />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.hero}>
            <View style={[s.logo, { backgroundColor: palette.lime }]}>
              <Text style={s.logoText}>찾</Text>
            </View>
            <Text style={[s.brandText, { color: palette.ink }]}>찾구</Text>
            <Text style={[s.tagline, { color: palette.muted }]}>동네에서 필요한 걸 가장 빠르게</Text>
          </View>

          <View style={[s.card, { backgroundColor: palette.white, borderColor: palette.line }]}>
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
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호"
              placeholderTextColor={palette.muted}
              secureTextEntry
              autoCapitalize="none"
              style={[s.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
            />

            <Pressable onPress={submit} disabled={loading} style={[s.submit, { backgroundColor: palette.lime, opacity: loading ? 0.7 : 1 }]}>
              {loading ? <ActivityIndicator color={palette.white} /> : <Text style={{ color: palette.white, fontWeight: "700", fontSize: 15 }}>로그인</Text>}
            </Pressable>
          </View>

          <View style={s.linkRow}>
            <Pressable onPress={() => router.push("/forgot-password")}>
              <Text style={[s.linkText, { color: palette.muted }]}>비밀번호 찾기</Text>
            </Pressable>
            <Text style={[s.linkDivider, { color: palette.line }]}>|</Text>
            <Pressable onPress={() => router.push("/signup")}>
              <Text style={[s.linkText, { color: palette.muted }]}>회원가입</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
