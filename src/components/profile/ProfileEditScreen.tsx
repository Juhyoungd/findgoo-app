import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { DetailScaffold } from "@/src/components/common/DetailScaffold";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { ProfileAvatar } from "@/src/components/profile/ProfileAvatar";
import { useAuth } from "@/src/state/AuthContext";
import { useToast } from "@/src/state/ToastContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { getPasswordRuleError } from "@/src/utils/validation";
import { isSupabaseConfigured } from "@/src/lib/supabase";
import { pickImage, uploadAvatar } from "@/src/services/mediaService";

// [회원정보 수정] 비밀번호·닉네임·프로필 사진을 한 번에 검증하고 저장합니다.
export function ProfileEditScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setNickname(profile.nickname);
    setAvatarUrl(profile.avatarUrl ?? "");
  }, [profile]);

  async function save() {
    const nextNickname = nickname.trim();
    if (nextNickname.length < 2 || nextNickname.length > 12) return showToast("닉네임은 2~12자로 입력해주세요.");
    if (password) {
      const passwordError = getPasswordRuleError(password);
      if (passwordError) return showToast(passwordError);
      if (password !== confirmPassword) return showToast("새 비밀번호가 서로 달라요.");
    }
    setSaving(true);
    const { error } = await updateProfile({ nickname: nextNickname, avatarUrl: avatarUrl.trim() || null, password: password || undefined });
    setSaving(false);
    if (error) return showToast(error);
    showToast("회원정보를 수정했어요.");
    router.back();
  }

  async function chooseAvatar() {
    if (!profile) return showToast("프로필을 먼저 불러와주세요.");
    const { asset, error } = await pickImage({ square: true });
    if (error) return showToast(error);
    if (!asset) return;
    if (!isSupabaseConfigured) {
      setAvatarUrl(asset.uri);
      return;
    }
    setUploading(true);
    const uploaded = await uploadAvatar(asset, profile.id);
    setUploading(false);
    if (uploaded.error || !uploaded.url) return showToast(uploaded.error ?? "사진을 올리지 못했어요.");
    setAvatarUrl(uploaded.url);
  }

  return (
    <DetailScaffold title="회원정보 수정" eyebrow="EDIT PROFILE">
      <View style={[styles.preview, { backgroundColor: palette.white, borderColor: palette.line }]}>
        <ProfileAvatar nickname={nickname || "찾구"} avatarUrl={avatarUrl} size={82} />
        <Text style={[styles.name, { color: palette.ink }]}>{nickname || "닉네임 미리보기"}</Text>
      </View>

      <Field label="닉네임">
        <TextInput value={nickname} onChangeText={setNickname} maxLength={12} placeholder="2~12자" placeholderTextColor={palette.muted} style={[styles.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.white }]} />
      </Field>

      <Field label="프로필 사진">
        <View style={styles.presetRow}>
          <MotionPressable onPress={chooseAvatar} disabled={uploading} style={[styles.photoButton, { backgroundColor: palette.lime }]}>{uploading ? <ActivityIndicator color="white" /> : <Text style={styles.photoButtonText}>사진 선택</Text>}</MotionPressable>
          <MotionPressable onPress={() => setAvatarUrl("")} style={[styles.resetAvatar, { borderColor: palette.line }]}><Text style={{ color: palette.muted, fontSize: 9, fontWeight: "800" }}>기본 이미지</Text></MotionPressable>
        </View>
      </Field>

      <Field label="새 비밀번호 (변경할 때만 입력)">
        <TextInput value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" placeholder="영문·숫자 포함 8자 이상" placeholderTextColor={palette.muted} style={[styles.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.white }]} />
        <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" placeholder="새 비밀번호 확인" placeholderTextColor={palette.muted} style={[styles.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.white }]} />
      </Field>

      <MotionPressable onPress={save} disabled={saving} haptic="medium" style={[styles.save, { backgroundColor: palette.lime, opacity: saving ? 0.65 : 1 }]}>
        {saving ? <ActivityIndicator color={palette.white} /> : <Text style={{ color: palette.white, fontSize: 13, fontWeight: "900" }}>변경사항 저장</Text>}
      </MotionPressable>
    </DetailScaffold>
  );

  function Field({ label, children }: { label: string; children: ReactNode }) {
    return <View style={styles.field}><Text style={[styles.label, { color: palette.muted }]}>{label}</Text>{children}</View>;
  }
}

const styles = StyleSheet.create({
  preview: { alignItems: "center", borderWidth: 1, borderRadius: 20, padding: 20 },
  name: { fontSize: 15, fontWeight: "900", marginTop: 10 },
  field: { gap: 8 },
  label: { fontSize: 10, fontWeight: "800" },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 13 },
  presetRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  photoButton: { minHeight: 42, borderRadius: 13, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  photoButtonText: { color: "white", fontSize: 10, fontWeight: "900" },
  resetAvatar: { minHeight: 42, borderRadius: 13, borderWidth: 1, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  save: { minHeight: 50, borderRadius: 15, alignItems: "center", justifyContent: "center", marginTop: 4 },
});
