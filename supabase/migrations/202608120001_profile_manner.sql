-- [회원 프로필·신뢰도] 기존 배포 DB에 프로필 사진과 매너 산정용 누적 지표를 추가합니다.
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists completed_trades integer not null default 0,
  add column if not exists good_manner_reviews integer not null default 0,
  add column if not exists urgent_successes integer not null default 0,
  add column if not exists manner_reports integer not null default 0;

create or replace function public.handle_new_user()
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

-- 상대 공개 프로필은 거래 판단에 필요한 정보만 노출합니다. 실명과 전화번호는 제외합니다.
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
