create extension if not exists "pgcrypto";

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'lobby',
  host_player_id uuid,
  mode text not null default 'presencial',
  total_rounds integer not null default 1,
  current_round integer not null default 1,
  turn_order jsonb,
  current_turn_index integer not null default 0,
  current_revealing_player integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  name text not null,
  is_host boolean not null default false,
  has_seen_card boolean not null default false,
  voted_for uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  category text,
  active boolean not null default true
);

create table if not exists public.rooms_private (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  theme_id uuid references public.themes(id),
  impostor_player_id uuid references public.players(id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  round_number integer not null default 1,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists players_room_id_idx on public.players(room_id);
create index if not exists rooms_code_idx on public.rooms(code);
create index if not exists messages_room_id_round_idx on public.messages(room_id, round_number, created_at);

insert into public.themes (text, category, active) values
('Praia', 'geral', true),
('Filmes de terror', 'filmes', true),
('Pizza', 'comida', true),
('Super-heróis', 'filmes', true),
('Videogames', 'jogos', true),
('Festas de aniversário', 'geral', true),
('Carros', 'geral', true),
('Animais de estimação', 'geral', true),
('Viagens internacionais', 'geral', true),
('Esportes radicais', 'esportes', true),
('Música pop', 'musica', true),
('Comida japonesa', 'comida', true),
('Natal', 'eventos', true),
('Halloween', 'eventos', true),
('Casamentos', 'eventos', true),
('Academia', 'geral', true),
('Redes sociais', 'geral', true),
('Séries de TV', 'geral', true),
('Futebol', 'esportes', true),
('Chocolate', 'comida', true),
('Café da manhã', 'comida', true),
('Parques temáticos', 'geral', true),
('Acampamento', 'geral', true),
('Churrasco', 'comida', true),
('Anos 80', 'geral', true),
('Escola', 'geral', true),
('Trabalho remoto', 'geral', true),
('Festa Junina', 'eventos', true),
('Carnaval', 'eventos', true),
('Cinema', 'filmes', true),

-- Filmes e franquias famosas
('Harry Potter', 'filmes', true),
('Star Wars', 'filmes', true),
('Senhor dos Anéis', 'filmes', true),
('Marvel', 'filmes', true),
('DC Comics', 'filmes', true),
('Vingadores', 'filmes', true),
('Jurassic Park', 'filmes', true),
('Matrix', 'filmes', true),
('Titanic', 'filmes', true),
('Velozes e Furiosos', 'filmes', true),

-- Eventos e cultura pop
('Copa do Mundo', 'eventos', true),
('Olimpíadas', 'eventos', true),
('Rock in Rio', 'eventos', true),
('Oscar', 'eventos', true),
('Comic Con', 'eventos', true),
('Super Bowl', 'eventos', true),
('Réveillon', 'eventos', true),
('Black Friday', 'eventos', true)
on conflict do nothing;
