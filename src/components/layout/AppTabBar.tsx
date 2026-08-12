import { useRef, useState } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Animated, Modal, Platform, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appIcons, type AppIconName } from "@/src/assets/app-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";

const tabConfig: Record<string, { label: string; icon: AppIconName }> = {
  index: { label: "홈", icon: appIcons.home },
  market: { label: "급구", icon: appIcons.urgent },
  create: { label: "등록", icon: appIcons.create },
  buy: { label: "구매글", icon: appIcons.buy },
  chat: { label: "채팅", icon: appIcons.chat },
};

const visibleTabOrder = ["index", "market", "create", "buy", "chat"];
const useNativeDriver = Platform.OS !== "web";

// [하단 메뉴] 중앙 등록 버튼은 화면 전환 대신 구매글/급구 선택 시트를 부드럽게 올립니다.
export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { palette } = useTheme();
  const { unreadConversationIds, activeConversationId } = useAppData();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sheetVisible, setSheetVisible] = useState(false);
  const sheetY = useRef(new Animated.Value(360)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // 채팅방 화면(app/(tabs)/chat/[conversationId].tsx)이 열려있는 동안은 activeConversationId가
  // 채워져요. 중첩 네비게이션 state를 직접 들여다보는 방식은 기기별로 값이 늦게 채워지거나
  // 모양이 달라서 탭바가 안 숨겨지는 경우가 있었어요 — 이 값이 훨씬 안정적입니다.
  const activeRoute = state.routes[state.index];
  if (activeRoute.name === "chat" && activeConversationId) return null;

  const chatBadge = unreadConversationIds.size;

  function openRegisterSheet() {
    setSheetVisible(true);
    sheetY.setValue(360);
    backdropOpacity.setValue(0);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(sheetY, { toValue: 0, speed: 18, bounciness: 6, useNativeDriver }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 180, useNativeDriver }),
      ]).start();
    });
  }

  function closeRegisterSheet(afterClose?: () => void) {
    Animated.parallel([
      Animated.timing(sheetY, { toValue: 360, duration: 180, useNativeDriver }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 160, useNativeDriver }),
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
      <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10), pointerEvents: "box-none" }]}>
        <View style={[styles.bar, { backgroundColor: `${palette.white}f2`, borderColor: palette.line }]}>
          {visibleTabOrder.map((name) => {
            const routeIndex = state.routes.findIndex((route) => route.name === name);
            if (routeIndex === -1) return null;
            const route = state.routes[routeIndex];
            const focused = state.index === routeIndex;
            const config = tabConfig[name] ?? { label: name, icon: appIcons.home };
            const badge = name === "chat" ? chatBadge : 0;
            const isWrite = name === "create";

            function onPress() {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }

            if (isWrite) {
              return (
                <MotionPressable key={route.key} onPress={openRegisterSheet} haptic="medium" pressedScale={0.9} style={styles.writeButton} accessibilityLabel="등록 메뉴 열기">
                  <View style={[styles.writeCircle, { backgroundColor: palette.lime, borderColor: palette.lime }, Platform.OS === "web" ? { boxShadow: `0 6px 13px ${palette.limeDark}26` } : { shadowColor: palette.limeDark }]}>
                    <AppIcon name={config.icon} color={palette.white} size={24} />
                  </View>
                  <Text style={[styles.label, { color: sheetVisible ? palette.lime : palette.muted }]}>{config.label}</Text>
                </MotionPressable>
              );
            }

            return (
              <MotionPressable key={route.key} onPress={onPress} style={[styles.tabButton, focused && { backgroundColor: `${palette.lime}12` }]} accessibilityLabel={`${config.label} 탭`}>
                <View style={styles.iconSlot}>
                  <AppIcon name={config.icon} color={focused ? palette.lime : palette.muted} size={20} />
                  {badge > 0 && <View style={[styles.badge, { backgroundColor: palette.orange }]}><Text style={styles.badgeText}>{badge}</Text></View>}
                </View>
                <Text style={[styles.label, { color: focused ? palette.ink : palette.muted }]}>{config.label}</Text>
                <View style={[styles.activeIndicator, { backgroundColor: palette.lime, opacity: focused ? 1 : 0 }]} />
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
                <View style={[styles.optionIcon, { borderColor: palette.line }]}><AppIcon name={appIcons.buy} color={palette.ink} size={22} /></View>
                <View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: palette.ink }]}>구매글 등록</Text><Text style={[styles.optionBody, { color: palette.muted }]}>찾는 물건을 올리고 판매 제안을 받아요.</Text></View>
                <Text style={{ color: palette.muted, fontSize: 20 }}>›</Text>
              </MotionPressable>
              <MotionPressable haptic="light" onPress={() => choosePostType("urgent")} style={[styles.sheetOption, { backgroundColor: palette.white, borderColor: palette.line }]}>
                <View style={[styles.optionIcon, { borderColor: palette.line }]}><AppIcon name={appIcons.urgent} color={palette.ink} size={22} /></View>
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
  bar: { flexDirection: "row", alignItems: "center", width: "92%", maxWidth: 420, height: 68, borderRadius: 30, borderWidth: 1, paddingHorizontal: 7, elevation: 8, ...Platform.select({ web: { boxShadow: "0 9px 22px rgba(39,31,48,0.12)" }, default: { shadowColor: "#271f30", shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.12, shadowRadius: 22 } }) },
  tabButton: { position: "relative", flex: 1, alignItems: "center", justifyContent: "center", gap: 3, height: 52, borderRadius: 20, marginHorizontal: 2 },
  iconSlot: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  activeIndicator: { position: "absolute", bottom: 2, width: 14, height: 2, borderRadius: 999 },
  label: { fontSize: 9, fontWeight: "700" },
  badge: { position: "absolute", top: -4, right: -8, minWidth: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "white", fontSize: 8, fontWeight: "700" },
  writeButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, marginTop: -14 },
  writeCircle: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: "center", justifyContent: "center", elevation: 5, ...Platform.select({ web: {}, default: { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 13 } }) },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(31,25,35,0.42)" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, elevation: 18, ...Platform.select({ web: { boxShadow: "0 -8px 24px rgba(32,26,36,0.18)" }, default: { shadowColor: "#201a24", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.18, shadowRadius: 24 } }) },
  handle: { alignSelf: "center", width: 38, height: 4, borderRadius: 2, marginBottom: 18 },
  sheetTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.4 },
  sheetBody: { fontSize: 11, marginTop: 5 },
  sheetOptions: { gap: 10, marginTop: 18 },
  sheetOption: { flexDirection: "row", alignItems: "center", gap: 13, minHeight: 86, borderWidth: 1, borderRadius: 22, padding: 15 },
  optionIcon: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  optionTitle: { fontSize: 14, fontWeight: "800" },
  optionBody: { fontSize: 10, lineHeight: 15, marginTop: 4 },
});
