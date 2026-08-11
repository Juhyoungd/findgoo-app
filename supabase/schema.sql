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
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

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
