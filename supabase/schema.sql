-- 찾구 회원 DB 스키마
-- Supabase 대시보드 > SQL Editor에 붙여넣고 실행하세요.
-- auth.users는 Supabase Auth가 자동으로 관리하는 테이블이라 직접 만들 필요 없어요.
-- 여기서는 이름/휴대폰/닉네임/동네처럼 auth.users에 없는 회원 프로필 정보만 별도 테이블로 관리합니다.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  phone text,
  nickname text,
  region text not null default '성수동1가',
  avatar_url text,
  completed_trades integer not null default 0 check (completed_trades >= 0),
  good_manner_reviews integer not null default 0 check (good_manner_reviews >= 0),
  urgent_successes integer not null default 0 check (urgent_successes >= 0),
  manner_reports integer not null default 0 check (manner_reports >= 0),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "본인 프로필 조회" on public.profiles
  for select using (auth.uid() = id);

create policy "본인 프로필 수정" on public.profiles
  for update using (auth.uid() = id);

-- 회원가입(auth.users insert) 시 profiles에도 자동으로 한 행을 만들어줍니다.
-- 이름/휴대폰은 signUp 호출 시 options.data로 넘긴 값을 그대로 씁니다.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'nickname', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- [공개 프로필] 채팅 상대에게 필요한 최소 정보만 반환하고 실명·전화번호는 노출하지 않습니다.
create or replace function public.get_public_profiles(p_ids uuid[])
returns table (
  id uuid,
  nickname text,
  avatar_url text,
  region text,
  created_at timestamptz,
  completed_trades integer,
  good_manner_reviews integer,
  urgent_successes integer,
  manner_reports integer,
  manner_score numeric
) as $$
  select
    p.id,
    coalesce(p.nickname, '찾구 회원'),
    p.avatar_url,
    p.region,
    p.created_at,
    p.completed_trades,
    p.good_manner_reviews,
    p.urgent_successes,
    p.manner_reports,
    greatest(0, least(100,
      36.5 + p.completed_trades * 0.5 + p.good_manner_reviews * 1.0
      + p.urgent_successes * 0.8 - p.manner_reports * 2.0
    ))::numeric
  from public.profiles p
  where p.id = any(p_ids);
$$ language sql stable security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 게시글(구매글/급구)
-- ============================================================

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author text not null,
  type text not null check (type in ('buy', 'urgent')),
  category text not null,
  title text not null,
  description text not null,
  price integer not null,
  region text not null,
  deadline text,
  status text not null default 'open' check (status in ('open', 'reserved', 'closed')),
  manner numeric not null default 36.5,
  views integer not null default 0,
  offer_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

-- 게시글은 마켓 피드라 로그인한 사람이면 누구나 전체를 볼 수 있어야 해요.
create policy "게시글 전체 조회" on public.posts
  for select using (true);

-- 본인 명의(author_id = auth.uid())로만 새 글을 등록할 수 있어요.
create policy "본인 명의로만 글 등록" on public.posts
  for insert with check (auth.uid() = author_id);

create policy "본인 글만 수정" on public.posts
  for update using (auth.uid() = author_id);

create policy "본인 글만 삭제" on public.posts
  for delete using (auth.uid() = author_id);

-- ============================================================
-- 찜한 글
-- ============================================================

create table public.saved_posts (
  user_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.saved_posts enable row level security;

create policy "본인 찜 목록만 조회" on public.saved_posts
  for select using (auth.uid() = user_id);

create policy "본인만 찜 추가" on public.saved_posts
  for insert with check (auth.uid() = user_id);

create policy "본인만 찜 삭제" on public.saved_posts
  for delete using (auth.uid() = user_id);

-- 다른 사용자가 올린 글이 실시간으로 내 화면에도 뜨게 하려면 posts 테이블을
-- Realtime 발행 목록에 추가해야 해요. (이미 추가돼 있으면 에러 없이 무시돼요)
alter publication supabase_realtime add table public.posts;

-- ============================================================
-- 1:1 채팅 (대화방 + 메시지)
-- ============================================================
-- 게시글 하나에 여러 명이 관심을 가질 수 있으니, "게시글 + 구매자" 조합마다
-- 별도의 대화방(conversations)을 만듭니다. 같은 글이라도 사람마다 다른 방이 생겨요.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  seller_id uuid not null references auth.users (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique (post_id, buyer_id)
);

alter table public.conversations enable row level security;

create policy "참여자만 대화 조회" on public.conversations
  for select using (auth.uid() = seller_id or auth.uid() = buyer_id);

create policy "구매자가 대화 시작" on public.conversations
  for insert with check (auth.uid() = buyer_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "대화 참여자만 메시지 조회" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.seller_id = auth.uid() or c.buyer_id = auth.uid())
    )
  );

