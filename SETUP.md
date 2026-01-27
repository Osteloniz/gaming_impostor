# Setup (Supabase + Vercel)

Este guia mostra como configurar o banco no Supabase e fazer o deploy na Vercel.

## 1) Criar projeto no Supabase
1. Acesse o painel do Supabase e crie um novo projeto.
2. Anote:
   - Project URL
   - anon public key
   - service role key

## 2) Criar schema e dados
1. Abra o SQL Editor no Supabase.
2. Execute o arquivo `supabase/schema.sql`.
   - Ele cria as tabelas e popula temas de exemplo.

## 3) Habilitar Realtime
1. No Supabase, va em **Database -> Replication**.
2. Habilite Realtime para as tabelas:
   - `rooms`
   - `players`

## 4) Configurar .env.local
Crie um arquivo `.env.local` na raiz do projeto:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 5) Rodar localmente
```
pnpm install
pnpm dev
```
Acesse `http://localhost:3000`.

## 6) Deploy na Vercel
1. Suba o repositorio no GitHub.
2. No painel da Vercel, importe o repo.
3. Configure as mesmas variaveis de ambiente usadas no `.env.local`.
4. Deploy.

## 7) Teste rapido
- Crie uma sala e veja uma linha nova em `rooms`.
- Entre com outro jogador e veja novas linhas em `players`.
- Inicie o jogo e confirme `rooms_private` preenchida.

## Dicas
- Nao exponha `SUPABASE_SERVICE_ROLE_KEY` no client.
- Se quiser adicionar autenticacao no futuro, use Supabase Auth.
- Para limpeza automatica de salas antigas, crie uma rotina via cron (opcional).