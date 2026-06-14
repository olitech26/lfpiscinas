-- =========================================================
-- PRIMEIRO ACESSO - SISTEMA AGENDAMENTO OLITECH / EMPRESAS
-- Usuário padrão: olitech
-- Senha padrão: 051309
-- Rode no Supabase: SQL Editor > New Query > Run
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

-- Remove duplicados do usuário padrão
create temporary table if not exists tmp_keep_usuarios as
select min(id::text)::uuid as id_keep, lower(usuario) as usuario_lower
from public.usuarios
where usuario is not null
group by lower(usuario);

delete from public.usuarios u
using tmp_keep_usuarios k
where lower(u.usuario)=k.usuario_lower
  and u.id<>k.id_keep;

drop table if exists tmp_keep_usuarios;

-- Índice único por usuário, sem diferenciar maiúscula/minúscula
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname='public'
      and tablename='usuarios'
      and indexname='usuarios_usuario_lower_unique'
  ) then
    create unique index usuarios_usuario_lower_unique on public.usuarios (lower(usuario));
  end if;
end $$;

-- Cria/atualiza admin padrão
insert into public.usuarios (nome, usuario, senha, perfil, ativo)
values ('OLITECH', 'olitech', '051309', 'admin', true)
on conflict (lower(usuario)) do update set
  nome=excluded.nome,
  senha=excluded.senha,
  perfil=excluded.perfil,
  ativo=true;

-- Permissões para o frontend Supabase anon/authenticated
alter table public.usuarios disable row level security;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.usuarios to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

select nome, usuario, senha, perfil, ativo from public.usuarios order by usuario;
