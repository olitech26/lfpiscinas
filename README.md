# Sistema Agendamento Olitech - Pacote limpo para GitHub/Render

## Login padrão

Usuário: `olitech`  
Senha: `051309`

## 1. Supabase

1. Crie um projeto no Supabase.
2. Abra **SQL Editor > New Query**.
3. Rode primeiro: `schema_banco_vazio.sql`.
4. Depois rode: `criar_admin_primeiro_acesso.sql`.
5. Em **Project Settings > API**, copie:
   - Project URL
   - anon public key

A URL correta deve ser parecida com:

```txt
https://SEU-PROJETO.supabase.co
```

Não use `/rest/v1` no final.

## 2. Render

Crie um **Static Site** e configure:

```txt
Root Directory: vazio
Build Command: npm install --no-package-lock --no-audit --no-fund && npm run build
Publish Directory: dist
```

Em **Environment**, adicione:

```txt
NODE_VERSION=20.19.0
NPM_CONFIG_AUDIT=false
NPM_CONFIG_FUND=false
NPM_CONFIG_PACKAGE_LOCK=false
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLIC
```

Depois clique em **Manual Deploy > Clear build cache & deploy**.

## 3. GitHub

Envie para o GitHub os arquivos deste pacote extraído.

Não envie:

```txt
node_modules/
dist/
.env
```

Este pacote já vem com `.gitignore` para evitar esses arquivos.

## 4. WhatsApp / Evolution API

No sistema, entre em **WhatsApp** e configure:

```txt
Evolution URL: sua URL da Evolution API
API Key: sua chave global
Instance: nome da instância da empresa
```

Use uma instância diferente para cada empresa.
