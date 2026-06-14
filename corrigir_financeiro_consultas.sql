-- =========================================================
-- CORREÇÃO FINANCEIRO E BUSCAS - AGENDAMENTO OLITECH
-- Rode no Supabase depois de subir a nova versão.
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  nome text,
  tipo text,
  taxa_percentual numeric default 0,
  desconto_percentual numeric default 0,
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

create table if not exists public.financeiro_movimentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'entrada',
  descricao text not null default '',
  cliente_nome text,
  categoria text,
  valor numeric not null default 0,
  forma_pagamento text,
  status text not null default 'pago',
  data_movimento date default current_date,
  data_vencimento date,
  observacoes text,
  criado_em timestamptz default now()
);

alter table public.agendamentos add column if not exists data_vencimento date;
alter table public.agendamentos add column if not exists total numeric default 0;
alter table public.agendamentos add column if not exists valor_sinal numeric default 0;
alter table public.agendamentos add column if not exists valor_recebido numeric default 0;
alter table public.agendamentos add column if not exists recebido numeric default 0;
alter table public.agendamentos add column if not exists saldo numeric default 0;
alter table public.agendamentos add column if not exists status_pagamento text default 'pendente';
alter table public.agendamentos add column if not exists servico text;
alter table public.agendamentos add column if not exists servico_nome text;

alter table public.financeiro_movimentos add column if not exists cliente_nome text;
alter table public.financeiro_movimentos add column if not exists data_vencimento date;
alter table public.financeiro_movimentos add column if not exists forma_pagamento text;
alter table public.financeiro_movimentos add column if not exists status text default 'pago';
alter table public.financeiro_movimentos add column if not exists observacoes text;

alter table public.pagamentos add column if not exists nome text;
alter table public.pagamentos add column if not exists tipo text;
alter table public.pagamentos add column if not exists taxa_percentual numeric default 0;
alter table public.pagamentos add column if not exists desconto_percentual numeric default 0;
alter table public.pagamentos add column if not exists ativo boolean not null default true;

insert into public.pagamentos (nome, tipo, taxa_percentual, desconto_percentual, ativo)
values
('Dinheiro','dinheiro',0,0,true),
('Pix','pix',0,0,true),
('Cartão de Débito','debito',0,0,true),
('Cartão de Crédito','credito',0,0,true)
on conflict do nothing;

alter table if exists public.agendamentos disable row level security;
alter table if exists public.financeiro_movimentos disable row level security;
alter table if exists public.pagamentos disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

notify pgrst, 'reload schema';

select 'OK - financeiro e buscas corrigidos' as status;
