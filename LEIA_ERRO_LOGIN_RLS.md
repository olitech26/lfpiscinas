# Correção do erro de login / RLS Supabase

Se o usuário aparece na tabela `usuarios`, mas o sistema informa que não encontrou usuário, o problema é RLS/permissão da `anon key`.

## Passo a passo

1. Abra o Supabase da empresa.
2. Vá em **SQL Editor > New Query**.
3. Rode o arquivo:

```txt
corrigir_login_rls_supabase.sql
```

4. No Render, confira:

```txt
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=anon public key do mesmo projeto
```

5. Clique em:

```txt
Manual Deploy > Clear build cache & deploy
```

## Login padrão

```txt
Usuário: olitech
Senha: 051309
```
