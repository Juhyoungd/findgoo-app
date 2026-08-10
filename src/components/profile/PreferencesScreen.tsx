import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { DetailScaffold } from "@/src/components/common/DetailScaffold";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { categories } from "@/src/constants/feature-spec";
import { useTheme } from "@/src/theme/ThemeContext";

// [관심 설정] 관심 카테고리와 구매글·급구 키워드 알림을 한 화면에서 관리합니다.
export function PreferencesScreen() {
  const { palette } = useTheme();
  const [selected, setSelected] = useState(["디지털", "심부름", "명품·패션"]);
  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState(["아이패드", "오픈런", "강아지 산책", "세종 케이크"]);

  function addKeyword() {
    const value = keyword.trim();
    if (!value || keywords.includes(value)) return;
    setKeywords([...keywords, value]);
    setKeyword("");
    Alert.alert("키워드 알림", `'${value}' 글이 올라오면 알려드릴게요.`);
  }

  return (
    <DetailScaffold title="관심 설정" eyebrow="PREFERENCES">
      <View style={styles.section}><Text style={[styles.title, { color: palette.ink }]}>관심 카테고리</Text><Text style={[styles.caption, { color: palette.muted }]}>홈과 목록 추천 순서에 반영돼요.</Text><View style={styles.chips}>{categories.filter((item) => item !== "전체").map((item) => {
        const active = selected.includes(item);
        return <MotionPressable key={item} onPress={() => setSelected(active ? selected.filter((value) => value !== item) : [...selected, item])} style={[styles.chip, { backgroundColor: active ? palette.lime : palette.white, borderColor: active ? palette.lime : palette.line }]}><Text style={{ color: active ? "white" : palette.muted, fontSize: 10, fontWeight: "800" }}>{item}</Text></MotionPressable>;
      })}</View></View>
      <View style={styles.section}><Text style={[styles.title, { color: palette.ink }]}>관심 키워드 알림</Text><Text style={[styles.caption, { color: palette.muted }]}>구매글이나 급구에 키워드가 올라오면 푸시 알림을 받을 수 있어요.</Text><View style={[styles.inputRow, { backgroundColor: palette.white, borderColor: palette.line }]}><TextInput value={keyword} onChangeText={setKeyword} onSubmitEditing={addKeyword} placeholder="예: 아이패드, 오픈런" placeholderTextColor={palette.muted} style={[styles.input, { color: palette.ink }]} /><MotionPressable onPress={addKeyword} style={[styles.addButton, { backgroundColor: palette.ink }]}><Text style={{ color: "white", fontSize: 10, fontWeight: "900" }}>추가</Text></MotionPressable></View><View style={styles.chips}>{keywords.map((item) => <MotionPressable key={item} onPress={() => setKeywords(keywords.filter((value) => value !== item))} style={[styles.keyword, { backgroundColor: palette.blue }]} accessibilityLabel={`${item} 키워드 삭제`}><Text style={{ color: palette.ink, fontSize: 10, fontWeight: "800" }}>{item}  ×</Text></MotionPressable>)}</View></View>
    </DetailScaffold>
  );
}

const styles = StyleSheet.create({ section: { gap: 10 }, title: { fontSize: 15, fontWeight: "900" }, caption: { fontSize: 10, lineHeight: 15 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 }, inputRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 15, padding: 7 }, input: { flex: 1, minHeight: 38, paddingHorizontal: 8, fontSize: 12 }, addButton: { minWidth: 54, minHeight: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" }, keyword: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 } });
