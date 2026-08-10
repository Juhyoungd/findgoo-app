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
