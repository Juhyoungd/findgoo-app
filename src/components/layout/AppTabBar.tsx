import { useRef, useState } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Animated, Modal, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appIcons } from "@/src/assets/app-icons";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";

const tabConfig: Record<string, { label: string; icon: string }> = {
  index: { label: "홈", icon: appIcons.home },
  market: { label: "급구", icon: appIcons.urgent },
  create: { label: "등록", icon: appIcons.create },
  buy: { label: "구매글", icon: appIcons.buy },
  chat: { label: "채팅", icon: appIcons.chat },
};

const visibleTabOrder = ["index", "market", "create", "buy", "chat"];

// [하단 메뉴] 중앙 등록 버튼은 화면 전환 대신 구매글/급구 선택 시트를 부드럽게 올립니다.
export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { palette } = useTheme();
  const { unreadConversationIds } = useAppData();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sheetVisible, setSheetVisible] = useState(false);
  const sheetY = useRef(new Animated.Value(360)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const activeRoute = state.routes[state.index];
  const nestedState = activeRoute.state as { index?: number; routes?: { name: string }[] } | undefined;
  const focusedNestedRoute = nestedState?.routes?.[nestedState.index ?? nestedState.routes.length - 1];
  if (activeRoute.name === "chat" && focusedNestedRoute && focusedNestedRoute.name !== "index") return null;

  const chatBadge = unreadConversationIds.size;

  function openRegisterSheet() {
    setSheetVisible(true);
    sheetY.setValue(360);
    backdropOpacity.setValue(0);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(sheetY, { toValue: 0, speed: 18, bounciness: 6, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  }

  function closeRegisterSheet(afterClose?: () => void) {
    Animated.parallel([
      Animated.timing(sheetY, { toValue: 360, duration: 180, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setSheetVisible(false);
      afterClose?.();
    });
  }

  function choosePostType(type: "buy" | "urgent") {
    closeRegisterSheet(() => router.push({ pathname: "/create", params: { type } }));
  }

  return (
    <>
      <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={[styles.bar, { backgroundColor: `${palette.white}f2`, borderColor: palette.line }]}>
          {visibleTabOrder.map((name) => {
            const routeIndex = state.routes.findIndex((route) => route.name === name);
            if (routeIndex === -1) return null;
            const route = state.routes[routeIndex];
            const focused = state.index === routeIndex;
            const config = tabConfig[name] ?? { label: name, icon: "•" };
            const badge = name === "chat" ? chatBadge : 0;
            const isWrite = name === "create";

            function onPress() {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }

            if (isWrite) {
              return (
                <MotionPressable key={route.key} onPress={openRegisterSheet} haptic="medium" pressedScale={0.9} style={styles.writeButton} accessibilityLabel="등록 메뉴 열기">
                  <View style={[styles.writeCircle, { backgroundColor: palette.lime }]}>
                    <Text style={styles.writeIcon}>{config.icon}</Text>
                  </View>
                  <Text style={[styles.label, { color: sheetVisible ? palette.lime : palette.muted }]}>{config.label}</Text>
                </MotionPressable>
              );
            }

            return (
              <MotionPressable key={route.key} onPress={onPress} style={[styles.tabButton, focused && { backgroundColor: `${palette.blue}88` }]} accessibilityLabel={`${config.label} 탭`}>
                <View>
                  <Text style={[styles.icon, { color: focused ? palette.lime : palette.muted }]}>{config.icon}</Text>
                  {badge > 0 && <View style={[styles.badge, { backgroundColor: palette.orange }]}><Text style={styles.badgeText}>{badge}</Text></View>}
                </View>
                <Text style={[styles.label, { color: focused ? palette.ink : palette.muted }]}>{config.label}</Text>
              </MotionPressable>
            );
          })}
        </View>
      </View>

      <Modal transparent visible={sheetVisible} animationType="none" onRequestClose={() => closeRegisterSheet()}>
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <MotionPressable haptic="none" pressedScale={1} onPress={() => closeRegisterSheet()} style={StyleSheet.absoluteFill} accessibilityLabel="등록 메뉴 닫기" />
          </Animated.View>
          <Animated.View style={[styles.sheet, { backgroundColor: palette.paper, transform: [{ translateY: sheetY }], paddingBottom: Math.max(insets.bottom, 18) }]}>
            <View style={[styles.handle, { backgroundColor: palette.line }]} />
            <Text style={[styles.sheetTitle, { color: palette.ink }]}>무엇을 등록할까요?</Text>
            <Text style={[styles.sheetBody, { color: palette.muted }]}>원하는 거래 방식에 맞는 글을 선택하세요.</Text>
            <View style={styles.sheetOptions}>
              <MotionPressable haptic="light" onPress={() => choosePostType("buy")} style={[styles.sheetOption, { backgroundColor: palette.white, borderColor: palette.line }]}>
                <View style={[styles.optionIcon, { backgroundColor: palette.blue }]}><Text style={{ color: palette.lime, fontSize: 20, fontWeight: "900" }}>⌕</Text></View>
                <View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: palette.ink }]}>구매글 등록</Text><Text style={[styles.optionBody, { color: palette.muted }]}>찾는 물건을 올리고 판매 제안을 받아요.</Text></View>
                <Text style={{ color: palette.muted, fontSize: 20 }}>›</Text>
              </MotionPressable>
              <MotionPressable haptic="light" onPress={() => choosePostType("urgent")} style={[styles.sheetOption, { backgroundColor: `${palette.orange}0d`, borderColor: `${palette.orange}55` }]}>
                <View style={[styles.optionIcon, { backgroundColor: `${palette.orange}18` }]}><Text style={{ color: palette.orange, fontSize: 20, fontWeight: "900" }}>ϟ</Text></View>
                <View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: palette.ink }]}>급구 등록</Text><Text style={[styles.optionBody, { color: palette.muted }]}>사람·심부름·현장 도움을 빠르게 구해요.</Text></View>
                <Text style={{ color: palette.muted, fontSize: 20 }}>›</Text>
              </MotionPressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center" },
  bar: { flexDirection: "row", alignItems: "center", width: "92%", maxWidth: 420, height: 66, borderRadius: 25, borderWidth: 1, paddingHorizontal: 6, shadowColor: "#271f30", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, height: 54, borderRadius: 18, marginHorizontal: 2 },
  icon: { fontSize: 17, textAlign: "center" },
  label: { fontSize: 9, fontWeight: "700" },
  badge: { position: "absolute", top: -4, right: -8, minWidth: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "white", fontSize: 8, fontWeight: "700" },
  writeButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, marginTop: -14 },
  writeCircle: { width: 45, height: 45, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: "#271f30", shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.24, shadowRadius: 12, elevation: 7 },
  writeIcon: { color: "white", fontSize: 20, fontWeight: "700" },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(31,25,35,0.42)" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, shadowColor: "#201a24", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 18 },
  handle: { alignSelf: "center", width: 38, height: 4, borderRadius: 2, marginBottom: 18 },
  sheetTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.4 },
  sheetBody: { fontSize: 11, marginTop: 5 },
  sheetOptions: { gap: 10, marginTop: 18 },
  sheetOption: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 82, borderWidth: 1, borderRadius: 19, padding: 14 },
  optionIcon: { width: 45, height: 45, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  optionTitle: { fontSize: 14, fontWeight: "900" },
  optionBody: { fontSize: 9, lineHeight: 14, marginTop: 4 },
});
