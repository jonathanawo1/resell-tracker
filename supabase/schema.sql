create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  store text not null,
  category text not null default 'General',
  purchase_price numeric(10,2) not null,
  purchase_date date not null,
  sale_price numeric(10,2),
  sale_date date,
  status text not null default 'unsold',
  platform text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger items_updated_at
  before update on items
  for each row execute function update_updated_at();

-- Enable RLS (optional but recommended)
alter table items enable row level security;

-- Allow all for now (add auth later if needed)
create policy "Allow all" on items for all using (true) with check (true);