create policy "대화 참여자만 메시지 전송" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.seller_id = auth.uid() or c.buyer_id = auth.uid())
    )
  );

-- 메시지가 하나 들어올 때마다 conversations.last_message를 자동 갱신해서
-- 채팅 목록 화면이 messages 테이블을 따로 조회하지 않고도 최신 메시지를 보여줄 수 있게 합니다.
create function public.handle_new_message()
returns trigger as $$
begin
  update public.conversations
  set last_message = new.text, last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_message_created
  after insert on public.messages
  for each row execute procedure public.handle_new_message();

alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- 알림함 (notices) — 아래 offers/reports 트리거들이 여기에 행을 씁니다.
-- ============================================================
-- 알림은 항상 트리거(security definer)를 통해서만 만들어지고, 회원이 직접
-- insert하지 못하게 합니다. 본인 알림 조회/읽음 처리만 허용해요.

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('offer', 'trade', 'chat', 'favorite', 'keyword', 'urgent', 'system')),
  title text not null,
  body text not null,
  read boolean not null default false,
  target_type text not null check (target_type in ('post', 'offer', 'chat', 'transactions', 'region')),
  target_id uuid,
  created_at timestamptz not null default now()
);

alter table public.notices enable row level security;

create policy "본인 알림만 조회" on public.notices
  for select using (auth.uid() = user_id);

create policy "본인 알림만 읽음 처리" on public.notices
  for update using (auth.uid() = user_id);

alter publication supabase_realtime add table public.notices;

-- ============================================================
-- 제안 (offers)
-- ============================================================
-- 게시글 하나에 여러 사람이 가격/조건을 제안할 수 있어요. 글쓴이(판매자)는
-- 수락·거절, 제안자는 취소만 할 수 있습니다.

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  offerer_id uuid not null references auth.users (id) on delete cascade,
  offerer_nickname text not null,
  price integer not null,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'canceled')),
  created_at timestamptz not null default now()
);

alter table public.offers enable row level security;

