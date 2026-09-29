-- 04_create_leads_feria_table.sql
-- Tabla centralizada LEADS_FERIA para Supabase / PostgreSQL

create table if not exists public."LEADS_FERIA" (
  id uuid default gen_random_uuid() primary key,
  codigo_unico text not null unique,
  nombre text not null,
  telefono text not null,
  email text default '',
  empresa text default '',
  cargo text default 'CLIENTE',
  fecha_registro timestamptz default now(),
  premio text default 'Pendiente Ruleta',
  canjeado text default 'NO',
  observaciones text default '',
  dispositivo text default ''
);

-- Índices para búsquedas ultra rápidas durante la feria
create index if not exists idx_leads_feria_codigo on public."LEADS_FERIA" (codigo_unico);
create index if not exists idx_leads_feria_telefono on public."LEADS_FERIA" (telefono);
create index if not exists idx_leads_feria_email on public."LEADS_FERIA" (email);
create index if not exists idx_leads_feria_fecha on public."LEADS_FERIA" (fecha_registro desc);

-- Habilitar permisos RLS (Row Level Security) para acceso anónimo/autenticado
alter table public."LEADS_FERIA" enable row level security;

create policy "Permitir insercion publica de leads feria"
  on public."LEADS_FERIA" for insert
  with check (true);

create policy "Permitir lectura publica de leads feria"
  on public."LEADS_FERIA" for select
  using (true);

create policy "Permitir actualizacion publica de canje de premios"
  on public."LEADS_FERIA" for update
  using (true);
