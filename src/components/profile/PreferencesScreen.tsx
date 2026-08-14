import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { DetailScaffold } from "@/src/components/common/DetailScaffold";
import { MotionPressable } from "@/src/components/common/MotionPressable";
import { categories } from "@/src/constants/feature-spec";
import { defaultPreferences, loadPreferences, savePreferences } from "@/src/services/preferenceService";
import { useAuth } from "@/src/state/AuthContext";
import { useToast } from "@/src/state/ToastContext";
import { useTheme } from "@/src/theme/ThemeContext";

// [관심 설정] 카테고리·키워드를 계정에 저장하고 새 글 DB 트리거의 푸시 알림 조건으로 사용합니다.
export function PreferencesScreen() {
  const { palette } = useTheme();
  const { session } = useAuth();
  const { showToast } = useToast();
  const [selected, setSelected] = useState(defaultPreferences.categories);
  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState(defaultPreferences.keywords);
  const [pushEnabled, setPushEnabled] = useState(defaultPreferences.pushEnabled);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    loadPreferences(session?.user.id)
      .then(({ preferences, error }) => {
        if (!active) return;
        setSelected(preferences.categories);
        setKeywords(preferences.keywords);
        setPushEnabled(preferences.pushEnabled);
        if (error) showToast("관심 설정을 불러오지 못해 기본값을 표시했어요.");
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [session?.user.id, showToast]);

  function addKeyword() {
    const value = keyword.trim().replace(/\s+/g, " ");
    if (value.length < 2) return showToast("키워드는 2자 이상 입력해주세요.");
    if (value.length > 30) return showToast("키워드는 30자 이하로 입력해주세요.");
    if (keywords.some((item) => item.toLocaleLowerCase("ko-KR") === value.toLocaleLowerCase("ko-KR"))) return showToast("이미 등록된 키워드예요.");
    if (keywords.length >= 10) return showToast("키워드는 최대 10개까지 등록할 수 있어요.");
    setKeywords([...keywords, value]);
    setKeyword("");
  }

  async function save() {
    if (selected.length === 0) return showToast("관심 카테고리를 1개 이상 선택해주세요.");
    setSaving(true);
    const { error } = await savePreferences(session?.user.id, { categories: selected, keywords, pushEnabled });
    setSaving(false);
    if (error) return showToast(error);
    showToast("관심 설정과 키워드 알림을 저장했어요.");
  }

  if (loading) return <DetailScaffold title="관심 설정" eyebrow="PREFERENCES"><ActivityIndicator color={palette.lime} /></DetailScaffold>;

  return (
    <DetailScaffold title="관심 설정" eyebrow="PREFERENCES">
      <View style={styles.section}>
        <Text style={[styles.title, { color: palette.ink }]}>관심 카테고리</Text>
        <Text style={[styles.caption, { color: palette.muted }]}>홈과 목록 추천 순서에 반영돼요.</Text>
        <View style={styles.chips}>{categories.filter((item) => item !== "전체").map((item) => {
          const active = selected.includes(item);
          return <MotionPressable key={item} onPress={() => setSelected(active ? selected.filter((value) => value !== item) : [...selected, item])} style={[styles.chip, { backgroundColor: active ? palette.lime : palette.white, borderColor: active ? palette.lime : palette.line }]}><Text style={{ color: active ? "white" : palette.muted, fontSize: 10, fontWeight: "800" }}>{item}</Text></MotionPressable>;
        })}</View>
      </View>

      <View style={styles.section}>
        <View style={styles.titleRow}><View style={{ flex: 1 }}><Text style={[styles.title, { color: palette.ink }]}>관심 키워드 알림</Text><Text style={[styles.caption, { color: palette.muted }]}>구매글이나 급구 제목·내용에 키워드가 포함되면 알려드려요.</Text></View><MotionPressable onPress={() => setPushEnabled((value) => !value)} accessibilityLabel={`키워드 푸시 알림 ${pushEnabled ? "끄기" : "켜기"}`} style={[styles.toggle, { backgroundColor: pushEnabled ? palette.lime : palette.line }]}><View style={[styles.knob, { backgroundColor: palette.white, transform: [{ translateX: pushEnabled ? 20 : 0 }] }]} /></MotionPressable></View>
        <View style={[styles.inputRow, { backgroundColor: palette.white, borderColor: palette.line }]}><TextInput value={keyword} onChangeText={setKeyword} onSubmitEditing={addKeyword} maxLength={30} placeholder="예: 아이패드, 오픈런" placeholderTextColor={palette.muted} style={[styles.input, { color: palette.ink }]} /><MotionPressable onPress={addKeyword} style={[styles.addButton, { backgroundColor: palette.ink }]}><Text style={{ color: "white", fontSize: 10, fontWeight: "900" }}>추가</Text></MotionPressable></View>
        <View style={styles.chips}>{keywords.map((item) => <MotionPressable key={item} onPress={() => setKeywords(keywords.filter((value) => value !== item))} style={[styles.keyword, { backgroundColor: palette.blue }]} accessibilityLabel={`${item} 키워드 삭제`}><Text style={{ color: palette.ink, fontSize: 10, fontWeight: "800" }}>{item}  ×</Text></MotionPressable>)}</View>
        {keywords.length === 0 && <Text style={[styles.empty, { color: palette.muted, borderColor: palette.line }]}>등록한 키워드가 없어요.</Text>}
      </View>

      <MotionPressable onPress={save} disabled={saving} haptic="medium" style={[styles.save, { backgroundColor: palette.lime, opacity: saving ? 0.65 : 1 }]}>{saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveText}>관심 설정 저장</Text>}</MotionPressable>
    </DetailScaffold>
  );
}

const styles = StyleSheet.create({ section: { gap: 10 }, titleRow: { flexDirection: "row", alignItems: "center", gap: 12 }, title: { fontSize: 15, fontWeight: "900" }, caption: { fontSize: 10, lineHeight: 15, marginTop: 2 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 }, inputRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 15, padding: 7 }, input: { flex: 1, minHeight: 38, paddingHorizontal: 8, fontSize: 12 }, addButton: { minWidth: 54, minHeight: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" }, keyword: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 }, toggle: { width: 46, height: 26, borderRadius: 13, padding: 3 }, knob: { width: 20, height: 20, borderRadius: 10 }, empty: { borderWidth: 1, borderStyle: "dashed", borderRadius: 13, padding: 14, textAlign: "center", fontSize: 10 }, save: { minHeight: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" }, saveText: { color: "white", fontSize: 12, fontWeight: "900" } });
