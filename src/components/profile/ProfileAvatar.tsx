import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useTheme } from "@/src/theme/ThemeContext";

type ProfileAvatarProps = {
  nickname: string;
  avatarUrl?: string | null;
  size?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

// [프로필 이미지] 이미지 로딩에 실패하면 닉네임 첫 글자로 안전하게 대체합니다.
export function ProfileAvatar({ nickname, avatarUrl, size = 44, onPress, style, accessibilityLabel }: ProfileAvatarProps) {
  const { palette } = useTheme();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [avatarUrl]);

  const avatar = (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: palette.blue, borderColor: palette.line }, style]}>
      {avatarUrl && !failed ? (
        <Image source={{ uri: avatarUrl }} onError={() => setFailed(true)} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={{ color: palette.limeDark, fontSize: size * 0.4, fontWeight: "900" }}>{nickname.trim()[0] || "찾"}</Text>
      )}
    </View>
  );

  if (!onPress) return avatar;
  return (
    <MotionPressable onPress={onPress} pressedScale={0.92} style={{ borderRadius: size / 2 }} accessibilityLabel={accessibilityLabel ?? `${nickname} 프로필 열기`}>
      {avatar}
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  avatar: { overflow: "hidden", borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
