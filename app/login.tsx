import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/ThemeContext";
import { BackgroundBlobs } from "@/src/components/common/BackgroundBlobs";
import { authStyles as s } from "@/src/components/auth/authStyles";

// [로그인] 다른 인증 화면들과 같은 그라데이션 블롭 + 화이트 카드 톤을 재사용
export default function LoginScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  function submit() {
    if (!userId.trim() || !password.trim()) {
      Alert.alert("아이디와 비밀번호를 입력해주세요");
      return;
    }
    router.replace("/(tabs)");
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
              value={userId}
              onChangeText={setUserId}
              placeholder="아이디"
              placeholderTextColor={palette.muted}
              autoCapitalize="none"
              autoCorrect={false}
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

            <Pressable onPress={submit} style={[s.submit, { backgroundColor: palette.lime }]}>
              <Text style={{ color: palette.white, fontWeight: "700", fontSize: 15 }}>로그인</Text>
            </Pressable>
          </View>

          <View style={s.linkRow}>
            <Pressable onPress={() => router.push("/find-id")}>
              <Text style={[s.linkText, { color: palette.muted }]}>아이디 찾기</Text>
            </Pressable>
            <Text style={[s.linkDivider, { color: palette.line }]}>|</Text>
            <Pressable onPress={() => router.push({ pathname: "/find-id", params: { tab: "password" } })}>
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
