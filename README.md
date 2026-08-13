# KEINER.CL Corporativo

Sitio corporativo premium con HTML5, CSS3, JavaScript vanilla y backend Node.js seguro para formularios.

## Caracteristicas

- Diseno material corporativo responsivo (mobile, tablet, notebook, desktop).
- Formulario conectado a API segura con validacion, rate-limit y sanitizacion.
- Analitica anonima condicionada por consentimiento de privacidad.
- Paginas legales reales: privacidad y terminos.
- SEO tecnico base: robots, sitemap, Open Graph y canonical.

## Requisitos

- Node.js 20 o superior.

## Configuracion

1. Copiar variables de entorno:
   - `copy .env.example .env`
2. Configurar SMTP real en `.env`.
3. Si quieres conectar leads a Power Automate, CRM, Outlook o SharePoint, configura `LEAD_WEBHOOK_URL`.
4. Si quieres activar dashboards embebidos, configura `POWER_BI_EMBED_URL`.
3. Instalar dependencias:
   - `npm install`
4. Ejecutar en desarrollo:
   - `npm run dev`
5. Ejecutar en produccion:
   - `npm start`

## Integraciones comerciales y analiticas

- Webhook de leads para Power Automate / SharePoint / Outlook:
  - [docs/lead-webhook-power-automate.md](docs/lead-webhook-power-automate.md)
- Payload de ejemplo del lead enviado por la API:
  - [docs/lead-webhook-sample.json](docs/lead-webhook-sample.json)
- Activacion de Power BI embebido en Inicio, Servicios y Casos:
  - [docs/power-bi-embed-setup.md](docs/power-bi-embed-setup.md)

## Ciberseguridad avanzada

- Backend reforzado con:
   - forzado HTTPS opcional (`ENFORCE_HTTPS=true`),
   - allowlist de origenes (`ALLOWED_ORIGINS`),
   - restriccion por IP para API (`TRUSTED_IPS`),
   - limites de peticiones configurables (`RATE_LIMIT_CONTACT_MAX`, `RATE_LIMIT_ANALYTICS_MAX`).
- Endurecimiento de datos con scripts SQL:
   - [db/01_schema_hardening.sql](db/01_schema_hardening.sql)
   - [db/02_rls_policies.sql](db/02_rls_policies.sql)
   - [db/03_rls_indexes.sql](db/03_rls_indexes.sql)
- Checklist de preparacion productiva:
   - [docs/production-security-checklist.md](docs/production-security-checklist.md)

## Proximo paso ejecutado: hardening perimetral

- Configuracion Nginx endurecida para TLS, cabeceras, limitacion de trafico y proxy seguro:
   - [deploy/nginx/keiner.cl.conf](deploy/nginx/keiner.cl.conf)
- Baseline WAF y rate limiting para Cloudflare:
   - [deploy/cloudflare/waf-rules.md](deploy/cloudflare/waf-rules.md)
- Runbook operativo para salida a produccion:
   - [deploy/runbook-production.md](deploy/runbook-production.md)

## Seguridad aplicada

- `helmet` para cabeceras de seguridad.
- `express-rate-limit` para anti abuso.
- `hpp` para evitar contaminacion de parametros.
- Validacion estricta con `zod`.
- `x-powered-by` deshabilitado.
- Limite de payload en API.

## Endpoints

- `GET /api/health` estado del servicio.
- `GET /api/public-config` configuracion publica para Power BI.
- `POST /api/contact` envio de leads.
- `POST /api/analytics` eventos anonimos.
