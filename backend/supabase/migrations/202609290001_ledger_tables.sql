create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  business_id text not null check (business_id in ('water', 'ice', 'graham')),
  entry_type text not null check (entry_type in ('income', 'expense')),
  description text not null check (char_length(btrim(description)) between 1 and 500),
  amount numeric not null check (amount > 0),
  occurred_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 1 and 120),
  unit text not null default 'unit' check (char_length(btrim(unit)) between 1 and 32),
  unit_cost numeric not null default 0 check (unit_cost >= 0),
  stock_on_hand numeric not null default 0 check (stock_on_hand >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ingredient_purchases (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  unit_cost numeric not null check (unit_cost >= 0),
  record_as_expense boolean not null default true,
  purchased_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists entries_business_occurred_at_idx
  on public.entries (business_id, occurred_at desc);
create index if not exists ingredient_purchases_ingredient_purchased_at_idx
  on public.ingredient_purchases (ingredient_id, purchased_at desc);

alter table public.entries enable row level security;
alter table public.ingredients enable row level security;
alter table public.ingredient_purchases enable row level security;

drop policy if exists entries_authenticated_access on public.entries;
create policy entries_authenticated_access on public.entries
  for all to authenticated using (true) with check (true);

drop policy if exists ingredients_authenticated_access on public.ingredients;
create policy ingredients_authenticated_access on public.ingredients
  for all to authenticated using (true) with check (true);

drop policy if exists ingredient_purchases_authenticated_access on public.ingredient_purchases;
create policy ingredient_purchases_authenticated_access on public.ingredient_purchases
  for all to authenticated using (true) with check (true);