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
