-- 03_rls_indexes.sql
-- Objetivo: indexar columnas usadas por RLS para mantener rendimiento.

begin;

create index if not exists idx_customer_profiles_id on app_private.customer_profiles (id);
create index if not exists idx_secure_notes_user_id_created_at on app_private.secure_notes (user_id, created_at desc);

analyze app_private.customer_profiles;
analyze app_private.secure_notes;

commit;
