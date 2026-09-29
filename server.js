import crypto from 'node:crypto';
import fs from 'node:fs';
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

const feriaLeadSchema = z.object({
  id: z.string().optional(),
  ticketCode: z.string().optional(),
  timestamp: z.string().optional(),
  fechaLectura: z.string().optional(),
  tipoContacto: z.string().trim().max(50),
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  celular: z.string().trim().min(5).max(30),
  email: z.string().trim().max(100).optional().default(''),
  empresa: z.string().trim().max(100).optional().default(''),
  categorias: z.string().trim().max(200).optional().default(''),
  comentarios: z.string().trim().max(1000).optional().default(''),
});

const dbDir = path.join(__dirname, 'db');
const feriaLeadsFile = path.join(dbDir, 'feria-leads.json');
const feriaLeadsHistoryFile = path.join(dbDir, 'feria-leads-history.jsonl');

function getFeriaLeadsData() {
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    if (!fs.existsSync(feriaLeadsFile)) {
      fs.writeFileSync(feriaLeadsFile, JSON.stringify([]), 'utf8');
      return [];
    }
    const content = fs.readFileSync(feriaLeadsFile, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('[feria_db_read_error]', err);
    return [];
  }
}

function saveFeriaLeadData(lead) {
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    // 1. Primary JSON DB
    const current = getFeriaLeadsData();
    current.unshift(lead);
    fs.writeFileSync(feriaLeadsFile, JSON.stringify(current, null, 2), 'utf8');

    // 2. Immutable Append-Only History Backup Log (.jsonl)
    fs.appendFileSync(feriaLeadsHistoryFile, JSON.stringify(lead) + '\n', 'utf8');
  } catch (err) {
    console.error('[feria_db_write_error]', err);
  }
}

function clearFeriaLeadsData() {
  // Permanently disabled to protect lead records
  console.log('[PERMANENT_STORAGE] Clear operation ignored to maintain permanent data records.');
}

const sanitize = (value) => value.replace(/[<>]/g, '');

const transport = buildTransport();

app.get('/contactoevento', (_req, res) => {
  res.sendFile(path.join(__dirname, 'contactoevento.html'));
});

app.get('/admin-feria', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin-feria.html'));
});

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

app.post('/api/feria-lead', async (req, res) => {
  const parseResult = feriaLeadSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ ok: false, error: 'invalid_payload' });
  }

  const lead = parseResult.data;
  saveFeriaLeadData(lead);

  // Send automatic email notifications to contacto@keiner.cl, domingo@keiner.cl AND to the user
  try {
    await sendFeriaLeadEmailNotification(transport, lead);
  } catch (err) {
    console.error('[feria_email_trigger_error]', err?.message || err);
  }

  return res.status(200).json({ ok: true, ticketCode: lead.ticketCode || 'KNR-OK' });
});

