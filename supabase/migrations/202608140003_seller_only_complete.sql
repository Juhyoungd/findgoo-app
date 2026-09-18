-- [완료 처리는 판매자만] 클라이언트에서 구매자에게는 "거래 완료" 버튼을 숨겼는데,
-- 서버에서도 똑같이 막아야 안전해요 (클라이언트 체크만 믿으면 안 됨).
create or replace function public.complete_chat_transaction(p_conversation_id uuid)
returns uuid as $$
declare
  v_conv public.conversations%rowtype;
  v_post_type text;
  v_transaction_id uuid;
  v_already_completed boolean := false;
begin
  select * into v_conv from public.conversations where id = p_conversation_id;
  if v_conv.id is null or auth.uid() <> v_conv.seller_id then
    raise exception '이 대화방의 거래를 완료할 권한이 없어요.';
  end if;

  select id, (status = 'completed') into v_transaction_id, v_already_completed
    from public.transactions
    where post_id = v_conv.post_id and status <> 'canceled'
    limit 1;

  if v_transaction_id is not null then
    if not v_already_completed then
      update public.transactions
      set status = 'completed', conversation_id = coalesce(conversation_id, p_conversation_id), completed_at = now()
      where id = v_transaction_id;
    end if;
  else
    insert into public.transactions (post_id, conversation_id, seller_id, buyer_id, status, completed_at)
    values (v_conv.post_id, p_conversation_id, v_conv.seller_id, v_conv.buyer_id, 'completed', now())
    returning id into v_transaction_id;
  end if;

  if not v_already_completed then
    select type into v_post_type from public.posts where id = v_conv.post_id;
    update public.posts set status = 'closed' where id = v_conv.post_id;
    update public.profiles set completed_trades = completed_trades + 1 where id in (v_conv.seller_id, v_conv.buyer_id);
    if v_post_type = 'urgent' then
      update public.profiles set urgent_successes = urgent_successes + 1 where id = v_conv.buyer_id;
    end if;
  end if;

  return v_transaction_id;
end;
$$ language plpgsql security definer set search_path = public;
