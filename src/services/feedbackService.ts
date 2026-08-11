import AsyncStorage from "@react-native-async-storage/async-storage";

export type FeedbackCategory = "기술 오류" | "기능 제안" | "UI·사용성" | "기타";
export type FeedbackSubmission = {
  id: string;
  category: FeedbackCategory;
  title: string;
  body: string;
  createdAt: string;
};

const STORAGE_KEY = "@findgoo/member-feedback";

// [기술·개선사항 보내기] 베타에서는 기기에 안전하게 보관하고, 추후 API 교체 지점을 이 파일로 한정합니다.
export async function saveFeedback(input: Omit<FeedbackSubmission, "id" | "createdAt">) {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const submissions: FeedbackSubmission[] = stored ? JSON.parse(stored) : [];
  const submission: FeedbackSubmission = { ...input, id: `feedback-${Date.now()}`, createdAt: new Date().toISOString() };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([submission, ...submissions].slice(0, 50)));
  return submission;
}
