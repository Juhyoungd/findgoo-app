import type { StyleProp, ViewStyle } from "react-native";
import { Platform, StyleSheet } from "react-native";
import { appIcons } from "@/src/assets/app-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useTheme } from "@/src/theme/ThemeContext";

type BackButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

// [뒤로가기 버튼] 화살표를 버튼 정중앙에 고정하고 모든 상세 화면에서 같은 터치감을 사용합니다.
export function BackButton({ onPress, accessibilityLabel = "이전 화면으로 돌아가기", style }: BackButtonProps) {
  const { palette } = useTheme();

  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      haptic="light"
      pressedScale={0.93}
      onPress={onPress}
      style={[styles.button, { backgroundColor: palette.white, borderColor: palette.line }, Platform.OS === "web" ? { boxShadow: `0 3px 7px ${palette.ink}0f` } : { shadowColor: palette.ink }, style]}
    >
      <AppIcon name={appIcons.back} color={palette.ink} size={18} strokeWidth={1.8} />
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    ...Platform.select({ web: {}, default: { shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 7 } }),
  },
});
