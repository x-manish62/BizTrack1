-- BizTrack initial schema. Review in a staging project before production.
create extension if not exists pgcrypto;

create type public.platform_role as enum ('master_admin','shop_admin');
create type public.registration_status as enum ('pending','approved','rejected','suspended');
create type public.payment_direction as enum ('payable','receivable');
create type public.transaction_kind as enum ('purchase','sale');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text unique,
  phone text,
  platform_role public.platform_role not null default 'shop_admin',
  registration_status public.registration_status not null default 'pending',
  active_shop_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id),
  address text,
  status public.registration_status not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.profiles add constraint profiles_active_shop_fk
  foreign key (active_shop_id) references public.shops(id) on delete set null;

create table public.shop_members (
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'shop_admin' check (member_role in ('shop_admin')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  primary key(shop_id,user_id)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  default_price numeric(14,2) check (default_price is null or default_price >= 0),
  description text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index items_shop_name_idx on public.items(shop_id, lower(name));

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now()
);
create index parties_shop_name_idx on public.parties(shop_id, lower(name));

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  transaction_no text not null,
  party_id uuid references public.parties(id) on delete restrict,
  seller_name text not null,
  seller_phone text not null,
  seller_email text not null,
  our_representative text not null,
  receiver_name text not null,
  total_amount numeric(14,2) not null check(total_amount >= 0),
  created_at timestamptz not null default now(),
  unique(shop_id, transaction_no)
);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete restrict,
  item_id uuid not null references public.items(id) on delete restrict,
  item_name_snapshot text not null,
  quantity numeric(14,3),
  unit_price numeric(14,2) not null check(unit_price >= 0),
  line_total numeric(14,2) not null check(line_total >= 0)
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  transaction_no text not null,
  party_id uuid references public.parties(id) on delete restrict,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_email text not null,
  our_representative text not null,
  receiver_name text not null,
  total_amount numeric(14,2) not null check(total_amount >= 0),
  created_at timestamptz not null default now(),
  unique(shop_id, transaction_no)
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  item_id uuid not null references public.items(id) on delete restrict,
  item_name_snapshot text not null,
  quantity numeric(14,3),
  unit_price numeric(14,2) not null check(unit_price >= 0),
  line_total numeric(14,2) not null check(line_total >= 0)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  direction public.payment_direction not null,
  purchase_id uuid references public.purchases(id) on delete restrict,
  sale_id uuid references public.sales(id) on delete restrict,
  amount numeric(14,2) not null check(amount > 0),
  payment_method text,
  note text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check ((purchase_id is not null)::int + (sale_id is not null)::int = 1)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  shop_id uuid references public.shops(id) on delete set null,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_master_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles p where p.id=auth.uid() and p.platform_role='master_admin' and p.registration_status='approved') $$;

create or replace function public.is_shop_member(target_shop uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.shop_members m join public.profiles p on p.id=m.user_id where m.shop_id=target_shop and m.user_id=auth.uid() and m.is_active=true and p.registration_status='approved') $$;

-- RLS
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.shop_members enable row level security;
alter table public.items enable row level security;
alter table public.parties enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

create policy "profile self or master read" on public.profiles for select to authenticated using (id=auth.uid() or public.is_master_admin());
-- No direct profile UPDATE policy is granted to ordinary users.
-- This prevents users from changing platform_role, registration_status or active_shop_id
-- through the public client. Add narrowly scoped SECURITY DEFINER RPCs for profile edits.
create policy "shops member or master read" on public.shops for select to authenticated using (owner_id=auth.uid() or public.is_shop_member(id) or public.is_master_admin());
create policy "shops master manage" on public.shops for all to authenticated using (public.is_master_admin()) with check (public.is_master_admin());
create policy "members self or master read" on public.shop_members for select to authenticated using (user_id=auth.uid() or public.is_master_admin());
create policy "members master manage" on public.shop_members for all to authenticated using (public.is_master_admin()) with check (public.is_master_admin());

create policy "items shop access" on public.items for all to authenticated using (public.is_shop_member(shop_id) or public.is_master_admin()) with check (public.is_shop_member(shop_id) or public.is_master_admin());
create policy "parties shop access" on public.parties for all to authenticated using (public.is_shop_member(shop_id) or public.is_master_admin()) with check (public.is_shop_member(shop_id) or public.is_master_admin());
create policy "purchases shop access" on public.purchases for all to authenticated using (public.is_shop_member(shop_id) or public.is_master_admin()) with check (public.is_shop_member(shop_id) or public.is_master_admin());
create policy "sales shop access" on public.sales for all to authenticated using (public.is_shop_member(shop_id) or public.is_master_admin()) with check (public.is_shop_member(shop_id) or public.is_master_admin());
create policy "payments shop access" on public.payments for all to authenticated using (public.is_shop_member(shop_id) or public.is_master_admin()) with check (public.is_shop_member(shop_id) or public.is_master_admin());
create policy "audit shop access" on public.audit_logs for select to authenticated using (public.is_shop_member(shop_id) or public.is_master_admin());

create policy "purchase items through parent" on public.purchase_items for all to authenticated
using (exists(select 1 from public.purchases p where p.id=purchase_id and (public.is_shop_member(p.shop_id) or public.is_master_admin())))
with check (exists(select 1 from public.purchases p where p.id=purchase_id and (public.is_shop_member(p.shop_id) or public.is_master_admin())));
create policy "sale items through parent" on public.sale_items for all to authenticated
using (exists(select 1 from public.sales s where s.id=sale_id and (public.is_shop_member(s.shop_id) or public.is_master_admin())))
with check (exists(select 1 from public.sales s where s.id=sale_id and (public.is_shop_member(s.shop_id) or public.is_master_admin())));

-- Registration trigger: creates profile and pending shop.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
declare new_shop uuid;
begin
 insert into public.profiles(id,full_name,username,phone)
 values(new.id,coalesce(new.raw_user_meta_data->>'full_name','New Owner'),nullif(new.raw_user_meta_data->>'username',''),nullif(new.raw_user_meta_data->>'phone',''));
 insert into public.shops(name,owner_id)
 values(coalesce(new.raw_user_meta_data->>'shop_name','New Shop'),new.id)
 returning id into new_shop;
 update public.profiles set active_shop_id=new_shop where id=new.id;
 return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Master-admin-only approval. Run after assigning first Master Admin.
create or replace function public.approve_shop(target_shop uuid, target_user uuid)
returns void language plpgsql security definer set search_path=public
as $$
begin
 if not public.is_master_admin() then raise exception 'Only Master Admin can approve shops'; end if;
 update public.shops set status='approved' where id=target_shop;
 update public.profiles set registration_status='approved' where id=target_user;
 insert into public.shop_members(shop_id,user_id,is_active) values(target_shop,target_user,true)
 on conflict(shop_id,user_id) do update set is_active=true;
end; $$;
revoke all on function public.approve_shop(uuid,uuid) from public;
grant execute on function public.approve_shop(uuid,uuid) to authenticated;
