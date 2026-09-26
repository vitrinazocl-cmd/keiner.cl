import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import compression from 'compression';
import nodemailer from 'nodemailer';
import { z } from 'zod';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const port = Number(process.env.PORT || 3000);
const siteOrigin = process.env.SITE_ORIGIN || `http://localhost:${port}`;
const nodeEnv = process.env.NODE_ENV || 'development';
const enforceHttps = String(process.env.ENFORCE_HTTPS || 'false').toLowerCase() === 'true';
const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS, siteOrigin);
const trustedIps = parseTrustedIps(process.env.TRUSTED_IPS);
const contactLimit = Number(process.env.RATE_LIMIT_CONTACT_MAX || 5);
const analyticsLimit = Number(process.env.RATE_LIMIT_ANALYTICS_MAX || 40);
const chatLimit = Number(process.env.RATE_LIMIT_CHAT_MAX || 30);
const powerBiFrameOrigins = parseFrameOrigins(process.env.POWER_BI_EMBED_URL);

app.disable('x-powered-by');
app.set('trust proxy', true);

app.use((req, res, next) => {
  if (!enforceHttps) {
    return next();
  }

  const forwardedProto = String(req.get('x-forwarded-proto') || req.protocol).toLowerCase();
  if (forwardedProto === 'https') {
    return next();
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    const host = req.get('host');
    return res.redirect(308, `https://${host}${req.originalUrl}`);
  }

  return res.status(400).json({ ok: false, error: 'https_required' });
});

app.use(
  helmet({
    hsts: enforceHttps
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        frameSrc: ["'self'", ...powerBiFrameOrigins],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        mediaSrc: ["'self'", 'blob:', 'data:'],
        connectSrc: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(hpp());
app.use(compression());
app.use(express.json({ limit: '10kb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const origin = req.get('origin');
  if (origin) {
    if (!allowedOrigins.has(origin)) {
      return res.status(403).json({ ok: false, error: 'invalid_origin' });
    }

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }

  return next();
});

app.use('/api', (req, res, next) => {
  if (trustedIps.size === 0) {
    return next();
  }

  const ip = normalizeIp(req.ip || '');
  if (!trustedIps.has(ip)) {
    return res.status(403).json({ ok: false, error: 'network_restricted' });
  }

  return next();
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number.isFinite(contactLimit) && contactLimit > 0 ? contactLimit : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'too_many_requests' },
});

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number.isFinite(analyticsLimit) && analyticsLimit > 0 ? analyticsLimit : 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'too_many_requests' },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number.isFinite(chatLimit) && chatLimit > 0 ? chatLimit : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'too_many_requests' },
});

const contactSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  empresa: z.string().trim().min(2).max(80),
  correo: z.string().trim().email().max(120),
  mensaje: z.string().trim().min(15).max(1200),
  necesidad: z.string().trim().max(40).optional().default(''),
  perfil: z.string().trim().max(40).optional().default(''),
  horizonte: z.string().trim().max(40).optional().default(''),
  integracion: z.string().trim().max(40).optional().default(''),
  website: z.string().trim().max(0).optional().default(''),
  aceptoPolitica: z.boolean().refine((value) => value === true),
});

const analyticsSchema = z
  .object({
    type: z.enum(['page_view', 'event']),
    path: z.string().trim().min(1).max(180),
    title: z.string().trim().min(1).max(180).optional(),
    name: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

const chatSchema = z
  .object({
    message: z.string().trim().min(1).max(300),
  })
  .strict();

const sanitize = (value) => value.replace(/[<>]/g, '');

const transport = buildTransport();

app.use(express.static(__dirname, {
  etag: true,
  maxAge: '1h',
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    if (/\.(css|js|svg|png|jpg|jpeg|webp|avif|ico)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      return;
    }

    if (/\.html$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=300');
    }
  },
}));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, status: 'up' });
});

app.get('/api/public-config', (_req, res) => {
  res.status(200).json({
    ok: true,
    powerBi: getPublicPowerBiConfig(),
  });
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  const parseResult = contactSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ ok: false, error: 'invalid_payload' });
  }

  const payload = parseResult.data;
  const origin = req.get('origin');
  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ ok: false, error: 'invalid_origin' });
  }

  const submissionId = crypto.randomUUID();

  const safeData = {
    nombre: sanitize(payload.nombre),
    empresa: sanitize(payload.empresa),
    correo: sanitize(payload.correo),
    mensaje: sanitize(payload.mensaje),
    necesidad: sanitize(payload.necesidad || ''),
    perfil: sanitize(payload.perfil || ''),
    horizonte: sanitize(payload.horizonte || ''),
    integracion: sanitize(payload.integracion || ''),
  };

  try {
    await sendContactEmail(transport, safeData, submissionId);
    await sendLeadWebhook(safeData, submissionId);
  } catch (_error) {
    return res.status(500).json({ ok: false, error: 'delivery_failed' });
  }

  return res.status(200).json({ ok: true, submissionId });
});

app.post('/api/analytics', analyticsLimiter, (req, res) => {
  const parseResult = analyticsSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ ok: false, error: 'invalid_payload' });
  }

  const origin = req.get('origin');
  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ ok: false, error: 'invalid_origin' });
  }

  const ipHash = crypto
    .createHash('sha256')
    .update(String(req.ip || 'unknown'))
    .digest('hex')
    .slice(0, 16);

  const event = {
    at: new Date().toISOString(),
    ipHash,
    ua: sanitize(String(req.get('user-agent') || '').slice(0, 180)),
    ...parseResult.data,
  };

  console.log('[analytics]', JSON.stringify(event));
  return res.status(204).send();
});

