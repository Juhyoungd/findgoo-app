import { useRef, useState } from "react";
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

type HapticKind = "none" | "selection" | "light" | "medium";

type MotionPressableProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  pressedScale?: number;
  haptic?: HapticKind;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// [공통 버튼 모션] 앱의 모든 터치·클릭에 같은 스프링 축소와 햅틱 피드백을 제공합니다.
export function MotionPressable({
  style,
  pressedScale = 0.97,
  haptic = "selection",
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: MotionPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  function handlePressIn(event: GestureResponderEvent) {
    if (disabled) return;
    setPressed(true);
    Animated.spring(scale, { toValue: pressedScale, speed: 36, bounciness: 2, useNativeDriver: true }).start();
    const feedback = haptic === "light"
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : haptic === "medium"
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        : haptic === "selection"
          ? Haptics.selectionAsync()
          : Promise.resolve();
    void feedback.catch(() => undefined);
    onPressIn?.(event);
  }

  function handlePressOut(event: GestureResponderEvent) {
    setPressed(false);
    Animated.spring(scale, { toValue: 1, speed: 28, bounciness: 7, useNativeDriver: true }).start();
    onPressOut?.(event);
  }

  const resolvedStyle = typeof style === "function" ? style({ pressed }) : style;

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[resolvedStyle, { transform: [{ scale }] }]}
    />
  );
}