app.get('/api/feria-leads', (req, res) => {
  const pin = req.query.pin;
  if (pin !== 'keiner123' && pin !== 'keiner2026') {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const leads = getFeriaLeadsData();
  return res.status(200).json({ ok: true, leads });
});

app.post('/api/feria-leads/clear', (req, res) => {
  const pin = req.query.pin;
  if (pin !== 'keiner123' && pin !== 'keiner2026') {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  clearFeriaLeadsData();
  return res.status(200).json({ ok: true });
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

const DEFAULT_ADMIN_RECIPIENTS = 'contacto@keiner.cl, domingo@keiner.cl';

async function sendFeriaLeadEmailNotification(mailer, lead) {
  const source = process.env.CONTACT_FROM || 'contacto@keiner.cl';
  const adminRecipients = process.env.CONTACT_TO ? `${process.env.CONTACT_TO}, domingo@keiner.cl` : DEFAULT_ADMIN_RECIPIENTS;
  const userEmail = lead.email ? lead.email.trim() : '';

  // 1. Admin Email Notification (HTML & Text)
  const adminSubject = `[NUEVO LEAD FERIA] Ticket ${lead.ticketCode || 'N/A'} - ${lead.nombre} ${lead.apellido}`;
  const adminHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #0A0A0D; color: #FFFFFF; padding: 24px; border-radius: 12px; max-width: 650px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #22222E; padding-bottom: 16px;">
        <h2 style="color: #E60000; margin: 0; font-size: 1.5rem;">KEINER • Registro Feria Espacio Riesco</h2>
        <p style="color: #9CA3AF; font-size: 0.9rem; margin-top: 4px;">Nuevo visitante registrado para la Ruleta</p>
      </div>
      <div style="background: #14141A; border: 1px solid #22222E; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <div style="text-align: center; margin-bottom: 18px;">
          <span style="font-size: 0.75rem; color: #AAA; text-transform: uppercase; display: block; margin-bottom: 4px;">Código de Ticket Asignado</span>
          <span style="background: rgba(255, 215, 0, 0.15); border: 1.5px dashed #FFD700; color: #FFD700; font-family: monospace; font-size: 2rem; font-weight: 900; padding: 8px 20px; border-radius: 8px; display: inline-block;">
            ${lead.ticketCode || 'N/A'}
          </span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; color: #E5E7EB;">
          <tr><td style="padding: 6px 0; color: #9CA3AF; width: 140px;">Perfil:</td><td style="padding: 6px 0; font-weight: bold; color: #60A5FA;">${lead.tipoContacto || 'CLIENTE'}</td></tr>
          <tr><td style="padding: 6px 0; color: #9CA3AF;">Nombre:</td><td style="padding: 6px 0; font-weight: bold;">${lead.nombre} ${lead.apellido}</td></tr>
          <tr><td style="padding: 6px 0; color: #9CA3AF;">Celular:</td><td style="padding: 6px 0; font-family: monospace; color: #4ADE80;">${lead.celular}</td></tr>
          <tr><td style="padding: 6px 0; color: #9CA3AF;">Email:</td><td style="padding: 6px 0;">${lead.email || 'No especificado'}</td></tr>
          <tr><td style="padding: 6px 0; color: #9CA3AF;">Empresa:</td><td style="padding: 6px 0;">${lead.empresa || 'No especificada'}</td></tr>
          <tr><td style="padding: 6px 0; color: #9CA3AF;">Categorías Interés:</td><td style="padding: 6px 0;">${lead.categorias || 'Ninguna'}</td></tr>
          <tr><td style="padding: 6px 0; color: #9CA3AF;">Comentarios:</td><td style="padding: 6px 0;">${lead.comentarios || 'Sin comentarios'}</td></tr>
          <tr><td style="padding: 6px 0; color: #9CA3AF;">Fecha / Hora:</td><td style="padding: 6px 0;">${lead.fechaLectura || new Date().toLocaleString('es-CL')}</td></tr>
        </table>
      </div>
    </div>
  `;

  if (mailer) {
    // A) Send to Admin Email Addresses (contacto@keiner.cl & domingo@keiner.cl)
    try {
      await mailer.sendMail({
        to: adminRecipients,
        from: source,
        replyTo: userEmail || source,
        subject: adminSubject,
        html: adminHtml,
        text: `Nuevo Lead Feria: ${lead.nombre} ${lead.apellido} | Tel: ${lead.celular} | Email: ${lead.email || 'N/A'} | Ticket: ${lead.ticketCode}`
      });
      console.log(`[MAIL_ADMIN_SUCCESS] Feria lead notification sent to: ${adminRecipients}`);
    } catch (err) {
      console.error('[MAIL_ADMIN_ERROR]', err?.message || err);
    }

    // B) Send Confirmation Email directly to User (if user provided email)
    if (userEmail && userEmail.includes('@')) {
      const userSubject = `¡Registro Exitoso! Tu Código de Ruleta KEINER: ${lead.ticketCode || 'KNR'}`;
      const userHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #0A0A0D; color: #FFFFFF; padding: 30px; border-radius: 14px; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #FFFFFF; font-size: 1.6rem; margin-bottom: 6px;">¡Hola, ${lead.nombre}!</h1>
            <p style="color: #4ADE80; font-size: 0.95rem; font-weight: bold; margin: 0;">Tu registro para la Feria Espacio Riesco 2026 ha sido exitoso</p>
          </div>
          
          <div style="background: #14141A; border: 2px dashed #E60000; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <p style="color: #9CA3AF; font-size: 0.85rem; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Muestra este código en el Stand KEINER para girar la ruleta y ganar premios:</p>
            <div style="font-size: 2.5rem; font-weight: 900; color: #FFD700; font-family: monospace; letter-spacing: 3px; margin: 12px 0;">
              ${lead.ticketCode || 'KNR-OK'}
            </div>
            <p style="color: #E5E7EB; font-size: 1rem; font-weight: bold; margin: 0;">${lead.nombre} ${lead.apellido}</p>
          </div>

          <div style="background: #1C1C26; padding: 18px; border-radius: 10px; font-size: 0.9rem; color: #D1D5DB; margin-bottom: 24px; line-height: 1.6;">
            <p style="margin-top: 0; font-weight: bold; color: #FFF;">Detalles de tu registro:</p>
            <ul style="padding-left: 20px; margin-bottom: 0;">
              <li><strong>Celular:</strong> ${lead.celular}</li>
              ${lead.empresa ? `<li><strong>Empresa:</strong> ${lead.empresa}</li>` : ''}
              ${lead.categorias ? `<li><strong>Categorías de Interés:</strong> ${lead.categorias}</li>` : ''}
            </ul>
          </div>

          <div style="text-align: center; border-top: 1px solid #22222E; padding-top: 20px; color: #9CA3AF; font-size: 0.82rem;">
            <p style="margin: 0 0 6px 0; font-weight: bold; color: #FFF;">KEINER SpA • Distribución & Representación Comercial</p>
            <p style="margin: 0;">Mesa Central: +56 9 7688 6689 | Email: contacto@keiner.cl | www.keiner.cl</p>
          </div>
        </div>
      `;

      try {
        await mailer.sendMail({
          to: userEmail,
          from: source,
          subject: userSubject,
          html: userHtml,
          text: `Hola ${lead.nombre}, tu registro ha sido exitoso. Tu código para la ruleta en Espacio Riesco es: ${lead.ticketCode}`
        });
        console.log(`[MAIL_USER_SUCCESS] Feria ticket confirmation sent to user: ${userEmail}`);
      } catch (err) {
        console.error('[MAIL_USER_ERROR]', err?.message || err);
      }
    }
  } else {
    console.log('[DEV_MAIL_SIMULATION] Feria Lead:', {
      ticketCode: lead.ticketCode,
      admins: adminRecipients,
      userEmail: userEmail
    });
  }
}

async function sendContactEmail(mailer, payload, submissionId) {
  const source = process.env.CONTACT_FROM || 'contacto@keiner.cl';
  const adminRecipients = process.env.CONTACT_TO ? `${process.env.CONTACT_TO}, domingo@keiner.cl` : DEFAULT_ADMIN_RECIPIENTS;
  const userEmail = payload.correo ? payload.correo.trim() : '';

  const adminSubject = `[KEINER WEB] Nuevo contacto de ${payload.nombre} (${payload.empresa || 'Particular'})`;
  const adminText = [
    `Solicitud ID: ${submissionId}`,
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

  if (mailer) {
    // 1. Send to Admins (contacto@keiner.cl & domingo@keiner.cl)
    try {
      await mailer.sendMail({
        to: adminRecipients,
        from: source,
        replyTo: userEmail || source,
        subject: adminSubject,
        text: adminText,
      });
      console.log(`[MAIL_ADMIN_SUCCESS] Contact form notification sent to: ${adminRecipients}`);
    } catch (err) {
      console.error('[MAIL_ADMIN_ERROR]', err?.message || err);
    }

    // 2. Send receipt confirmation to User
    if (userEmail && userEmail.includes('@')) {
      const userSubject = `Hemos recibido tu mensaje - KEINER SpA`;
      const userHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #0A0A0D; color: #FFFFFF; padding: 28px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #FFFFFF; margin: 0 0 6px 0;">¡Gracias por contactarnos, ${payload.nombre}!</h2>
            <p style="color: #4ADE80; font-size: 0.95rem; font-weight: bold; margin: 0;">Hemos recibido tu solicitud correctamente</p>
          </div>
          <div style="background: #14141A; border: 1px solid #22222E; padding: 18px; border-radius: 10px; font-size: 0.9rem; color: #D1D5DB; margin-bottom: 20px; line-height: 1.6;">
            <p style="margin-top: 0;">Un ejecutivo comercial de KEINER SpA revisará tu mensaje y se pondrá en contacto contigo a la brevedad.</p>
            <p style="margin-bottom: 0;"><strong>Tu mensaje enviado:</strong><br><em style="color: #9CA3AF;">"${payload.mensaje}"</em></p>
          </div>
          <div style="text-align: center; border-top: 1px solid #22222E; padding-top: 18px; color: #9CA3AF; font-size: 0.82rem;">
            <p style="margin: 0 0 4px 0; font-weight: bold; color: #FFF;">KEINER SpA • Distribución & Representación Comercial</p>
            <p style="margin: 0;">Mesa Central: +56 9 7688 6689 | Email: contacto@keiner.cl | www.keiner.cl</p>
          </div>
        </div>
      `;

      try {
        await mailer.sendMail({
          to: userEmail,
          from: source,
          subject: userSubject,
          html: userHtml,
          text: `Hola ${payload.nombre}, hemos recibido tu mensaje. Un ejecutivo de KEINER se contactará contigo a la brevedad.`
        });
        console.log(`[MAIL_USER_SUCCESS] Contact receipt confirmation sent to user: ${userEmail}`);
      } catch (err) {
        console.error('[MAIL_USER_ERROR]', err?.message || err);
      }
    }
  } else {
    console.log('[DEV_MAIL_SIMULATION] Contact Form:', {
      submissionId,
      admins: adminRecipients,
      userEmail: userEmail
    });
  }
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
