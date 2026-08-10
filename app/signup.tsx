import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/state/AuthContext";
import { BackgroundBlobs } from "@/src/components/common/BackgroundBlobs";
import { MotionPressable as Pressable } from "@/src/components/common/MotionPressable";
import { authStyles as s } from "@/src/components/auth/authStyles";

// [회원가입] 이름/이메일/비밀번호/휴대폰 인증/약관 동의로 구성된 보편적인 가입 폼 배치
// 로그인/아이디찾기와 같은 톤을 유지하면서, 한 화면에 들어오도록 여백과 요소 높이를 살짝만 줄였습니다.
// 실제 계정 생성은 Supabase Auth(이메일/비밀번호)로 처리하고, 이름/휴대폰은 profiles 테이블에 저장됩니다.
// 휴대폰 인증은 아직 SMS 연동 전이라 베타 목업(6자리 아무 값 통과)입니다.
export default function SignupScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const agreeAll = agreeTerms && agreePrivacy && agreeMarketing;

  function toggleAll() {
    const next = !agreeAll;
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeMarketing(next);
  }

  function requestCode() {
    if (!phone.trim()) return Alert.alert("휴대폰번호를 입력해주세요");
    setCodeSent(true);
    Alert.alert("인증번호 발송", "휴대폰으로 인증번호를 보냈어요. (베타: 아무 6자리나 입력하세요)");
  }

  function confirmCode() {
    if (code.length !== 6) return Alert.alert("인증번호 6자리를 입력해주세요");
    setVerified(true);
  }

  async function submit() {
    if (!name.trim()) return Alert.alert("이름을 입력해주세요");
    if (!email.trim()) return Alert.alert("이메일을 입력해주세요");
    if (password.length < 8) return Alert.alert("비밀번호는 8자 이상 입력해주세요");
    if (password !== confirmPassword) return Alert.alert("비밀번호가 서로 달라요");
    if (!verified) return Alert.alert("휴대폰 인증번호 확인을 완료해주세요");
    if (!agreeTerms || !agreePrivacy) return Alert.alert("필수 약관에 동의해주세요");

    setLoading(true);
    const { error } = await signUp({ email: email.trim(), password, name: name.trim(), phone: phone.trim() });
    setLoading(false);
    if (error) return Alert.alert("가입 실패", error);

    Alert.alert("가입 완료", "이메일로 확인 메일을 보냈어요. 확인 후 로그인해주세요.");
    router.replace("/login");
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: palette.paper }]}>
      <BackgroundBlobs />
      <View style={[s.backRow, compact.backRow]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={[s.backText, { color: palette.muted }]}>‹ 뒤로</Text>
        </Pressable>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[s.content, compact.content]} keyboardShouldPersistTaps="handled">
          <View style={[s.hero, compact.hero]}>
            <View style={[s.logoSmall, compact.logo, { backgroundColor: palette.lime }]}>
              <Text style={[s.logoTextSmall, compact.logoText]}>찾</Text>
            </View>
            <Text style={[s.brandText, compact.brandText, { color: palette.ink }]}>회원가입</Text>
            <Text style={[s.tagline, compact.tagline, { color: palette.muted }]}>몇 가지 정보만 입력하면 바로 시작할 수 있어요</Text>
          </View>

          <View style={[s.card, compact.card, { backgroundColor: palette.white, borderColor: palette.line }]}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="이름"
              placeholderTextColor={palette.muted}
              style={[s.input, compact.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
            />

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="이메일"
              placeholderTextColor={palette.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={[s.input, compact.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호 (8자 이상)"
              placeholderTextColor={palette.muted}
              secureTextEntry
              autoCapitalize="none"
              style={[s.input, compact.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="비밀번호 확인"
              placeholderTextColor={palette.muted}
              secureTextEntry
              autoCapitalize="none"
              style={[s.input, compact.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
            />

            <View style={s.inlineRow}>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="휴대폰번호 입력 ('-' 제외)"
                placeholderTextColor={palette.muted}
                keyboardType="number-pad"
                style={[s.input, s.inlineInput, compact.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
              />
              <Pressable onPress={requestCode} style={[s.pillButton, compact.pillButton, { borderColor: palette.line, backgroundColor: palette.white }]}>
                <Text style={[s.pillButtonText, { color: palette.ink }]}>{codeSent ? "재전송" : "인증번호 전송"}</Text>
              </Pressable>
            </View>

            <View style={s.inlineRow}>
              <TextInput
                value={code}
                onChangeText={(value) => setCode(value.replace(/[^0-9]/g, ""))}
                placeholder="인증번호 입력"
                placeholderTextColor={palette.muted}
                keyboardType="number-pad"
                maxLength={6}
                style={[s.input, s.inlineInput, compact.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
              />
              <Pressable onPress={confirmCode} style={[s.pillButton, compact.pillButton, { borderColor: palette.line, backgroundColor: palette.white }]}>
                <Text style={[s.pillButtonText, { color: palette.ink }]}>{verified ? "완료" : "확인"}</Text>
              </Pressable>
            </View>

            <View style={[s.divider, compact.divider, { backgroundColor: palette.line }]} />

            <Pressable onPress={toggleAll} style={[s.checkRow, compact.checkRow]}>
              <View style={[s.checkbox, compact.checkbox, { borderColor: agreeAll ? palette.lime : palette.line, backgroundColor: agreeAll ? palette.lime : "transparent" }]}>
                {agreeAll && <Text style={[s.checkboxMark, compact.checkboxMark, { color: palette.white }]}>✓</Text>}
              </View>
              <Text style={[s.checkLabel, { color: palette.ink, fontWeight: "800" }]}>약관 전체 동의</Text>
            </Pressable>

            <Pressable onPress={() => setAgreeTerms((value) => !value)} style={[s.checkRow, compact.checkRow]}>
              <View style={[s.checkbox, compact.checkbox, { borderColor: agreeTerms ? palette.lime : palette.line, backgroundColor: agreeTerms ? palette.lime : "transparent" }]}>
                {agreeTerms && <Text style={[s.checkboxMark, compact.checkboxMark, { color: palette.white }]}>✓</Text>}
              </View>
              <Text style={[s.checkLabel, { color: palette.ink }]}>이용약관 동의</Text>
              <Text style={[s.checkRequiredTag, { color: palette.orange }]}>필수</Text>
            </Pressable>

            <Pressable onPress={() => setAgreePrivacy((value) => !value)} style={[s.checkRow, compact.checkRow]}>
              <View style={[s.checkbox, compact.checkbox, { borderColor: agreePrivacy ? palette.lime : palette.line, backgroundColor: agreePrivacy ? palette.lime : "transparent" }]}>
                {agreePrivacy && <Text style={[s.checkboxMark, compact.checkboxMark, { color: palette.white }]}>✓</Text>}
              </View>
              <Text style={[s.checkLabel, { color: palette.ink }]}>개인정보 수집·이용 동의</Text>
              <Text style={[s.checkRequiredTag, { color: palette.orange }]}>필수</Text>
            </Pressable>

            <Pressable onPress={() => setAgreeMarketing((value) => !value)} style={[s.checkRow, compact.checkRow]}>
              <View style={[s.checkbox, compact.checkbox, { borderColor: agreeMarketing ? palette.lime : palette.line, backgroundColor: agreeMarketing ? palette.lime : "transparent" }]}>
                {agreeMarketing && <Text style={[s.checkboxMark, compact.checkboxMark, { color: palette.white }]}>✓</Text>}
              </View>
              <Text style={[s.checkLabel, { color: palette.ink }]}>마케팅 정보 수신 동의</Text>
              <Text style={[s.checkRequiredTag, { color: palette.muted }]}>선택</Text>
            </Pressable>

            <Pressable onPress={submit} disabled={loading} style={[s.bigPillButton, compact.bigPillButton, { backgroundColor: palette.lime, opacity: loading ? 0.7 : 1 }]}>
              {loading ? <ActivityIndicator color={palette.white} /> : <Text style={{ color: palette.white, fontWeight: "700", fontSize: 15 }}>가입하기</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const compact = StyleSheet.create({
  backRow: { paddingTop: 4 },
  content: { padding: 20, paddingTop: 10, gap: 14, justifyContent: "flex-start" },
  hero: { paddingVertical: 10 },
  logo: { width: 40, height: 40, borderRadius: 12, marginBottom: 6 },
  logoText: { fontSize: 16 },
  brandText: { fontSize: 20 },
  tagline: { fontSize: 12, marginTop: 3 },
  card: { padding: 14, gap: 8 },
  input: { paddingVertical: 10 },
  pillButton: { paddingVertical: 8, paddingHorizontal: 14 },
  divider: { marginVertical: 6 },
  checkRow: { paddingVertical: 4 },
  checkbox: { width: 18, height: 18, borderRadius: 5 },
  checkboxMark: { fontSize: 11 },
  bigPillButton: { paddingVertical: 13, marginTop: 6 },
});
