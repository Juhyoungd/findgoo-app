import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/src/theme/ThemeContext";
import { BackgroundBlobs } from "@/src/components/common/BackgroundBlobs";
import { authStyles as s } from "@/src/components/auth/authStyles";

type RecoveryTab = "id" | "password";

// [계정 찾기] 아이디 찾기 / 비밀번호 찾기를 한 화면에서 탭으로 전환하는 통합형 배치 (네이버·카카오 스타일)
export default function FindAccountScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab: RecoveryTab = params.tab === "password" ? "password" : "id";

  const [name, setName] = useState("");
  const [idPhone, setIdPhone] = useState("");
  const [idCode, setIdCode] = useState("");
  const [idCodeSent, setIdCodeSent] = useState(false);
  const [idVerified, setIdVerified] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [pwPhone, setPwPhone] = useState("");
  const [pwCode, setPwCode] = useState("");
  const [pwCodeSent, setPwCodeSent] = useState(false);
  const [pwVerified, setPwVerified] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function requestIdCode() {
    if (!name.trim() || !idPhone.trim()) return Alert.alert("이름과 휴대폰번호를 입력해주세요");
    setIdCodeSent(true);
    Alert.alert("인증번호 발송", "휴대폰으로 인증번호를 보냈어요. (베타: 아무 6자리나 입력하세요)");
  }

  function confirmIdCode() {
    if (idCode.length !== 6) return Alert.alert("인증번호 6자리를 입력해주세요");
    setIdVerified(true);
  }

  function findId() {
    if (!idVerified) return Alert.alert("인증번호 확인을 먼저 완료해주세요");
    const last4 = idPhone.replace(/[^0-9]/g, "").slice(-4);
    setResultId(`gu_${name.trim().slice(0, 1)}***${last4}`);
  }

  function requestPwCode() {
    if (!userId.trim() || !pwPhone.trim()) return Alert.alert("아이디와 휴대폰번호를 입력해주세요");
    setPwCodeSent(true);
    Alert.alert("인증번호 발송", "휴대폰으로 인증번호를 보냈어요. (베타: 아무 6자리나 입력하세요)");
  }

  function confirmPwCode() {
    if (pwCode.length !== 6) return Alert.alert("인증번호 6자리를 입력해주세요");
    setPwVerified(true);
  }

  function findPassword() {
    if (!pwVerified) return Alert.alert("인증번호 확인을 먼저 완료해주세요");
    setShowPasswordReset(true);
  }

  function resetPassword() {
    if (newPassword.length < 8) return Alert.alert("비밀번호는 8자 이상 입력해주세요");
    if (newPassword !== confirmPassword) return Alert.alert("비밀번호가 서로 달라요");
    Alert.alert("변경 완료", "비밀번호가 재설정됐어요.");
    router.replace("/login");
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
            <Text style={[s.brandText, { color: palette.ink }]}>{tab === "id" ? "아이디 찾기" : "비밀번호 찾기"}</Text>
            <Text style={[s.tagline, { color: palette.muted }]}>
              {tab === "id" ? "가입할 때 등록한 이름과 휴대폰번호로 확인해요" : "아이디와 휴대폰번호로 본인 확인 후 재설정해요"}
            </Text>
          </View>

          <View style={[s.card, { backgroundColor: palette.white, borderColor: palette.line }]}>
            {tab === "id" ? (
              resultId ? (
                <View style={s.resultBlock}>
                  <Text style={{ color: palette.muted, fontSize: 12 }}>회원님의 아이디는</Text>
                  <Text style={[s.resultValue, { color: palette.ink }]}>{resultId}</Text>
                  <Text style={{ color: palette.muted, fontSize: 12 }}>입니다.</Text>
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
                    value={name}
                    onChangeText={setName}
                    placeholder="이름"
                    placeholderTextColor={palette.muted}
                    style={[s.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
                  />
                  <View style={s.inlineRow}>
                    <TextInput
                      value={idPhone}
                      onChangeText={setIdPhone}
                      placeholder="휴대폰번호 입력 ('-' 제외)"
                      placeholderTextColor={palette.muted}
                      keyboardType="number-pad"
                      style={[s.input, s.inlineInput, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
                    />
                    <Pressable onPress={requestIdCode} style={[s.pillButton, { borderColor: palette.line, backgroundColor: palette.white }]}>
                      <Text style={[s.pillButtonText, { color: palette.ink }]}>{idCodeSent ? "재전송" : "인증번호 전송"}</Text>
                    </Pressable>
                  </View>

                  <View style={s.inlineRow}>
                    <TextInput
                      value={idCode}
                      onChangeText={(value) => setIdCode(value.replace(/[^0-9]/g, ""))}
                      placeholder="인증번호 입력"
                      placeholderTextColor={palette.muted}
                      keyboardType="number-pad"
                      maxLength={6}
                      style={[s.input, s.inlineInput, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
                    />
                    <Pressable onPress={confirmIdCode} style={[s.pillButton, { borderColor: palette.line, backgroundColor: palette.white }]}>
                      <Text style={[s.pillButtonText, { color: palette.ink }]}>{idVerified ? "완료" : "확인"}</Text>
                    </Pressable>
                  </View>

                  <Pressable onPress={findId} style={[s.bigPillButton, { backgroundColor: palette.lime }]}>
                    <Text style={{ color: palette.white, fontWeight: "700", fontSize: 16 }}>아이디 찾기</Text>
                  </Pressable>
                </>
              )
            ) : showPasswordReset ? (
              <>
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
                <Pressable onPress={resetPassword} style={[s.submit, { backgroundColor: palette.lime }]}>
                  <Text style={{ color: palette.white, fontWeight: "700", fontSize: 15 }}>비밀번호 재설정</Text>
                </Pressable>
              </>
            ) : (
              <>
                <TextInput
                  value={userId}
                  onChangeText={setUserId}
                  placeholder="아이디"
                  placeholderTextColor={palette.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[s.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
                />
                <View style={s.inlineRow}>
                  <TextInput
                    value={pwPhone}
                    onChangeText={setPwPhone}
                    placeholder="휴대폰번호 입력 ('-' 제외)"
                    placeholderTextColor={palette.muted}
                    keyboardType="number-pad"
                    style={[s.input, s.inlineInput, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
                  />
                  <Pressable onPress={requestPwCode} style={[s.pillButton, { borderColor: palette.line, backgroundColor: palette.white }]}>
                    <Text style={[s.pillButtonText, { color: palette.ink }]}>{pwCodeSent ? "재전송" : "인증번호 전송"}</Text>
                  </Pressable>
                </View>

                <View style={s.inlineRow}>
                  <TextInput
                    value={pwCode}
                    onChangeText={(value) => setPwCode(value.replace(/[^0-9]/g, ""))}
                    placeholder="인증번호 입력"
                    placeholderTextColor={palette.muted}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[s.input, s.inlineInput, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.paper }]}
                  />
                  <Pressable onPress={confirmPwCode} style={[s.pillButton, { borderColor: palette.line, backgroundColor: palette.white }]}>
                    <Text style={[s.pillButtonText, { color: palette.ink }]}>{pwVerified ? "완료" : "확인"}</Text>
                  </Pressable>
                </View>

                <Pressable onPress={findPassword} style={[s.bigPillButton, { backgroundColor: palette.lime }]}>
                  <Text style={{ color: palette.white, fontWeight: "700", fontSize: 16 }}>비밀번호 찾기</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
