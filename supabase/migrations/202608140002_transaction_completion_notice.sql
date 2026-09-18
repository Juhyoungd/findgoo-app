-- [급구 실적 반영 + 완료 알림] complete_chat_transaction도 update_transaction_status와
-- 똑같이 급구(urgent) 완료를 buyer의 urgent_successes에 반영하도록 맞추고,
-- 거래가 완료되면(어느 경로든) 완료 처리를 누르지 않은 쪽에게도 알림이 가게 합니다.

create or replace function public.complete_chat_transaction(p_conversation_id uuid)
returns uuid as $$
declare
  v_conv public.conversations%rowtype;
  v_post_type text;
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

-- 거래가 완료되면(제안 수락 경로든 채팅 단독 경로든) 완료 처리를 누르지 않은 쪽에게 알려줍니다.
-- auth.uid()가 지금 이 완료 처리를 실행한 사람이라, 그 반대쪽에게만 보냅니다.
create or replace function public.handle_transaction_completed()
returns trigger as $$
declare
  v_other uuid;
  v_post_title text;
begin
  if new.status <> 'completed' then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'completed' then return new; end if;

  v_other := case when auth.uid() = new.seller_id then new.buyer_id else new.seller_id end;
  select title into v_post_title from public.posts where id = new.post_id;

  insert into public.notices (user_id, kind, title, body, target_type)
  values (v_other, 'trade', '거래가 완료됐어요', coalesce(v_post_title, '거래') || ' 거래가 완료 처리됐어요. 매너 후기를 남겨보세요.', 'transactions');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_transaction_completed on public.transactions;
create trigger on_transaction_completed
  after insert or update on public.transactions
  for each row execute procedure public.handle_transaction_completed();
