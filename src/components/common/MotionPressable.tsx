import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/ThemeContext";

type HapticKind = "none" | "selection" | "light" | "medium";
type Ripple = { id: number; x: number; y: number; radius: number; progress: Animated.Value };

type MotionPressableProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  pressedScale?: number;
  haptic?: HapticKind;
  rippleColor?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const useNativeDriver = Platform.OS !== "web";

// [공통 버튼 모션] 누른 좌표에서 빠르게 퍼지는 리플 + 스프링 축소 + 햅틱을 모든 버튼에 제공합니다.
export function MotionPressable({
  style,
  pressedScale = 0.97,
  haptic = "selection",
  rippleColor,
  disabled,
  children,
  onLayout,
  onPressIn,
  onPressOut,
  ...props
}: MotionPressableProps) {
  const { palette } = useTheme();
  const resolvedRippleColor = rippleColor ?? `${palette.lime}2b`;
  const scale = useRef(new Animated.Value(1)).current;
  const layout = useRef({ width: 0, height: 0 });
  const rippleId = useRef(0);
  const mounted = useRef(true);
  const [pressed, setPressed] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => () => {
    mounted.current = false;
  }, []);

  function handleLayout(event: LayoutChangeEvent) {
    layout.current = event.nativeEvent.layout;
    onLayout?.(event);
  }

  function startRipple(event: GestureResponderEvent) {
    const { width, height } = layout.current;
    if (!width || !height) return;
    const x = Number.isFinite(event.nativeEvent.locationX) ? event.nativeEvent.locationX : width / 2;
    const y = Number.isFinite(event.nativeEvent.locationY) ? event.nativeEvent.locationY : height / 2;
    const radius = Math.sqrt(Math.max(x, width - x) ** 2 + Math.max(y, height - y) ** 2);
    const ripple: Ripple = { id: ++rippleId.current, x, y, radius, progress: new Animated.Value(0) };

    setRipples((current) => [...current.slice(-3), ripple]);
    Animated.timing(ripple.progress, {
      toValue: 1,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver,
    }).start(() => {
      if (mounted.current) setRipples((current) => current.filter((item) => item.id !== ripple.id));
    });
  }

  function handlePressIn(event: GestureResponderEvent) {
    if (disabled) return;
    setPressed(true);
    startRipple(event);
    Animated.spring(scale, { toValue: pressedScale, speed: 38, bounciness: 2, useNativeDriver }).start();
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
    Animated.spring(scale, { toValue: 1, speed: 30, bounciness: 6, useNativeDriver }).start();
    onPressOut?.(event);
  }

  const resolvedStyle = typeof style === "function" ? style({ pressed }) : style;
  const flattenedStyle = StyleSheet.flatten(resolvedStyle) ?? {};
  const clipRadius = typeof flattenedStyle.borderRadius === "number" ? flattenedStyle.borderRadius : 0;

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onLayout={handleLayout}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[resolvedStyle, { transform: [{ scale }] }]}
    >
      {typeof children === "function" ? children({ pressed }) : children}
      <Animated.View style={[styles.rippleClip, { borderRadius: clipRadius, pointerEvents: "none" }]}>
        {ripples.map((ripple) => (
          <Animated.View
            key={ripple.id}
            style={[
              styles.ripple,
              {
                left: ripple.x - ripple.radius,
                top: ripple.y - ripple.radius,
                width: ripple.radius * 2,
                height: ripple.radius * 2,
                borderRadius: ripple.radius,
                backgroundColor: resolvedRippleColor,
                opacity: ripple.progress.interpolate({ inputRange: [0, 0.72, 1], outputRange: [0.5, 0.2, 0] }),
                transform: [{ scale: ripple.progress.interpolate({ inputRange: [0, 1], outputRange: [0.04, 1] }) }],
              },
            ]}
          />
        ))}
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  rippleClip: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  ripple: { position: "absolute" },
});
