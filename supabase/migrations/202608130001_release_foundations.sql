-- 선택 기능 1,3,5,9,10,13,20,23,24,25,32의 운영 DB 기반

create unique index if not exists profiles_nickname_unique on public.profiles (lower(nickname)) where nickname is not null;

alter table public.messages add column if not exists content_type text not null default 'text';
alter table public.messages add column if not exists image_path text;
alter table public.messages drop constraint if exists messages_content_type_check;
alter table public.messages add constraint messages_content_type_check check (content_type in ('text', 'image'));

alter table public.reports add column if not exists reported_user_id uuid references auth.users(id) on delete set null;

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);
alter table public.device_push_tokens enable row level security;
create policy "본인 기기 토큰 조회" on public.device_push_tokens for select using (auth.uid() = user_id);
create policy "본인 기기 토큰 등록" on public.device_push_tokens for insert with check (auth.uid() = user_id);
create policy "본인 기기 토큰 수정" on public.device_push_tokens for update using (auth.uid() = user_id);
create policy "본인 기기 토큰 삭제" on public.device_push_tokens for delete using (auth.uid() = user_id);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  categories text[] not null default '{}',
  keywords text[] not null default '{}',
  push_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  check (cardinality(keywords) <= 10)
);
alter table public.user_preferences enable row level security;
create policy "본인 관심 설정 조회" on public.user_preferences for select using (auth.uid() = user_id);
create policy "본인 관심 설정 등록" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "본인 관심 설정 수정" on public.user_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_keyword_post_notice()
returns trigger as $$
begin
  insert into public.notices (user_id, kind, title, body, target_type, target_id)
  select distinct
    pref.user_id,
    'keyword',
    '관심 키워드 새 글',
    '"' || matched.keyword || '" 관련 글이 올라왔어요: ' || left(new.title, 60),
    'post',
    new.id
  from public.user_preferences pref
  cross join lateral (
    select keyword
    from unnest(pref.keywords) keyword
    where char_length(trim(keyword)) >= 2
      and position(lower(trim(keyword)) in lower(new.title || ' ' || new.description)) > 0
    limit 1
  ) matched
  where pref.push_enabled = true
    and pref.user_id <> new.author_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
create trigger on_post_keyword_notice after insert on public.posts for each row execute procedure public.handle_keyword_post_notice();

create table if not exists public.blocked_users (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocked_users enable row level security;
create policy "본인 차단 목록 조회" on public.blocked_users for select using (auth.uid() = blocker_id);
create policy "본인 차단 추가" on public.blocked_users for insert with check (auth.uid() = blocker_id);
create policy "본인 차단 해제" on public.blocked_users for delete using (auth.uid() = blocker_id);

drop policy if exists "구매자가 대화 시작" on public.conversations;
create policy "차단하지 않은 구매자가 대화 시작" on public.conversations
  for insert with check (
    auth.uid() = buyer_id
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker_id = seller_id and b.blocked_id = buyer_id)
         or (b.blocker_id = buyer_id and b.blocked_id = seller_id)
    )
  );

