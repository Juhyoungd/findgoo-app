import { StyleSheet, View } from "react-native";
import { useTheme } from "@/src/theme/ThemeContext";

// [화면 배경] 로그인/아이디 찾기/회원가입/홈이 공유하는 그라데이션 블롭 배경. 화면 전체에 깔려야
// 카드 안에 갇힌 것처럼 작아 보이지 않으므로, 화면 최상위(SafeAreaView) 바로 아래에서 렌더링합니다.
export function BackgroundBlobs() {
  const { activeTheme } = useTheme();
  return (
    <>
      <View style={[styles.blob, styles.blobTopRight, { backgroundColor: activeTheme.colors[1] }]} pointerEvents="none" />
      <View style={[styles.blob, styles.blobBottomLeft, { backgroundColor: activeTheme.colors[2] }]} pointerEvents="none" />
    </>
  );
}

const styles = StyleSheet.create({
  blob: { position: "absolute", width: 260, height: 260, borderRadius: 130, opacity: 0.4 },
  blobTopRight: { top: -100, right: -80 },
  blobBottomLeft: { bottom: -120, left: -90 },
});