app.post('/api/chat', chatLimiter, (req, res) => {
  const parseResult = chatSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ ok: false, error: 'invalid_payload' });
  }

  const origin = req.get('origin');
  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ ok: false, error: 'invalid_origin' });
  }

  const answer = getChatReply(parseResult.data.message);
  return res.status(200).json({ ok: true, reply: answer });
});

app.use((err, _req, res, _next) => {
  console.error('[server_error]', err?.message || 'unknown_error');
  return res.status(500).json({ ok: false, error: 'server_error' });
});

app.listen(port, () => {
  console.log(`KEINER corporativo escuchando en ${siteOrigin}`);
});

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sendContactEmail(mailer, payload, submissionId) {
  const target = process.env.CONTACT_TO;
  const source = process.env.CONTACT_FROM;

  if (!target || !source) {
    throw new Error('missing_mail_configuration');
  }

  const text = [
    `Solicitud: ${submissionId}`,
    `Nombre: ${payload.nombre}`,
    `Empresa: ${payload.empresa}`,
    `Correo: ${payload.correo}`,
    payload.necesidad ? `Necesidad principal: ${payload.necesidad}` : '',
    payload.perfil ? `Tipo de visitante: ${payload.perfil}` : '',
    payload.horizonte ? `Plazo esperado: ${payload.horizonte}` : '',
    payload.integracion ? `Canal de seguimiento: ${payload.integracion}` : '',
    '',
    'Mensaje:',
    payload.mensaje,
  ].filter(Boolean).join('\n');

  if (!mailer) {
    if (nodeEnv === 'production') {
      throw new Error('missing_smtp_transport');
    }

    console.log('[contact_submission_dev]', JSON.stringify({ submissionId, email: maskEmail(payload.correo) }));
    return;
  }

  await mailer.sendMail({
    to: target,
    from: source,
    replyTo: payload.correo,
    subject: `[KEINER] Nuevo lead corporativo (${submissionId})`,
    text,
  });
}

async function sendLeadWebhook(payload, submissionId) {
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  const token = process.env.LEAD_WEBHOOK_TOKEN;
  const tokenHeader = process.env.LEAD_WEBHOOK_TOKEN_HEADER || 'x-keiner-token';
  if (token) {
    headers[tokenHeader] = token;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      submissionId,
      source: 'keiner-web-corporativo',
      receivedAt: new Date().toISOString(),
      lead: payload,
    }),
  });

  if (!response.ok) {
    throw new Error('lead_webhook_failed');
  }
}

function getPublicPowerBiConfig() {
  const embedUrl = String(process.env.POWER_BI_EMBED_URL || '').trim();
  const title = String(process.env.POWER_BI_EMBED_TITLE || 'Dashboard Power BI KEINER').trim();

  if (!embedUrl) {
    return { enabled: false };
  }

  try {
    const url = new URL(embedUrl);
    if (url.protocol !== 'https:') {
      return { enabled: false };
    }

    return {
      enabled: true,
      embedUrl: url.toString(),
      title: sanitize(title).slice(0, 120),
    };
  } catch {
    return { enabled: false };
  }
}

function parseAllowedOrigins(envValue, fallbackOrigin) {
  const source = envValue || fallbackOrigin;
  const entries = source
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const result = new Set();
  entries.forEach((entry) => {
    try {
      result.add(new URL(entry).origin);
    } catch {
      // Ignore malformed origin entries from env.
    }
  });

  return result;
}

function parseTrustedIps(envValue) {
  if (!envValue) {
    return new Set();
  }

  return new Set(
    envValue
      .split(',')
      .map((ip) => normalizeIp(ip.trim()))
      .filter(Boolean)
  );
}

function parseFrameOrigins(embedUrl) {
  if (!embedUrl) {
    return ['https://app.powerbi.com', 'https://*.powerbi.com'];
  }

  try {
    const origin = new URL(embedUrl).origin;
    return Array.from(new Set(['https://app.powerbi.com', 'https://*.powerbi.com', origin]));
  } catch {
    return ['https://app.powerbi.com', 'https://*.powerbi.com'];
  }
}

function normalizeIp(value) {
  if (!value) {
    return '';
  }

  return value.replace('::ffff:', '').trim();
}

function maskEmail(email) {
  const [userPart, domainPart] = String(email).split('@');
  if (!userPart || !domainPart) {
    return 'hidden';
  }

  const prefix = userPart.slice(0, 2);
  return `${prefix}***@${domainPart}`;
}

function getChatReply(message) {
  const text = sanitize(message).toLowerCase();

  if (text.includes('hunting') || text.includes('producto')) {
    return 'En Hunting de Productos buscamos alternativas nacionales y globales para complementar tu oferta. Si quieres, te ayudo a iniciar la solicitud desde Contacto.';
  }

  if (text.includes('represent') || text.includes('marca') || text.includes('canal')) {
    return 'En Representacion gestionamos presentacion comercial, planeacion de demanda y coordinacion operativa para el mercado local.';
  }

  if (text.includes('consult') || text.includes('asesor')) {
    return 'En Consultoria analizamos oportunidades y requerimientos para adaptar producto y categoria con foco en cliente local.';
  }

  if (text.includes('tiempo') || text.includes('plazo') || text.includes('respuesta')) {
    return 'Nuestro compromiso es responder en menos de 24 horas habiles para coordinar el siguiente paso comercial.';
  }

  if (text.includes('contact') || text.includes('reunion')) {
    return 'Puedes usar el formulario de contacto para agendar una reunion y contarnos tu necesidad principal.';
  }

  return 'Gracias por escribirnos. Podemos ayudarte en Hunting de Productos, Representacion y Consultoria. Cuentame tu necesidad principal y te orientamos.';
}
