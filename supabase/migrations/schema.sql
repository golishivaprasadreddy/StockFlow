create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  default_low_stock_threshold integer not null default 5
    check (default_low_stock_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  sku text not null check (char_length(btrim(sku)) between 1 and 80),
  description text,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  cost_price numeric(12, 2) check (cost_price is null or cost_price >= 0),
  selling_price numeric(12, 2) check (selling_price is null or selling_price >= 0),
  low_stock_threshold integer check (low_stock_threshold is null or low_stock_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index products_organization_sku_unique
  on public.products (organization_id, lower(btrim(sku)));

create index products_organization_updated_at_idx
  on public.products (organization_id, updated_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as रर
begin
  new.updated_at = now();
  return new;
end;
रर;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create function public.create_organization_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as रर
declare
  organization_name text;
begin
  organization_name := nullif(btrim(new.raw_user_meta_data ->> 'organization_name'), '');

  if organization_name is null or char_length(organization_name) > 120 then
    raise exception 'A valid organization name is required';
  end if;

  insert into public.organizations (owner_id, name)
  values (new.id, organization_name);

  return new;
end;
रर;

revoke all on function public.create_organization_for_new_user() from public;

create trigger on_auth_user_created_create_organization
after insert on auth.users
for each row execute function public.create_organization_for_new_user();

alter table public.organizations enable row level security;
alter table public.products enable row level security;

create policy "Owners can read their organization"
  on public.organizations for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Owners can update their organization"
  on public.organizations for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners can read their products"
  on public.products for select to authenticated
  using (
    exists (
      select 1 from public.organizations
      where organizations.id = products.organization_id
        and organizations.owner_id = (select auth.uid())
    )
  );

create policy "Owners can create products for their organization"
  on public.products for insert to authenticated
  with check (
    exists (
      select 1 from public.organizations
      where organizations.id = products.organization_id
        and organizations.owner_id = (select auth.uid())
    )
  );

create policy "Owners can update their products"
  on public.products for update to authenticated
  using (
    exists (
      select 1 from public.organizations
      where organizations.id = products.organization_id
        and organizations.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.organizations
      where organizations.id = products.organization_id
        and organizations.owner_id = (select auth.uid())
    )
  );

create policy "Owners can delete their products"
  on public.products for delete to authenticated
  using (
    exists (
      select 1 from public.organizations
      where organizations.id = products.organization_id
        and organizations.owner_id = (select auth.uid())
    )
  );

grant select, update on public.organizations to authenticated;
grant select, insert, update, delete on public.products to authenticated;
