import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";
import { DetailScaffold } from "@/src/components/common/DetailScaffold";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import {
  findNearestServiceRegion,
  findRegionFromAddress,
  serviceRegionGroups,
  serviceRegions,
  type ServiceCity,
} from "@/src/constants/regions";
import { useAppData } from "@/src/state/AppDataContext";
import { useToast } from "@/src/state/ToastContext";
import { useTheme } from "@/src/theme/ThemeContext";

const cityOptions: readonly ServiceCity[] = ["대전", "세종"];

// [활동 지역] 대전은 구별 전체 동, 세종은 동·읍·면을 검색하고 최대 3곳까지 선택합니다.
export function RegionSettingsScreen() {
  const { palette } = useTheme();
  const { selectedRegions, setSelectedRegions } = useAppData();
  const { showToast } = useToast();
  const initialCity: ServiceCity = selectedRegions[0]?.startsWith("세종") ? "세종" : "대전";
  const [activeCity, setActiveCity] = useState<ServiceCity>(initialCity);
  const [expandedGroup, setExpandedGroup] = useState(`${initialCity}|${initialCity === "대전" ? "유성구" : "동 지역"}`);
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [draftRegions, setDraftRegions] = useState(selectedRegions);
  const isDirty = draftRegions.join("|") !== selectedRegions.join("|");

  const groups = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ko-KR");
    return serviceRegionGroups
      .filter((group) => group.city === activeCity)
      .map((group) => ({
        ...group,
        areas: keyword
          ? group.areas.filter((area) => `${group.city} ${group.district} ${area}`.toLocaleLowerCase("ko-KR").includes(keyword))
          : group.areas,
      }))
      .filter((group) => group.areas.length > 0);
  }, [activeCity, query]);

  function selectCity(city: ServiceCity) {
    setActiveCity(city);
    setQuery("");
    const firstGroup = serviceRegionGroups.find((group) => group.city === city);
    if (firstGroup) setExpandedGroup(`${city}|${firstGroup.district}`);
  }

  function toggleRegion(label: string) {
    if (draftRegions.includes(label)) {
      if (draftRegions.length === 1) return Alert.alert("활동 지역", "활동 지역은 최소 1곳이 필요해요.");
      setDraftRegions(draftRegions.filter((item) => item !== label));
      return;
    }
    if (draftRegions.length >= 3) return Alert.alert("최대 3곳", "활동 지역은 최대 3곳까지 설정할 수 있어요.");
    setDraftRegions([...draftRegions, label]);
  }

  function applyRegions() {
    if (!isDirty) return;
    setSelectedRegions(draftRegions);
    showToast("활동 지역을 저장했어요.");
  }

  async function useCurrentLocation() {
    try {
      setLocating(true);
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) return Alert.alert("위치 서비스가 꺼져 있어요", "기기의 위치 서비스를 켠 뒤 다시 시도해주세요.", [{ text: "확인" }]);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        if (!permission.canAskAgain) return Alert.alert("위치 권한이 차단됐어요", "기기 설정에서 찾구의 위치 권한을 허용해주세요.", [{ text: "취소", style: "cancel" }, { text: "설정 열기", onPress: () => Linking.openSettings() }]);
        return Alert.alert("위치 권한 필요", "현재 위치로 지역을 찾으려면 위치 권한을 허용해주세요.");
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      if (latitude < 36.15 || latitude > 36.72 || longitude < 127.03 || longitude > 127.58) {
        return Alert.alert("서비스 지역 밖이에요", "현재 베타는 대전·세종만 지원합니다. 아래에서 활동 지역을 직접 선택해주세요.");
      }

      let matchedRegion = null;
      if (Platform.OS !== "web") {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address) matchedRegion = findRegionFromAddress(address);
      }
      const nearest = matchedRegion ?? findNearestServiceRegion(latitude, longitude);
      setDraftRegions([nearest.label, ...draftRegions.filter((item) => item !== nearest.label)].slice(0, 3));
      setActiveCity(nearest.city);
      setExpandedGroup(`${nearest.city}|${nearest.district}`);
      showToast(`${nearest.label}을 선택했어요. 적용하기를 눌러 저장하세요.`);
    } catch (error) {
      const message = error instanceof Error && error.message.toLowerCase().includes("timeout") ? "위치 확인 시간이 초과됐어요. GPS 신호가 잘 잡히는 곳에서 다시 시도해주세요." : "인터넷과 GPS 상태를 확인하거나 지역을 직접 선택해주세요.";
      Alert.alert("위치를 확인하지 못했어요", message);
    } finally {
      setLocating(false);
    }
  }

  return (
    <DetailScaffold
      title="활동 지역"
      eyebrow="REGION"
      footer={
        <MotionPressable
          onPress={applyRegions}
          disabled={!isDirty}
          haptic="medium"
          style={[styles.applyButton, { backgroundColor: isDirty ? palette.lime : palette.blue, opacity: isDirty ? 1 : 0.72 }]}
          accessibilityLabel={isDirty ? "선택한 활동 지역 적용하기" : "활동 지역 적용 완료"}
        >
          <Text style={[styles.applyText, { color: isDirty ? palette.white : palette.ink }]}>{isDirty ? "적용하기" : "✓ 적용 완료"}</Text>
        </MotionPressable>
      }
    >
      <View style={[styles.summary, { backgroundColor: palette.white, borderColor: palette.line }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.summaryTitle, { color: palette.ink }]}>선택한 지역 {draftRegions.length}/3</Text>
          <Text style={[styles.summaryBody, { color: palette.muted }]}>{isDirty ? "변경 내용은 적용하기를 눌러야 저장돼요." : "저장된 지역이 홈과 새 글에 적용되고 있어요."}</Text>
        </View>
        <MotionPressable onPress={useCurrentLocation} disabled={locating} haptic="medium" style={[styles.gpsButton, { backgroundColor: palette.lime }]} accessibilityLabel="GPS로 가까운 지역 찾기">
          {locating ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.gpsText}>GPS 찾기</Text>}
        </MotionPressable>
      </View>

      <View style={styles.selectedWrap}>
        {draftRegions.map((item, index) => (
          <MotionPressable key={item} onPress={() => toggleRegion(item)} style={[styles.selectedChip, { backgroundColor: index === 0 ? palette.ink : palette.blue }]} accessibilityLabel={`${item} 선택 해제`}>
            <Text style={{ color: index === 0 ? "white" : palette.ink, fontSize: 9, fontWeight: "800" }}>{index === 0 ? "대표 · " : ""}{item} ×</Text>
          </MotionPressable>
        ))}
      </View>

      <View style={[styles.cityTabs, { backgroundColor: palette.white, borderColor: palette.line }]}>
        {cityOptions.map((city) => {
          const active = city === activeCity;
          const count = serviceRegions.filter((region) => region.city === city).length;
          return (
            <MotionPressable key={city} onPress={() => selectCity(city)} style={[styles.cityTab, active && { backgroundColor: palette.lime }]} accessibilityLabel={`${city} 지역 보기`}>
              <Text style={{ color: active ? palette.white : palette.ink, fontSize: 13, fontWeight: "900" }}>{city}</Text>
              <Text style={{ color: active ? `${palette.white}cc` : palette.muted, fontSize: 9 }}>{count}곳</Text>
            </MotionPressable>
          );
        })}
      </View>

      <View style={[styles.searchShell, { backgroundColor: palette.white, borderColor: palette.line }]}>
        <Text style={[styles.searchIcon, { color: palette.muted }]}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={activeCity === "대전" ? "구 또는 동 이름 검색" : "동·읍·면 이름 검색"}
          placeholderTextColor={palette.muted}
          style={[styles.searchInput, { color: palette.ink }]}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <MotionPressable onPress={() => setQuery("")} style={styles.clearButton} accessibilityLabel="지역 검색어 지우기">
            <Text style={{ color: palette.muted, fontSize: 15 }}>×</Text>
          </MotionPressable>
        )}
      </View>

      {groups.map((group) => {
        const key = `${group.city}|${group.district}`;
        const open = query.trim().length > 0 || expandedGroup === key;
        const regionItems = serviceRegions.filter((item) => item.city === group.city && item.district === group.district && group.areas.includes(item.dong));
        const selectedCount = regionItems.filter((item) => draftRegions.includes(item.label)).length;
        return (
          <View key={key} style={[styles.group, { backgroundColor: palette.white, borderColor: palette.line }]}>
            <MotionPressable onPress={() => setExpandedGroup(open ? "" : key)} style={styles.groupHeader} accessibilityLabel={`${group.district} ${open ? "접기" : "펼치기"}`}>
              <View style={{ flex: 1 }}>
                <View style={styles.groupTitleRow}>
                  <Text style={[styles.city, { color: palette.lime }]}>{group.city}</Text>
                  <Text style={[styles.district, { color: palette.ink }]}>{group.district}</Text>
                </View>
                <Text style={[styles.groupCaption, { color: palette.muted }]}>{group.areas.length}곳{selectedCount ? ` · ${selectedCount}곳 선택` : ""}</Text>
              </View>
              <Text style={[styles.chevron, { color: palette.muted, transform: [{ rotate: open ? "180deg" : "0deg" }] }]}>⌄</Text>
            </MotionPressable>

            {open && (
              <View style={[styles.dongs, { borderTopColor: palette.line }]}>
                {regionItems.map((item) => {
                  const selected = draftRegions.includes(item.label);
                  return (
                    <MotionPressable key={item.label} onPress={() => toggleRegion(item.label)} style={[styles.dong, { backgroundColor: selected ? palette.lime : palette.paper, borderColor: selected ? palette.lime : palette.line }]} accessibilityLabel={`${item.label} ${selected ? "선택 해제" : "선택"}`}>
                      <Text style={{ color: selected ? "white" : palette.muted, fontSize: 10, fontWeight: "800" }}>{item.dong}</Text>
                    </MotionPressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {groups.length === 0 && (
        <View style={[styles.empty, { backgroundColor: palette.white, borderColor: palette.line }]}>
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>검색 결과가 없어요</Text>
          <Text style={[styles.emptyBody, { color: palette.muted }]}>동 이름을 다시 확인해주세요.</Text>
        </View>
      )}
    </DetailScaffold>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 17, padding: 14 },
  summaryTitle: { fontSize: 14, fontWeight: "900" },
  summaryBody: { fontSize: 9, marginTop: 4 },
  gpsButton: { minWidth: 82, minHeight: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  gpsText: { color: "white", fontSize: 10, fontWeight: "900" },
  selectedWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  selectedChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  cityTabs: { flexDirection: "row", borderWidth: 1, borderRadius: 17, padding: 4, gap: 4 },
  cityTab: { flex: 1, minHeight: 48, borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  searchShell: { minHeight: 46, borderWidth: 1, borderRadius: 15, flexDirection: "row", alignItems: "center", paddingHorizontal: 13 },
  searchIcon: { fontSize: 18, marginRight: 7 },
  searchInput: { flex: 1, minHeight: 44, fontSize: 13, paddingVertical: 10 },
  clearButton: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  group: { borderWidth: 1, borderRadius: 17, paddingHorizontal: 14, overflow: "hidden" },
  groupHeader: { minHeight: 66, flexDirection: "row", alignItems: "center" },
  groupTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  city: { fontSize: 9, fontWeight: "900" },
  district: { fontSize: 13, fontWeight: "900" },
  groupCaption: { fontSize: 9, marginTop: 4 },
  chevron: { fontSize: 19, lineHeight: 22 },
  dongs: { flexDirection: "row", flexWrap: "wrap", gap: 7, borderTopWidth: 1, paddingTop: 12, paddingBottom: 14 },
  dong: { minWidth: 88, flexBasis: "30%", flexGrow: 1, alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 11 },
  empty: { alignItems: "center", gap: 5, borderWidth: 1, borderStyle: "dashed", borderRadius: 16, padding: 28 },
  emptyTitle: { fontSize: 13, fontWeight: "800" },
  emptyBody: { fontSize: 10 },
  applyButton: { minHeight: 50, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  applyText: { fontSize: 14, fontWeight: "900" },
});