drop policy if exists "대화 참여자만 메시지 전송" on public.messages;
create policy "차단하지 않은 대화 참여자만 메시지 전송" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and auth.uid() in (c.seller_id, c.buyer_id)
        and not exists (
          select 1 from public.blocked_users b
          where (b.blocker_id = c.seller_id and b.blocked_id = c.buyer_id)
             or (b.blocker_id = c.buyer_id and b.blocked_id = c.seller_id)
        )
    )
  );

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  offer_id uuid not null unique references public.offers(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'accepted' check (status in ('requested','accepted','in_progress','completed','canceled','disputed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index if not exists transactions_one_active_post on public.transactions(post_id) where status <> 'canceled';
alter table public.transactions enable row level security;
create policy "거래 참여자 조회" on public.transactions for select using (auth.uid() in (seller_id, buyer_id) or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
alter publication supabase_realtime add table public.transactions;

create table if not exists public.manner_reviews (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewee_id uuid not null references auth.users(id) on delete cascade,
  good_manner boolean not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  unique (transaction_id, reviewer_id),
  check (reviewer_id <> reviewee_id)
);
alter table public.manner_reviews enable row level security;
create policy "거래 후기 조회" on public.manner_reviews for select using (auth.uid() in (reviewer_id, reviewee_id));
create policy "완료 거래 후기 작성" on public.manner_reviews for insert with check (
  auth.uid() = reviewer_id and exists (
    select 1 from public.transactions t where t.id = transaction_id and t.status = 'completed'
      and auth.uid() in (t.seller_id, t.buyer_id)
      and reviewee_id = case when auth.uid() = t.seller_id then t.buyer_id else t.seller_id end
  )
);

create table if not exists public.support_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  title text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending','answered')),
  answer text,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
alter table public.support_inquiries enable row level security;
create policy "본인 문의 조회" on public.support_inquiries for select using (auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "본인 문의 접수" on public.support_inquiries for insert with check (auth.uid() = user_id);
create policy "관리자 문의 답변" on public.support_inquiries for update using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 제안 수락, 중복 수락 방지, 거래/채팅 생성을 한 트랜잭션 안에서 처리합니다.
create or replace function public.accept_offer(p_offer_id uuid)
returns uuid as $$
declare
  v_offer public.offers%rowtype;
  v_post public.posts%rowtype;
  v_transaction_id uuid;
begin
  select * into v_offer from public.offers where id = p_offer_id for update;
  if v_offer.id is null then raise exception '제안을 찾을 수 없어요.'; end if;
  select * into v_post from public.posts where id = v_offer.post_id for update;
  if v_post.author_id <> auth.uid() then raise exception '이 제안을 수락할 권한이 없어요.'; end if;
  if v_offer.status <> 'pending' or v_post.status <> 'open' then raise exception '이미 처리되었거나 거래 중인 글이에요.'; end if;

  update public.offers set status = case when id = p_offer_id then 'accepted' else 'rejected' end
    where post_id = v_post.id and status = 'pending';
  update public.posts set status = 'reserved' where id = v_post.id;
  insert into public.transactions (post_id, offer_id, seller_id, buyer_id, status)
    values (v_post.id, v_offer.id, v_post.author_id, v_offer.offerer_id, 'accepted')
    returning id into v_transaction_id;
  insert into public.conversations (post_id, seller_id, buyer_id)
    values (v_post.id, v_post.author_id, v_offer.offerer_id)
    on conflict (post_id, buyer_id) do nothing;
  return v_transaction_id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.update_transaction_status(p_transaction_id uuid, p_status text)
returns void as $$
declare
  v_tx public.transactions%rowtype;
  v_type text;
begin
  select * into v_tx from public.transactions where id = p_transaction_id for update;
  if v_tx.id is null or auth.uid() not in (v_tx.seller_id, v_tx.buyer_id) then raise exception '거래를 변경할 권한이 없어요.'; end if;
  if p_status not in ('in_progress','completed','canceled','disputed') then raise exception '지원하지 않는 거래 상태예요.'; end if;
  if v_tx.status in ('completed','canceled') then raise exception '이미 종료된 거래예요.'; end if;
  if p_status = 'in_progress' and v_tx.status <> 'accepted' then raise exception '수락된 거래만 시작할 수 있어요.'; end if;

  update public.transactions set status = p_status, completed_at = case when p_status = 'completed' then now() else completed_at end where id = p_transaction_id;
  if p_status = 'completed' then
    select type into v_type from public.posts where id = v_tx.post_id;
    update public.posts set status = 'closed' where id = v_tx.post_id;
    update public.profiles set completed_trades = completed_trades + 1 where id in (v_tx.seller_id, v_tx.buyer_id);
    if v_type = 'urgent' then update public.profiles set urgent_successes = urgent_successes + 1 where id = v_tx.buyer_id; end if;
  elsif p_status = 'canceled' then
    update public.posts set status = 'open' where id = v_tx.post_id;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.handle_good_manner_review()
returns trigger as $$
begin
  if new.good_manner then update public.profiles set good_manner_reviews = good_manner_reviews + 1 where id = new.reviewee_id; end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
create trigger on_good_manner_review after insert on public.manner_reviews for each row execute procedure public.handle_good_manner_review();

create or replace function public.handle_resolved_manner_report()
returns trigger as $$
begin
  if new.status = 'resolved' and old.status <> 'resolved' and new.reported_user_id is not null then
    update public.profiles set manner_reports = manner_reports + 1 where id = new.reported_user_id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
create trigger on_resolved_manner_report after update on public.reports for each row execute procedure public.handle_resolved_manner_report();

-- 이미지 저장소: 프로필은 공개 URL, 채팅 사진은 참여자만 서명 URL로 확인합니다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 8388608, array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', false, 8388608, array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;

create policy "프로필 사진 업로드" on storage.objects for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "프로필 사진 수정" on storage.objects for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "프로필 사진 삭제" on storage.objects for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "채팅 사진 참여자 조회" on storage.objects for select using (bucket_id = 'chat-media' and exists (select 1 from public.conversations c where c.id::text = (storage.foldername(name))[1] and auth.uid() in (c.seller_id, c.buyer_id)));
create policy "채팅 사진 참여자 업로드" on storage.objects for insert with check (bucket_id = 'chat-media' and exists (select 1 from public.conversations c where c.id::text = (storage.foldername(name))[1] and auth.uid() in (c.seller_id, c.buyer_id)));
