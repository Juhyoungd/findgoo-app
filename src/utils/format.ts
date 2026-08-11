// [금액 표시]
export function won(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value) + "원";
}

// [임시 식별자]
export function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

// [상대 시간 표시] DB의 timestamptz를 "방금 전 / N분 전 / N일 전" 같은 문구로 바꿉니다.
export function timeAgo(isoString: string) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(isoString).toLocaleDateString("ko-KR");
}
