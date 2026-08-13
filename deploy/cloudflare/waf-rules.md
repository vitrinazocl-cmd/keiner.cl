# Cloudflare WAF baseline for KEINER.CL

## 1) DNS and SSL/TLS

- Proxy cloud enabled for `keiner.cl` and `www.keiner.cl`.
- SSL/TLS mode: `Full (strict)`.
- Always Use HTTPS: enabled.
- Automatic HTTPS Rewrites: enabled.
- Minimum TLS version: 1.2.

## 2) Managed protections

- WAF Managed Ruleset: enabled.
- OWASP Core Ruleset: enabled with anomaly threshold balanced.
- Bot Fight Mode or Super Bot Fight Mode: enabled.
- DDoS protection: enabled (default Cloudflare managed).

## 3) Custom WAF rules

### Rule A: Block non-allowed methods on API

- Expression:
  - `(http.request.uri.path starts_with "/api/") and not (http.request.method in {"GET" "POST" "OPTIONS"})`
- Action: `Block`.

### Rule B: Challenge suspicious requests to contact endpoint

- Expression:
  - `(http.request.uri.path eq "/api/contact") and (cf.threat_score gt 10 or cf.bot_management.score lt 30)`
- Action: `Managed Challenge`.

### Rule C: Block countries if your business scope requires geo restriction

- Expression example:
  - `(http.request.uri.path starts_with "/api/") and not (ip.geoip.country in {"CL" "PE" "CO"})`
- Action: `Block`.

## 4) Rate limiting rules

- Rule 1: `/api/contact`
  - Match: `http.request.uri.path eq "/api/contact"`
  - Threshold: 5 requests per 15 minutes per IP.
  - Action: Block 10 minutes.

- Rule 2: `/api/analytics`
  - Match: `http.request.uri.path eq "/api/analytics"`
  - Threshold: 40 requests per minute per IP.
  - Action: Managed Challenge.

## 5) Logging and observability

- Enable Security Events retention and alerts.
- Enable Logpush (if available) to SIEM or storage.
- Create alerts for:
  - spikes in blocked requests,
  - repeated challenge failures,
  - traffic anomalies by country/asn.

## 6) Deployment checks

- Verify headers from origin and edge after enabling rules.
- Confirm no false positives on normal contact form flow.
- Run a 24h monitor window before tightening thresholds.
