// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const authorization = request.headers.get("Authorization");
  if (!authorization) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const token = authorization.replace("Bearer ", "");
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return Response.json({ error: "로그인 정보를 확인하지 못했어요." }, { status: 401 });
  const { count, error: transactionError } = await admin.from("transactions").select("id", { count: "exact", head: true }).or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`).in("status", ["accepted", "in_progress", "disputed"]);
  if (transactionError) return Response.json({ error: transactionError.message }, { status: 500 });
  if ((count ?? 0) > 0) return Response.json({ error: "진행 중이거나 분쟁 처리 중인 거래를 먼저 마무리해주세요." }, { status: 409 });
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 });
  return Response.json({ deleted: true });
});
