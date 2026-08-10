import { MyCollectionScreen } from "@/src/components/my/MyCollectionScreen";

// [찜한 글] 구매글과 급구에서 찜한 글을 한곳에 보여주는 화면
export default function MySavedScreen() {
  return <MyCollectionScreen kind="saved" />;
}
