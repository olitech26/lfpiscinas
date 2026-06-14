-- =========================================================
-- CORRIGIR LOGIN + RLS SUPABASE - AGENDAMENTO OLITECH
-- Use quando o usuário existe na tabela, mas o sistema diz que não encontrou.
-- Login final: olitech / 051309
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null default '',
  usuario text not null,
  senha text not null,
  perfil text not null default 'admin',
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

alter table public.usuarios add column if not exists ativo boolean not null default true;
alter table public.usuarios add column if not exists criado_em timestamptz default now();

delete from public.usuarios where lower(coalesce(usuario,'')) in ('olitech','admin');
insert into public.usuarios (nome, usuario, senha, perfil, ativo)
values ('OLITECH', 'olitech', '051309', 'admin', true);

-- Garante que a anon key do Render consiga ler a tabela
alter table public.usuarios disable row level security;

drop policy if exists usuarios_select_all on public.usuarios;
drop policy if exists usuarios_insert_all on public.usuarios;
drop policy if exists usuarios_update_all on public.usuarios;
drop policy if exists usuarios_delete_all on public.usuarios;

-- Deixo políticas abertas também, caso o Supabase reative RLS pela tela
alter table public.usuarios enable row level security;
create policy usuarios_select_all on public.usuarios for select to anon, authenticated using (true);
create policy usuarios_insert_all on public.usuarios for insert to anon, authenticated with check (true);
create policy usuarios_update_all on public.usuarios for update to anon, authenticated using (true) with check (true);
create policy usuarios_delete_all on public.usuarios for delete to anon, authenticated using (true);
alter table public.usuarios disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.usuarios to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

select nome, usuario, senha, perfil, ativo from public.usuarios order by usuario;
