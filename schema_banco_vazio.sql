-- =========================================================
-- AGENDAMENTO OLITECH - SCHEMA DEFINITIVO CORRIGIDO
-- Usuário padrão: olitech / 051309
-- Corrige Perfis, Financeiro, Dashboard e RLS
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  usuario text not null unique,
  senha text not null,
  perfil text not null default 'admin',
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

create table if not exists public.perfis (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  permissoes text[] default '{}',
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  whatsapp text,
  email text,
  cpf_cnpj text,
  endereco text,
  observacoes text,
  bloqueado boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

create table if not exists public.atendentes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  comissao_percentual numeric default 0,
  comissao_servico_percentual numeric default 0,
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  valor numeric default 0,
  duracao_minutos integer default 60,
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  valor_custo numeric default 0,
  valor_venda numeric default 0,
  estoque numeric default 0,
  estoque_ilimitado boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  nome text,
  tipo text,
  taxa_percentual numeric default 0,
  desconto_percentual numeric default 0,
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

create table if not exists public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  atendente_id uuid,
  servico_id uuid,
  cliente_nome text,
  atendente_nome text,
  servico text,
  servico_nome text,
  data_agendamento date,
  hora_agendamento time,
  status text default 'pendente',
  total numeric default 0,
  valor_sinal numeric default 0,
  valor_recebido numeric default 0,
  recebido numeric default 0,
  saldo numeric default 0,
  status_pagamento text default 'pendente',
  observacoes text,
  criado_em timestamptz default now()
);

create table if not exists public.financeiro_movimentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'entrada',
  descricao text not null default '',
  categoria text,
  valor numeric not null default 0,
  forma_pagamento text,
  status text not null default 'pago',
  data_movimento date default current_date,
  observacoes text,
  criado_em timestamptz default now()
);

create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  data_inicio date,
  data_fim date,
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

create table if not exists public.contatos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  tipo text,
  observacoes text,
  ativo boolean not null default true,
  criado_em timestamptz default now()
);

create table if not exists public.configuracoes (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  valor text,
  atualizado_em timestamptz default now(),
  criado_em timestamptz default now()
);

-- Ajustes para bancos que já existiam incompletos
alter table public.perfis add column if not exists descricao text;
alter table public.perfis add column if not exists permissoes text[] default '{}';
alter table public.perfis add column if not exists ativo boolean not null default true;

alter table public.pagamentos add column if not exists nome text;
alter table public.pagamentos add column if not exists tipo text;
alter table public.pagamentos add column if not exists taxa_percentual numeric default 0;
alter table public.pagamentos add column if not exists desconto_percentual numeric default 0;
alter table public.pagamentos add column if not exists ativo boolean not null default true;

alter table public.agendamentos add column if not exists total numeric default 0;
alter table public.agendamentos add column if not exists valor_sinal numeric default 0;
alter table public.agendamentos add column if not exists valor_recebido numeric default 0;
alter table public.agendamentos add column if not exists recebido numeric default 0;
alter table public.agendamentos add column if not exists saldo numeric default 0;
alter table public.agendamentos add column if not exists status_pagamento text default 'pendente';
alter table public.agendamentos add column if not exists servico text;

-- Dados padrão
insert into public.usuarios (nome, usuario, senha, perfil, ativo)
values ('OLITECH', 'olitech', '051309', 'admin', true)
on conflict (usuario) do update
set nome='OLITECH', senha='051309', perfil='admin', ativo=true;

insert into public.perfis (nome, descricao, permissoes, ativo)
values ('admin', 'Administrador do sistema', array['dashboard','agendamentos','clientes','servicos','produtos','atendentes','campanhas','financeiro','relatorios','usuarios','perfis','contatos','whatsapp','configuracoes','backup','personalizacao'], true)
on conflict (nome) do update
set descricao=excluded.descricao, permissoes=excluded.permissoes, ativo=true;

insert into public.pagamentos (nome, tipo, taxa_percentual, desconto_percentual, ativo)
values
('Dinheiro','dinheiro',0,0,true),
('Pix','pix',0,0,true),
('Cartão de Débito','debito',0,0,true),
('Cartão de Crédito','credito',0,0,true)
on conflict do nothing;

insert into public.configuracoes (chave, valor)
values
('nome_sistema','Agendamentos Olitech'),
('whatsapp_loja',''),
('evolution_url',''),
('evolution_key',''),
('evolution_instance','')
on conflict (chave) do nothing;

-- Liberação para frontend com anon key
alter table public.usuarios disable row level security;
alter table public.perfis disable row level security;
alter table public.clientes disable row level security;
alter table public.atendentes disable row level security;
alter table public.servicos disable row level security;
alter table public.produtos disable row level security;
alter table public.agendamentos disable row level security;
alter table public.pagamentos disable row level security;
alter table public.financeiro_movimentos disable row level security;
alter table public.campanhas disable row level security;
alter table public.contatos disable row level security;
alter table public.configuracoes disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

notify pgrst, 'reload schema';

select 'OK - schema corrigido' as status;

-- Ajustes de consulta financeira e busca por status
alter table public.agendamentos add column if not exists data_vencimento date;
alter table public.financeiro_movimentos add column if not exists cliente_nome text;
alter table public.financeiro_movimentos add column if not exists data_vencimento date;
notify pgrst, 'reload schema';
