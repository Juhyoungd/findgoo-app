-- [채팅 단독 거래] 지금까지는 "제안 수락"으로만 거래(transactions)가 생겨서, 제안 없이
-- 채팅으로만 조건을 맞추고 거래한 경우는 완료 처리·매너 후기를 남길 방법이 없었어요.
-- 대화방에서 바로 "거래 완료"를 누르면 거래 기록을 만들 수 있게 offer_id를 선택 항목으로 바꾸고
-- conversation_id로도 연결할 수 있게 합니다.

alter table public.transactions
  alter column offer_id drop not null,
  add column if not exists conversation_id uuid references public.conversations(id) on delete set null;

-- transactions(post_id)에는 "글 하나당 진행 중인 거래는 하나"라는 부분 유니크 제약
-- (transactions_one_active_post)이 있어서, 대화방이 아니라 글 기준으로 기존 거래를
-- 찾아야 해요. 이미 완료 처리된 거래를 다시 눌러도 프로필 지표가 중복으로 오르지
-- 않게 v_already_completed로 막습니다.
create or replace function public.complete_chat_transaction(p_conversation_id uuid)
returns uuid as $$
declare
  v_conv public.conversations%rowtype;
  v_transaction_id uuid;
  v_already_completed boolean := false;
begin
  select * into v_conv from public.conversations where id = p_conversation_id;
  if v_conv.id is null or auth.uid() not in (v_conv.seller_id, v_conv.buyer_id) then
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
    update public.posts set status = 'closed' where id = v_conv.post_id;
    update public.profiles set completed_trades = completed_trades + 1 where id in (v_conv.seller_id, v_conv.buyer_id);
  end if;

  return v_transaction_id;
end;
$$ language plpgsql security definer set search_path = public;