create policy "offers select policy" on public.offers
  for select using (
    auth.uid() = offerer_id
    or exists (select 1 from public.posts p where p.id = offers.post_id and p.author_id = auth.uid())
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "offers insert policy" on public.offers
  for insert with check (auth.uid() = offerer_id);

create policy "offers update policy" on public.offers
  for update using (
    auth.uid() = offerer_id
    or exists (select 1 from public.posts p where p.id = offers.post_id and p.author_id = auth.uid())
  );

alter publication supabase_realtime add table public.offers;

-- 새 제안이 오면 글의 offer_count를 올리고, 글쓴이에게 알림을 남깁니다.
create function public.handle_new_offer()
returns trigger as $$
declare
  v_post_author uuid;
  v_post_title text;
begin
  select author_id, title into v_post_author, v_post_title from public.posts where id = new.post_id;
  update public.posts set offer_count = offer_count + 1 where id = new.post_id;

  if v_post_author is not null and v_post_author <> new.offerer_id then
    insert into public.notices (user_id, kind, title, body, target_type, target_id)
    values (v_post_author, 'offer', '새 제안이 도착했어요', new.offerer_nickname || ' 님이 "' || coalesce(v_post_title, '내 글') || '"에 제안했어요', 'offer', new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_offer_created
  after insert on public.offers
  for each row execute procedure public.handle_new_offer();

-- 제안 상태가 바뀌면(수락/거절) 제안자에게 알림을 남깁니다.
create function public.handle_offer_status_change()
returns trigger as $$
declare
  v_title text;
  v_body text;
begin
  if new.status = old.status then return new; end if;
  if new.status = 'accepted' then
    v_title := '제안이 수락됐어요';
    v_body := '보낸 제안이 수락됐어요. 채팅으로 거래를 이어가세요.';
  elsif new.status = 'rejected' then
    v_title := '제안이 거절됐어요';
    v_body := '보낸 제안이 거절됐어요.';
  else
    return new;
  end if;

  insert into public.notices (user_id, kind, title, body, target_type, target_id)
  values (new.offerer_id, 'trade', v_title, v_body, 'offer', new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_offer_status_changed
  after update on public.offers
  for each row execute procedure public.handle_offer_status_change();

-- 제안이 수락되면 해당 글+제안자 대화방이 없을 때 자동으로 만들어줍니다.
-- (판매자는 conversations를 직접 insert할 권한이 없어서, 이 함수가 security
-- definer로 대신 만들어줘요. 이미 대화 중이었다면 그 방을 그대로 둡니다.)
create function public.accept_offer(p_offer_id uuid)
returns void as $$
declare
  v_post_id uuid;
  v_offerer_id uuid;
  v_seller_id uuid;
begin
  select post_id, offerer_id into v_post_id, v_offerer_id from public.offers where id = p_offer_id;
  select author_id into v_seller_id from public.posts where id = v_post_id;

  if v_seller_id is null or v_seller_id <> auth.uid() then
    raise exception '이 제안을 수락할 권한이 없어요.';
  end if;

  update public.offers set status = 'accepted' where id = p_offer_id;

  insert into public.conversations (post_id, seller_id, buyer_id)
  values (v_post_id, v_seller_id, v_offerer_id)
  on conflict (post_id, buyer_id) do nothing;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================
-- 신고 (reports)
-- ============================================================

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reporter_name text not null,
  reported_user text not null,
  reason text not null,
  detail text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "reports select policy" on public.reports
  for select using (
    auth.uid() = reporter_id
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "reports insert policy" on public.reports
  for insert with check (auth.uid() = reporter_id);

create policy "reports update policy" on public.reports
  for update using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

alter publication supabase_realtime add table public.reports;

-- 신고 처리 상태가 바뀌면 신고자에게 알림을 남깁니다.
create function public.handle_report_status_change()
returns trigger as $$
declare
  v_body text;
begin
  if new.status = old.status then return new; end if;
  if new.status = 'reviewing' then v_body := '신고 내용을 검토하고 있어요.';
  elsif new.status = 'resolved' then v_body := '신고 처리가 완료됐어요.';
  else return new; end if;

  insert into public.notices (user_id, kind, title, body, target_type)
  values (new.reporter_id, 'system', '신고 처리 소식', new.reason || ' 신고 건: ' || v_body, 'transactions');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_report_status_changed
  after update on public.reports
  for each row execute procedure public.handle_report_status_change();

-- 새 채팅 메시지가 오면 상대방에게 알림함에도 남겨서, 채팅 탭이 아니어도
-- 마이페이지 알림 목록에서 확인할 수 있게 합니다.
create function public.handle_new_message_notice()
returns trigger as $$
declare
  v_seller_id uuid;
  v_buyer_id uuid;
  v_recipient_id uuid;
  v_sender_name text;
begin
  select seller_id, buyer_id into v_seller_id, v_buyer_id from public.conversations where id = new.conversation_id;
  v_recipient_id := case when new.sender_id = v_seller_id then v_buyer_id else v_seller_id end;

  select coalesce(nickname, name, '상대방') into v_sender_name from public.profiles where id = new.sender_id;

  insert into public.notices (user_id, kind, title, body, target_type, target_id)
  values (v_recipient_id, 'chat', v_sender_name || ' 님', left(new.text, 80), 'chat', new.conversation_id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_message_created_notice
  after insert on public.messages
  for each row execute procedure public.handle_new_message_notice();

-- ============================================================
-- 읽음 표시 (read receipts)
-- ============================================================
-- 메시지마다 읽음 여부를 저장하지 않고, 대화방 참여자별로 "내가 마지막으로 읽은 시각"만
-- 저장해요. 상대가 보낸 메시지 중 이 시각 이후에 온 것만 "안 읽음"으로 취급하면 됩니다.
-- (슬랙 등에서 흔히 쓰는 방식이라, 메시지가 아무리 쌓여도 매번 여러 행을 갱신할 필요가 없어요.)

alter table public.conversations
  add column seller_last_read_at timestamptz,
  add column buyer_last_read_at timestamptz;

-- 참여자 본인 쪽 last_read_at만 갱신합니다. conversations에는 update RLS 정책이 따로
-- 없어서(글쓴이 알림 트리거만 security definer로 건드렸어요), 이 함수가 대신 검증하고 갱신해요.
-- 대화방을 읽었으면 그 대화방을 가리키는 채팅 알림도 같이 읽음 처리합니다(알림함까지 안 가도 됨).
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void as $$
begin
  update public.conversations
  set
    seller_last_read_at = case when seller_id = auth.uid() then now() else seller_last_read_at end,
    buyer_last_read_at = case when buyer_id = auth.uid() then now() else buyer_last_read_at end
  where id = p_conversation_id
    and (seller_id = auth.uid() or buyer_id = auth.uid());

  update public.notices
  set read = true
  where user_id = auth.uid()
    and target_type = 'chat'
    and target_id = p_conversation_id
    and read = false;
end;
$$ language plpgsql security definer set search_path = public;

-- 출시 보강 스키마는 반복 실행 가능한 migration으로 관리합니다.
-- Supabase CLI: supabase db push
-- 파일: supabase/migrations/202608130001_release_foundations.sql
