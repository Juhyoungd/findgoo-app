// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function allowedRedirect(value) {
  return value?.startsWith("findgoo://") ? value : "findgoo://auth/callback";
}

// 네이버 콘솔에 등록한 Callback URL과 반드시 정확히 일치해야 합니다.
// Edge Function 내부의 request.url은 공개 주소(https://.../functions/v1/naver-auth)가 아니라
// 내부적으로 재작성된 주소를 반환하므로, url.origin/url.pathname으로 계산하면 안 되고 고정값을 씁니다.
const NAVER_CALLBACK_URL = "https://nobdclxyhqiehudtfuqa.supabase.co/functions/v1/naver-auth";

// Edge Function이 직접 HTML을 응답하면 Supabase가 강제로 text/plain + CSP sandbox를 씌워서
// <script>/<meta refresh>가 실행되지 않습니다(네이버가 Referer 없는 302를 "미등록 사이트"로 거부).
// 그래서 실제 HTML로 서빙되는 GitHub Pages의 다리 페이지를 거쳐 Referer를 붙여줍니다.
// (네이버 콘솔의 서비스 URL에도 https://juhyoungd.github.io 를 등록해둬야 합니다.)
const NAVER_BRIDGE_URL = "https://juhyoungd.github.io/findgoo-app/naver-bridge.html";

// EXPO_PUBLIC_NAVER_AUTH_URL에 이 함수 URL을 설정합니다. 네이버는 Supabase 기본 provider가 아니므로
// 네이버 프로필의 이메일로 Supabase magiclink를 만든 뒤 앱 세션으로 교환합니다.
Deno.serve(async (request) => {
  const url = new URL(request.url);
  const redirectTo = allowedRedirect(url.searchParams.get("redirect_to"));
  const code = url.searchParams.get("code");

  if (!code) {
    const state = btoa(JSON.stringify({ redirectTo, nonce: crypto.randomUUID() }));
    const authorize = new URL("https://nid.naver.com/oauth2.0/authorize");
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("client_id", Deno.env.get("NAVER_CLIENT_ID"));
    authorize.searchParams.set("redirect_uri", NAVER_CALLBACK_URL);
    authorize.searchParams.set("state", state);

    const bridge = new URL(NAVER_BRIDGE_URL);
    bridge.searchParams.set("to", authorize.toString());
    return Response.redirect(bridge.toString(), 302);
  }

  let state;
  try {
    state = JSON.parse(atob(url.searchParams.get("state") || ""));
  } catch {
    return new Response("Invalid state", { status: 400 });
  }

  const tokenUrl = new URL("https://nid.naver.com/oauth2.0/token");
  tokenUrl.searchParams.set("grant_type", "authorization_code");
  tokenUrl.searchParams.set("client_id", Deno.env.get("NAVER_CLIENT_ID"));
  tokenUrl.searchParams.set("client_secret", Deno.env.get("NAVER_CLIENT_SECRET"));
  tokenUrl.searchParams.set("code", code);
  tokenUrl.searchParams.set("state", url.searchParams.get("state"));

  const token = await (await fetch(tokenUrl)).json();
  const profile = await (
    await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    })
  ).json();

  const email = profile?.response?.email;
  if (!email) {
    return Response.redirect(
      `${allowedRedirect(state.redirectTo)}?error_description=${encodeURIComponent("네이버 계정에서 이메일 제공에 동의해주세요.")}`,
      302
    );
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      data: {
        name: profile.response.name,
        nickname: profile.response.nickname,
        avatar_url: profile.response.profile_image,
        social_provider: "naver",
      },
    },
  });

  if (error) {
    return Response.redirect(
      `${allowedRedirect(state.redirectTo)}?error_description=${encodeURIComponent(error.message)}`,
      302
    );
  }

  return Response.redirect(
    `${allowedRedirect(state.redirectTo)}?token_hash=${encodeURIComponent(data.properties.hashed_token)}`,
    302
  );
});
