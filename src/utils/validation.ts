export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const koreanMobilePattern = /^01[016789]\d{7,8}$/;
export const nicknamePattern = /^[가-힣A-Za-z0-9._-]{2,12}$/;

// [이메일 형식 안내] 로그인·회원가입·비밀번호 찾기가 함께 쓰는 입력 규칙입니다.
export function isValidEmail(value: string) {
  return emailPattern.test(value.trim());
}

export function getPasswordRuleError(value: string) {
  if (value.length < 8) return "비밀번호는 8자 이상 입력해주세요.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "비밀번호에 영문과 숫자를 각각 1개 이상 포함해주세요.";
  return null;
}

export function getNameRuleError(value: string) {
  const normalized = value.trim();
  if (normalized.length < 2 || normalized.length > 30) return "이름은 2~30자로 입력해주세요.";
  if (!/^[가-힣A-Za-z\s]+$/.test(normalized)) return "이름에는 한글과 영문만 사용할 수 있어요.";
  return null;
}

export function getNicknameRuleError(value: string) {
  const normalized = value.trim();
  if (!nicknamePattern.test(normalized)) return "닉네임은 한글·영문·숫자로 2~12자까지 입력해주세요.";
  return null;
}

export function normalizeKoreanPhone(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export function toKoreanE164(value: string) {
  const normalized = normalizeKoreanPhone(value);
  return normalized.startsWith("0") ? `+82${normalized.slice(1)}` : `+82${normalized}`;
}

// [인증 오류 안내] 서버 영문 오류를 회원이 바로 이해할 수 있는 짧은 문장으로 바꿉니다.
export function getAuthErrorMessage(message: string, mode: "login" | "signup") {
  const value = message.toLowerCase();
  if (value.includes("invalid login credentials")) return "이메일 또는 비밀번호가 올바르지 않아요.";
  if (value.includes("email not confirmed")) return "이메일 인증을 먼저 완료해주세요.";
  if (value.includes("invalid") && value.includes("email")) return "이메일 주소 형식이 올바르지 않아요.";
  if (value.includes("already registered") || value.includes("already been registered")) return "이미 가입된 이메일이에요.";
  if (value.includes("password")) return "비밀번호 규격을 확인해주세요. 영문과 숫자를 포함한 8자 이상이어야 해요.";
  if (value.includes("rate limit") || value.includes("too many")) return "요청이 너무 많아요. 잠시 후 다시 시도해주세요.";
  if (value.includes("network") || value.includes("fetch")) return "네트워크 연결을 확인하고 다시 시도해주세요.";
  return mode === "login" ? "로그인할 수 없어요. 입력 정보를 다시 확인해주세요." : "가입할 수 없어요. 입력 정보를 다시 확인해주세요.";
}
