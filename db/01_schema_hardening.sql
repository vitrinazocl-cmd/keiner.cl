-- 01_schema_hardening.sql
-- Objetivo: sacar objetos sensibles del esquema publico y mover la API a un esquema dedicado.

begin;

create schema if not exists app_api;
create schema if not exists app_private;

-- Revocar permisos amplios sobre el esquema publico.
revoke all on schema public from public;
revoke all on schema public from anon;
revoke all on schema public from authenticated;

-- Permitir solo uso del esquema app_api para roles de aplicacion.
grant usage on schema app_api to anon, authenticated;

-- Tablas privadas, no expuestas directamente.
create table if not exists app_private.customer_profiles (
  id uuid primary key,
  account_name text not null,
  tier text not null,
  created_at timestamptz not null default now()
);

create table if not exists app_private.secure_notes (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  note text not null,
  created_at timestamptz not null default now()
);

-- Vista/API segura expuesta solo con columnas necesarias.
create or replace view app_api.customer_profile_public as
select
  id,
  account_name,
  tier,
  created_at
from app_private.customer_profiles;

-- Bloquear acceso directo a tablas privadas.
revoke all on all tables in schema app_private from anon, authenticated;

-- Entregar acceso solo de lectura sobre objetos de app_api.
grant select on all tables in schema app_api to anon, authenticated;
alter default privileges in schema app_api grant select on tables to anon, authenticated;

commit;
