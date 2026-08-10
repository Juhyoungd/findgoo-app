import { useState, type ReactNode } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { categories, regions } from "@/src/constants/feature-spec";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { MotionPressable as Pressable } from "@/src/components/common/MotionPressable";
import { useAppData } from "@/src/state/AppDataContext";
import { useTheme } from "@/src/theme/ThemeContext";
import type { PostType } from "@/src/types/findgoo";

const postableCategories = categories.slice(1);

// [구매글 작성] + [급구 작성] 웹 PostEditorModal의 RN 버전 (모달 대신 탭 화면)
export default function CreateScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { region, addPost } = useAppData();

  const [type, setType] = useState<PostType>(params.type === "buy" ? "buy" : "urgent");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(type === "urgent" ? "심부름" : "디지털");
  const [postRegion, setPostRegion] = useState(region);
  const [price, setPrice] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");

  function changeType(next: PostType) {
    setType(next);
    setCategory(next === "urgent" ? "심부름" : "디지털");
  }

  function submit() {
    const priceValue = Number(price);
    if (!title.trim()) return Alert.alert("제목을 입력해주세요");
    if (!priceValue || priceValue < 1000) return Alert.alert("가격을 1,000원 이상 입력해주세요");
    if (description.trim().length < 10) return Alert.alert("상세 내용을 10자 이상 입력해주세요");

    addPost({
      type,
      category,
      title: title.trim(),
      description: description.trim(),
      price: priceValue,
      region: postRegion,
      deadline: type === "urgent" && deadline.trim() ? deadline.trim() : undefined,
    });

    setTitle("");
    setPrice("");
    setDeadline("");
    setDescription("");
    Alert.alert("등록 완료", "베타 글이 등록됐어요.");
    router.push(type === "buy" ? "/buy" : "/market");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <AppHeader />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.heading, { color: palette.ink }]}>{type === "buy" ? "구매글 작성" : "급구 작성"}</Text>

          <View style={[styles.typeSwitch, { backgroundColor: palette.line }]}>
            <Pressable onPress={() => changeType("buy")} style={[styles.typeButton, type === "buy" && { backgroundColor: palette.white }]}>
              <Text style={{ color: type === "buy" ? palette.ink : palette.muted, fontWeight: "600" }}>구매해요</Text>
            </Pressable>
            <Pressable onPress={() => changeType("urgent")} style={[styles.typeButton, type === "urgent" && { backgroundColor: palette.white }]}>
              <Text style={{ color: type === "urgent" ? palette.ink : palette.muted, fontWeight: "600" }}>급구</Text>
            </Pressable>
          </View>

          <Field label="제목">
            <TextInput
              value={title}
              onChangeText={setTitle}
              maxLength={80}
              placeholder="무엇을 찾고 있나요?"
              placeholderTextColor={palette.muted}
              style={[styles.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.white }]}
            />
          </Field>

          <Field label="카테고리">
            <ChipRow options={postableCategories} value={category} onChange={setCategory} palette={palette} />
          </Field>

          <Field label="동네">
            <ChipRow options={regions} value={postRegion} onChange={setPostRegion} palette={palette} />
          </Field>

          <Field label={type === "buy" ? "희망 가격" : "지원 금액"}>
            <View style={[styles.priceRow, { borderColor: palette.line, backgroundColor: palette.white }]}>
              <TextInput
                value={price}
                onChangeText={(value) => setPrice(value.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder="10000"
                placeholderTextColor={palette.muted}
                style={[styles.priceInput, { color: palette.ink }]}
              />
              <Text style={{ color: palette.muted }}>원</Text>
            </View>
          </Field>

          {type === "urgent" && (
            <Field label="필요 시간">
              <TextInput
                value={deadline}
                onChangeText={setDeadline}
                placeholder="예: 오늘 18:00"
                placeholderTextColor={palette.muted}
                style={[styles.input, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.white }]}
              />
            </Field>
          )}

          <Field label="상세 내용">
            <TextInput
              value={description}
              onChangeText={setDescription}
              maxLength={1200}
              multiline
              numberOfLines={5}
              placeholder="조건과 거래 방법을 구체적으로 적어주세요."
              placeholderTextColor={palette.muted}
              style={[styles.textarea, { color: palette.ink, borderColor: palette.line, backgroundColor: palette.white }]}
            />
          </Field>

          <View style={[styles.safeTip, { backgroundColor: palette.blue }]}>
            <Text style={{ color: palette.ink, fontSize: 12 }}>
              <Text style={{ fontWeight: "700" }}>베타 체험 안내{"\n"}</Text>
              실제 연락처, 계좌번호, 민감한 개인정보는 입력하지 마세요.
            </Text>
          </View>

          <Pressable onPress={submit} style={[styles.submit, { backgroundColor: palette.lime }]}>
            <Text style={{ color: palette.white, fontWeight: "700", fontSize: 15 }}>글 등록하기</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const { palette } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: palette.muted }]}>{label}</Text>
      {children}
    </View>
  );
}

function ChipRow({ options, value, onChange, palette }: { options: readonly string[]; value: string; onChange: (value: string) => void; palette: ReturnType<typeof useTheme>["palette"] }) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => (
        <Pressable key={option} onPress={() => onChange(option)} style={[styles.chip, { borderColor: palette.line, backgroundColor: value === option ? palette.ink : palette.white }]}>
          <Text style={{ color: value === option ? palette.white : palette.muted, fontSize: 12 }}>{option}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 120, gap: 4 },
  heading: { fontSize: 20, fontWeight: "800", marginBottom: 16 },
  typeSwitch: { flexDirection: "row", borderRadius: 9, padding: 3, marginBottom: 20, alignSelf: "flex-start" },
  typeButton: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 7 },
  field: { marginBottom: 18, gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textarea: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 110, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14 },
  priceInput: { flex: 1, paddingVertical: 12, fontSize: 14 },
  safeTip: { borderRadius: 12, padding: 12, marginBottom: 20 },
  submit: { borderRadius: 12, paddingVertical: 15, alignItems: "center" },
});
