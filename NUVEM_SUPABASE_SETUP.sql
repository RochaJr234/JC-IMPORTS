-- J.C IMPORTS — BANCO ONLINE MULTIDISPOSITIVO
-- Supabase / PostgreSQL
-- Execute este script no SQL Editor do projeto Supabase.

create table if not exists public.jc_imports_nuvem (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.jc_imports_nuvem enable row level security;

create policy "jc_imports_select_own"
on public.jc_imports_nuvem
for select
to authenticated
using (auth.uid() = user_id);

create policy "jc_imports_insert_own"
on public.jc_imports_nuvem
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "jc_imports_update_own"
on public.jc_imports_nuvem
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Opcional: exigir confirmação de e-mail fica a critério do projeto.
-- A chave usada no aplicativo deve ser a chave pública/anon do Supabase.
