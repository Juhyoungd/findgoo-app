// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function routeFor(record) {
  if (record.target_type === "post" && record.target_id) return `/post/${record.target_id}`;
  if (record.target_type === "offer" && record.target_id) return `/offers/${record.target_id}`;
  if (record.target_type === "chat" && record.target_id) return `/chat/${record.target_id}`;
  if (record.target_type === "region") return "/profile/region";
  return "/my/transactions";
}

// Supabase Database Webhook을 notices INSERT에 연결하면 새 알림이 해당 회원의 모든 기기로 전송됩니다.
Deno.serve(async (request) => {
  const secret = request.headers.get("x-findgoo-webhook-secret");
  if (!secret || secret !== Deno.env.get("PUSH_WEBHOOK_SECRET")) return new Response("Unauthorized", { status: 401 });
  const payload = await request.json();
  const record = payload.record;
  if (!record?.user_id) return Response.json({ sent: 0 });
  const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const { data: devices } = await admin.from("device_push_tokens").select("expo_push_token").eq("user_id", record.user_id);
  if (!devices?.length) return Response.json({ sent: 0 });
  const messages = devices.map(({ expo_push_token }) => ({ to: expo_push_token, title: record.title, body: record.body, sound: "default", channelId: "transactions", data: { route: routeFor(record), noticeId: record.id } }));
  const response = await fetch("https://exp.host/--/api/v2/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(messages) });
  if (!response.ok) return Response.json({ error: await response.text() }, { status: 502 });
  return Response.json({ sent: messages.length, receipts: await response.json() });
});
