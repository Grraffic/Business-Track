create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null)
    or (status in ('approved', 'rejected') and reviewed_at is not null and reviewed_by is not null)
  )
);

create index if not exists access_requests_status_requested_at_idx
  on public.access_requests (status, requested_at desc);

create or replace function public.is_ledger_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'ramosraf278@gmail.com';
$$;

create or replace function public.has_ledger_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_ledger_admin()
    or exists (
      select 1
      from public.access_requests request
      where request.user_id = auth.uid()
        and request.status = 'approved'
    );
$$;

revoke all on function public.is_ledger_admin() from public;
revoke all on function public.has_ledger_access() from public;
grant execute on function public.is_ledger_admin() to authenticated;
grant execute on function public.has_ledger_access() to authenticated;

alter table public.access_requests enable row level security;
grant select, insert on public.access_requests to authenticated;
revoke update on public.access_requests from authenticated;
grant update (status, reviewed_at, reviewed_by)
  on public.access_requests to authenticated;

drop policy if exists access_requests_select_own_or_admin
  on public.access_requests;
create policy access_requests_select_own_or_admin
  on public.access_requests for select to authenticated
  using (user_id = auth.uid() or public.is_ledger_admin());

drop policy if exists access_requests_insert_own_pending
  on public.access_requests;
create policy access_requests_insert_own_pending
  on public.access_requests for insert to authenticated
  with check (
    user_id = auth.uid()
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and status = 'pending'
    and reviewed_at is null
    and reviewed_by is null
  );

drop policy if exists access_requests_admin_review
  on public.access_requests;
create policy access_requests_admin_review
  on public.access_requests for update to authenticated
  using (public.is_ledger_admin())
  with check (
    public.is_ledger_admin()
    and reviewed_by = auth.uid()
    and reviewed_at is not null
  );

drop policy if exists entries_authenticated_access on public.entries;
create policy entries_authenticated_access on public.entries
  for all to authenticated
  using (public.has_ledger_access())
  with check (public.has_ledger_access());

drop policy if exists ingredients_authenticated_access on public.ingredients;
create policy ingredients_authenticated_access on public.ingredients
  for all to authenticated
  using (public.has_ledger_access())
  with check (public.has_ledger_access());

drop policy if exists ingredient_purchases_authenticated_access
  on public.ingredient_purchases;
create policy ingredient_purchases_authenticated_access
  on public.ingredient_purchases for all to authenticated
  using (public.has_ledger_access())
  with check (public.has_ledger_access());