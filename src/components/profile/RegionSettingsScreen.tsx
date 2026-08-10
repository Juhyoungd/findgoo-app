import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { DetailScaffold } from "@/src/components/common/DetailScaffold";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { findNearestServiceRegion, serviceRegions } from "@/src/constants/regions";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";

const groups = Array.from(new Set(serviceRegions.map((item) => `${item.city}|${item.district}`)));

// [활동 지역] 대전·세종의 구/생활권과 동을 최대 3개 선택하고 GPS로 가장 가까운 지원 동을 찾습니다.
export function RegionSettingsScreen() {
  const { palette } = useTheme();
  const { selectedRegions, setSelectedRegions } = useAppData();
  const [locating, setLocating] = useState(false);

  function toggleRegion(label: string) {
    if (selectedRegions.includes(label)) {
      if (selectedRegions.length === 1) return Alert.alert("활동 지역", "활동 지역은 최소 1곳이 필요해요.");
      setSelectedRegions(selectedRegions.filter((item) => item !== label));
      return;
    }
    if (selectedRegions.length >= 3) return Alert.alert("최대 3곳", "활동 지역은 최대 3곳까지 설정할 수 있어요.");
    setSelectedRegions([...selectedRegions, label]);
  }

  async function useCurrentLocation() {
    try {
      setLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") return Alert.alert("위치 권한 필요", "현재 위치로 지역을 찾으려면 위치 권한을 허용해주세요.");
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      if (latitude < 36.15 || latitude > 36.7 || longitude < 127.05 || longitude > 127.55) {
        return Alert.alert("서비스 지역 밖이에요", "현재 베타는 대전·세종만 지원합니다. 아래에서 활동 지역을 직접 선택해주세요.");
      }
      const nearest = findNearestServiceRegion(latitude, longitude);
      setSelectedRegions([nearest.label, ...selectedRegions.filter((item) => item !== nearest.label)].slice(0, 3));
      Alert.alert("가까운 지역을 찾았어요", `${nearest.label}을 대표 활동 지역으로 설정했어요.`);
    } catch {
      Alert.alert("위치를 확인하지 못했어요", "잠시 후 다시 시도하거나 지역을 직접 선택해주세요.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <DetailScaffold title="활동 지역" eyebrow="REGION">
      <View style={[styles.summary, { backgroundColor: palette.white, borderColor: palette.line }]}>
        <View><Text style={[styles.summaryTitle, { color: palette.ink }]}>선택한 지역 {selectedRegions.length}/3</Text><Text style={[styles.summaryBody, { color: palette.muted }]}>첫 번째 지역이 홈과 새 글의 기본 지역이에요.</Text></View>
        <MotionPressable onPress={useCurrentLocation} disabled={locating} haptic="medium" style={[styles.gpsButton, { backgroundColor: palette.lime }]} accessibilityLabel="GPS로 가까운 지역 찾기">
          {locating ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.gpsText}>⌖ GPS 찾기</Text>}
        </MotionPressable>
      </View>

      <View style={styles.selectedWrap}>{selectedRegions.map((item, index) => <View key={item} style={[styles.selectedChip, { backgroundColor: index === 0 ? palette.ink : palette.blue }]}><Text style={{ color: index === 0 ? "white" : palette.ink, fontSize: 9, fontWeight: "800" }}>{index === 0 ? "대표 · " : ""}{item}</Text></View>)}</View>

      {groups.map((key) => {
        const [city, district] = key.split("|");
        const items = serviceRegions.filter((item) => item.city === city && item.district === district);
        return (
          <View key={key} style={[styles.group, { backgroundColor: palette.white, borderColor: palette.line }]}>
            <View style={styles.groupTitleRow}><Text style={[styles.city, { color: palette.lime }]}>{city}</Text><Text style={[styles.district, { color: palette.ink }]}>{district}</Text></View>
            <View style={styles.dongs}>{items.map((item) => {
              const selected = selectedRegions.includes(item.label);
              return <MotionPressable key={item.label} onPress={() => toggleRegion(item.label)} style={[styles.dong, { backgroundColor: selected ? palette.lime : palette.paper, borderColor: selected ? palette.lime : palette.line }]} accessibilityLabel={`${item.label} ${selected ? "선택 해제" : "선택"}`}><Text style={{ color: selected ? "white" : palette.muted, fontSize: 10, fontWeight: "800" }}>{item.dong}</Text></MotionPressable>;
            })}</View>
          </View>
        );
      })}
    </DetailScaffold>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 17, padding: 14 },
  summaryTitle: { fontSize: 14, fontWeight: "900" }, summaryBody: { fontSize: 9, marginTop: 4 },
  gpsButton: { marginLeft: "auto", minWidth: 86, minHeight: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 }, gpsText: { color: "white", fontSize: 10, fontWeight: "900" },
  selectedWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, selectedChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  group: { borderWidth: 1, borderRadius: 17, padding: 14, gap: 12 }, groupTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 }, city: { fontSize: 9, fontWeight: "900" }, district: { fontSize: 13, fontWeight: "900" },
  dongs: { flexDirection: "row", gap: 7 }, dong: { flex: 1, alignItems: "center", borderWidth: 1, borderRadius: 12, paddingVertical: 11 },
});
