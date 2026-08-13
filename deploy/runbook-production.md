# Runbook: Next Step Production Hardening

This runbook applies hardened perimeter controls for the KEINER.CL corporate site.

## Prerequisites

- Node backend configured with secure `.env` values.
- Domain DNS ready and Cloudflare zone active.
- TLS certificate available on the origin host.

## Step 1: Configure origin (Nginx)

1. Copy config:
   - `deploy/nginx/keiner.cl.conf` -> `/etc/nginx/sites-available/keiner.cl.conf`
2. Link and test:
   - `ln -s /etc/nginx/sites-available/keiner.cl.conf /etc/nginx/sites-enabled/`
   - `nginx -t`
3. Reload:
   - `systemctl reload nginx`

## Step 2: Lock Node app environment

Set production variables:

- `NODE_ENV=production`
- `SITE_ORIGIN=https://www.keiner.cl`
- `ALLOWED_ORIGINS=https://www.keiner.cl,https://keiner.cl`
- `ENFORCE_HTTPS=true`
- `TRUSTED_IPS=` (set only if private network access is required)
- `SMTP_SECURE=true`

## Step 3: Cloudflare WAF

1. Apply baseline from `deploy/cloudflare/waf-rules.md`.
2. Start with Managed Challenge on strict rules.
3. Review logs 24h and then switch selected rules to Block.

## Step 4: Validate security posture

- API health: `GET /api/health` returns 200.
- HTTP must redirect to HTTPS with 308.
- HSTS, CSP and security headers visible.
- `/api/contact` rate limits activate on abuse.

## Step 5: Resilience controls

- Confirm PITR enabled on database and test restore monthly.
- Confirm SMTP credentials rotation policy.
- Confirm backup/RPO/RTO ownership and escalation path.

## Acceptance criteria

- No direct HTTP access.
- API only accepts allowed origin/methods.
- WAF active with rate limiting and bot controls.
- Security checklist completed and signed.
