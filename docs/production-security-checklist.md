# Checklist de Ciberseguridad para Produccion

## 1) API de datos: esquema privado y esquema de exposicion

- [ ] Mantener tablas sensibles en `app_private`.
- [ ] Exponer solo vistas minimas en `app_api`.
- [ ] Revocar acceso del esquema `public` para `anon` y `authenticated`.
- [ ] Ejecutar scripts:
  - [db/01_schema_hardening.sql](../db/01_schema_hardening.sql)
  - [db/02_rls_policies.sql](../db/02_rls_policies.sql)
  - [db/03_rls_indexes.sql](../db/03_rls_indexes.sql)

## 2) Row Level Security (RLS)

- [ ] RLS habilitado en todas las tablas con datos por usuario.
- [ ] Politicas `USING` y `WITH CHECK` basadas en `auth.uid()`.
- [ ] Indices para columnas de filtro RLS (`user_id`, `id`) creados.
- [ ] Validar rendimiento con `EXPLAIN ANALYZE` en consultas criticas.

## 3) SSL y transporte seguro

- [ ] `ENFORCE_HTTPS=true` en produccion.
- [ ] Certificado TLS valido y renovacion automatica.
- [ ] HSTS habilitado (server ya lo aplica cuando HTTPS esta forzado).
- [ ] Prohibir trafico HTTP en balanceador o WAF.

## 4) Restricciones de red

- [ ] Definir `ALLOWED_ORIGINS` solo con dominios corporativos.
- [ ] Definir `TRUSTED_IPS` para restringir consumo API si aplica arquitectura privada.
- [ ] Bloquear puertos no usados en firewall / security groups.
- [ ] Asegurar que SMTP y DB acepten solo origenes necesarios.

## 5) SMTP personalizado

- [ ] Configurar proveedor SMTP corporativo en `.env`.
- [ ] Usar `SMTP_SECURE=true`.
- [ ] DKIM, SPF y DMARC configurados en DNS.
- [ ] Rotacion de credenciales SMTP cada 90 dias.

## 6) Backups PITR (Point-In-Time Recovery)

- [ ] Habilitar PITR en el proveedor de base de datos.
- [ ] Definir ventana de retencion (minimo 7 a 14 dias recomendado).
- [ ] Probar restauracion a un timestamp historico (ejercicio mensual).
- [ ] Documentar RPO/RTO y responsables de recovery.

## 7) Operacion segura continua

- [ ] Monitoreo de logs con alertas de 4xx/5xx anomalos.
- [ ] Escaneo de dependencias y CVEs en pipeline.
- [ ] Pentest o revision de seguridad trimestral.
- [ ] Plan de respuesta a incidentes vigente.
