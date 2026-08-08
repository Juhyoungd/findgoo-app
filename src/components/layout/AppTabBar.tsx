import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appIcons } from "@/src/assets/app-icons";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";

const tabConfig: Record<string, { label: string; icon: string }> = {
  index: { label: "홈", icon: appIcons.home },
  market: { label: "급구", icon: appIcons.urgent },
  create: { label: "등록", icon: appIcons.create },
  buy: { label: "구매글", icon: appIcons.buy },
  chat: { label: "채팅", icon: appIcons.chat },
};

// 마이페이지는 탭바 버튼 없이 헤더 프로필/홈 바로가기로만 진입하므로, 탭바에는 이 순서만 노출합니다.
const visibleTabOrder = ["index", "market", "create", "buy", "chat"];

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { palette } = useTheme();
  const { messages } = useAppData();
  const insets = useSafeAreaInsets();

  // 채팅 탭 안에서 채팅방([postId])까지 들어간 상태면, 하단 입력창과 겹치지 않도록 탭바를 숨깁니다.
  // 목록(index)에서 이동해 들어간 경우와 딥링크로 채팅방에 곧장 들어간 경우 둘 다 감지해야 하므로
  // 스택의 현재 인덱스가 아니라 "현재 포커스된 화면 이름"으로 판단합니다.
  const activeRoute = state.routes[state.index];
  const nestedState = activeRoute.state as { index?: number; routes?: { name: string }[] } | undefined;
  const focusedNestedRoute = nestedState?.routes?.[nestedState.index ?? nestedState.routes.length - 1];
  if (activeRoute.name === "chat" && focusedNestedRoute && focusedNestedRoute.name !== "index") return null;

  const chatBadge = new Set(messages.map((message) => message.postId)).size;
  const badgeByRoute: Record<string, number> = { chat: chatBadge };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.bar, { backgroundColor: `${palette.white}e8`, borderColor: palette.line }]}>
        {visibleTabOrder.map((name) => {
          const routeIndex = state.routes.findIndex((route) => route.name === name);
          if (routeIndex === -1) return null;
          const route = state.routes[routeIndex];
          const focused = state.index === routeIndex;
          const config = tabConfig[name] ?? { label: name, icon: "•" };
          const badge = badgeByRoute[name] ?? 0;
          const isWrite = name === "create";

          function onPress() {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          }

          if (isWrite) {
            return (
              <Pressable key={route.key} onPress={onPress} style={styles.writeButton}>
                <View style={[styles.writeCircle, { backgroundColor: palette.lime }]}>
                  <Text style={styles.writeIcon}>{config.icon}</Text>
                </View>
                <Text style={[styles.label, { color: focused ? palette.ink : palette.muted }]}>{config.label}</Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tabButton, focused && { backgroundColor: `${palette.blue}88` }]}
            >
              <View>
                <Text style={[styles.icon, { color: focused ? palette.lime : palette.muted }]}>{config.icon}</Text>
                {badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: palette.orange }]}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, { color: focused ? palette.ink : palette.muted }]}>{config.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center" },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    width: "92%",
    maxWidth: 420,
    height: 66,
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 6,
    shadowColor: "#271f30",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, height: 54, borderRadius: 18, marginHorizontal: 2 },
  icon: { fontSize: 17, textAlign: "center" },
  label: { fontSize: 9, fontWeight: "700" },
  badge: { position: "absolute", top: -4, right: -8, minWidth: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "white", fontSize: 8, fontWeight: "700" },
  writeButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, marginTop: -14 },
  writeCircle: { width: 43, height: 43, borderRadius: 17, alignItems: "center", justifyContent: "center", shadowColor: "#2f6fed", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  writeIcon: { color: "white", fontSize: 20, fontWeight: "700" },
});
