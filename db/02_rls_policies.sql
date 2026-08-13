-- 02_rls_policies.sql
-- Objetivo: habilitar Row Level Security y filtrar por usuario autenticado.

begin;

alter table app_private.customer_profiles enable row level security;
alter table app_private.secure_notes enable row level security;

-- Politica: cada usuario solo puede ver/editar su propio perfil.
drop policy if exists profile_select_own on app_private.customer_profiles;
create policy profile_select_own
on app_private.customer_profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists profile_update_own on app_private.customer_profiles;
create policy profile_update_own
on app_private.customer_profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Politica: cada usuario solo puede operar sus notas.
drop policy if exists notes_select_own on app_private.secure_notes;
create policy notes_select_own
on app_private.secure_notes
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists notes_insert_own on app_private.secure_notes;
create policy notes_insert_own
on app_private.secure_notes
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists notes_delete_own on app_private.secure_notes;
create policy notes_delete_own
on app_private.secure_notes
for delete
to authenticated
using (user_id = auth.uid());

commit;
