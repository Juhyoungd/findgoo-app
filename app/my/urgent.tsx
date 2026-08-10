import { MyCollectionScreen } from "@/src/components/my/MyCollectionScreen";

// [급구] 마이페이지에서 작성한 급구만 보여주는 화면
export default function MyUrgentScreen() {
  return <MyCollectionScreen kind="urgent" />;
}
