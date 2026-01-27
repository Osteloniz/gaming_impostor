# Impostor (Online)

Jogo social de deducao para 3 a 10 jogadores, com salas online, cartas secretas e votacao.
Frontend em Next.js e backend usando Supabase (Postgres + Realtime). Deploy recomendado na Vercel.

## Stack
- Next.js 16
- Supabase (Postgres + Realtime)
- Zustand (estado client-side)
- Tailwind CSS + shadcn/ui

## Como jogar (MVP)
- Um jogador cria a sala e compartilha o codigo.
- Todos entram com seus nomes.
- O host inicia a rodada.
- Cada jogador ve sua carta (tema ou impostor).
- Rodada de fala -> votacao -> resultado.

## Requisitos
- Node.js 18+ (recomendado 20+)
- pnpm
- Conta no Supabase
- Conta na Vercel

## Scripts
- `pnpm dev` - ambiente local
- `pnpm build` - build de producao
- `pnpm start` - start de producao

## Variaveis de ambiente
Crie um `.env.local` na raiz do projeto com:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Observacoes:
- `NEXT_PUBLIC_*` fica exposto no client.
- `SUPABASE_SERVICE_ROLE_KEY` deve ficar apenas no server (Vercel/Next.js API routes).

## Estrutura principal
- `app/` - rotas e telas
- `app/api/` - endpoints server-side (segredo do tema/impostor)
- `lib/supabase/` - clients do Supabase
- `lib/game/` - store e tipos
- `supabase/schema.sql` - schema e seeds do banco

## Deploy na Vercel (resumo)
1. Suba o repo no GitHub.
2. Na Vercel, importe o projeto.
3. Configure as variaveis de ambiente (as mesmas do `.env.local`).
4. Build command: `pnpm build`, Output: `.next`.

Para o passo a passo completo, veja `SETUP.md`.

## Licenca
MIT (se desejar, ajuste conforme sua preferencia)