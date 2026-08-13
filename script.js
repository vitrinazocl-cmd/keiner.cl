const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');
const consentKey = 'keiner_analytics_consent';
const topbar = document.querySelector('.topbar');
const scrollProgress = document.getElementById('scroll-progress');

const pathname = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.menu a').forEach((link) => {
  const href = link.getAttribute('href') || '';
  if (!href || href.startsWith('#') || href.startsWith('http')) {
    return;
  }

  const normalized = href.split('/').pop() || 'index.html';
  if (normalized === pathname) {
    link.classList.add('is-current');
  }
});

const syncScrollUi = () => {
  const scrollTop = window.scrollY;
  const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;

  if (scrollProgress instanceof HTMLElement) {
    scrollProgress.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
  }

  if (topbar instanceof HTMLElement) {
    topbar.classList.toggle('is-scrolled', scrollTop > 12);
  }
};

window.addEventListener('scroll', syncScrollUi, { passive: true });
syncScrollUi();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore service worker registration errors silently.
    });
  });
}

prefetchInternalLinks();

if (menuToggle && menu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  menu.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLAnchorElement) {
      menu.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.2,
  }
);

document.querySelectorAll('.reveal').forEach((element) => {
  observer.observe(element);
});

const counters = document.querySelectorAll('[data-count]');
const animateCounters = () => {
  counters.forEach((counter) => {
    const targetValue = Number(counter.getAttribute('data-count'));
    const duration = 1100;
    const startTime = performance.now();

    const tick = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const currentValue = Math.floor(progress * targetValue);
      counter.textContent = String(currentValue);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        counter.textContent = String(targetValue);
      }
    };

    requestAnimationFrame(tick);
  });
};

if (counters.length > 0) {
  const counterBlock = counters[0].closest('.hero-card');

  if (counterBlock) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounters();
            counterObserver.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );

    counterObserver.observe(counterBlock);
  }
}

const form = document.querySelector('.contact-form');
const feedback = document.querySelector('.form-feedback');

if (form instanceof HTMLFormElement && feedback) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const nombre = String(formData.get('nombre') || '').trim();
    const empresa = String(formData.get('empresa') || '').trim();
    const correo = String(formData.get('correo') || '').trim();
    const mensaje = String(formData.get('mensaje') || '').trim();
    const necesidad = String(formData.get('necesidad') || '').trim();
    const perfil = String(formData.get('perfil') || '').trim();
    const horizonte = String(formData.get('horizonte') || '').trim();
    const integracion = String(formData.get('integracion') || '').trim();
    const website = String(formData.get('website') || '').trim();
    const aceptoPolitica = Boolean(formData.get('aceptoPolitica'));

    if (!nombre || !empresa || !correo || !mensaje) {
      feedback.textContent = 'Completa todos los campos antes de enviar.';
      return;
    }

    if (website) {
      feedback.textContent = 'No fue posible procesar la solicitud.';
      return;
    }

    if (!aceptoPolitica) {
      feedback.textContent = 'Debes aceptar la Politica de Privacidad para continuar.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      feedback.textContent = 'Ingresa un correo valido.';
      return;
    }

    feedback.textContent = 'Enviando solicitud...';

    const enrichedMessage = buildEnrichedMessage({
      mensaje,
      necesidad,
      perfil,
      horizonte,
      integracion,
    });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          empresa,
          correo,
          necesidad,
          perfil,
          horizonte,
          integracion,
          mensaje: enrichedMessage,
          website,
          aceptoPolitica,
        }),
      });

      if (!response.ok) {
        feedback.textContent = 'No fue posible enviar. Intenta nuevamente en unos minutos.';
        return;
      }

      feedback.textContent = 'Solicitud enviada. Te contactaremos a la brevedad.';
      form.reset();
      trackEvent('lead_form_submitted');
    } catch (_error) {
      feedback.textContent = 'Sin conexion con el servicio. Intenta nuevamente.';
    }
  });
}

const yearElement = document.getElementById('year');
if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}

const consentBanner = document.getElementById('consent-banner');
const consentAccept = document.getElementById('consent-accept');
const consentReject = document.getElementById('consent-reject');

const getConsent = () => localStorage.getItem(consentKey);

const setConsent = (value) => {
  localStorage.setItem(consentKey, value);
  if (consentBanner instanceof HTMLElement) {
    consentBanner.hidden = true;
  }
  if (value === 'accepted') {
    trackEvent('analytics_consent_accepted');
    trackPageView();
  }
};

if (consentBanner instanceof HTMLElement) {
  const currentConsent = getConsent();
  consentBanner.hidden = currentConsent === 'accepted' || currentConsent === 'rejected';
}

if (consentAccept instanceof HTMLButtonElement) {
  consentAccept.addEventListener('click', () => setConsent('accepted'));
}

if (consentReject instanceof HTMLButtonElement) {
  consentReject.addEventListener('click', () => setConsent('rejected'));
}

async function sendAnalytics(payload) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (_error) {
    // Avoid surfacing analytics errors to users.
  }
}

function trackPageView() {
  if (getConsent() !== 'accepted') {
    return;
  }

  sendAnalytics({
    type: 'page_view',
    path: window.location.pathname,
    title: document.title,
  });
}

function trackEvent(name) {
  if (getConsent() !== 'accepted') {
    return;
  }

  sendAnalytics({
    type: 'event',
    name,
    path: window.location.pathname,
  });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', () => {
    const href = anchor.getAttribute('href');
    if (href) {
      trackEvent(`navigate_${href.replace('#', '')}`);
    }
  });
});

if (getConsent() === 'accepted') {
  trackPageView();
}

initPowerBiEmbeds();
initChatAssistant();

function buildEnrichedMessage({ mensaje, necesidad, perfil, horizonte, integracion }) {
  const blocks = [mensaje];

  const hasFunnelData = necesidad || perfil || horizonte || integracion;
  if (hasFunnelData) {
    blocks.push('');
    blocks.push('Contexto comercial:');

    if (necesidad) {
      blocks.push(`- Necesidad principal: ${necesidad}`);
    }

    if (perfil) {
      blocks.push(`- Tipo de visitante: ${perfil}`);
    }

    if (horizonte) {
      blocks.push(`- Plazo esperado: ${horizonte}`);
    }

    if (integracion) {
      blocks.push(`- Canal de seguimiento: ${integracion}`);
    }
  }

  return blocks.join('\n').slice(0, 1200);
}

function prefetchInternalLinks() {
  const prefetched = new Set();
  const supportsPrefetch =
    document.createElement('link').relList &&
    document.createElement('link').relList.supports('prefetch');

  if (!supportsPrefetch) {
    return;
  }

  document.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener(
      'mouseenter',
      () => {
        const href = link.getAttribute('href') || '';
        if (!href || href.startsWith('#') || href.startsWith('http') || prefetched.has(href)) {
          return;
        }

        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = href;
        document.head.append(prefetchLink);
        prefetched.add(href);
      },
      { passive: true }
    );
  });
}

async function initPowerBiEmbeds() {
  const mounts = Array.from(document.querySelectorAll('[data-powerbi-embed]'));
  if (mounts.length === 0) {
    return;
  }

  try {
    const response = await fetch('/api/public-config', {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const powerBi = data?.powerBi;
    if (!powerBi || powerBi.enabled !== true || !powerBi.embedUrl) {
      return;
    }

    mounts.forEach((mount) => {
      const placeholder = mount.querySelector('[data-powerbi-placeholder]');
      if (placeholder instanceof HTMLElement) {
        placeholder.hidden = true;
      }

      const iframe = document.createElement('iframe');
      iframe.className = 'power-bi-frame';
      iframe.src = powerBi.embedUrl;
      iframe.title = String(powerBi.title || 'Dashboard Power BI KEINER');
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;
      mount.append(iframe);
    });
  } catch {
    // Keep static placeholder when public config is unavailable.
  }
}

function initChatAssistant() {
  const launcher = document.createElement('button');
  launcher.className = 'chat-launcher';
  launcher.type = 'button';
  launcher.setAttribute('aria-label', 'Abrir chat de atención');
  launcher.innerHTML = `
    <span class="chat-launcher-icon" aria-hidden="true">
      <svg viewBox="0 0 64 64" role="presentation" focusable="false">
        <defs>
          <linearGradient id="chat-bot-gradient" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
            <stop stop-color="#7fd0ff"></stop>
            <stop offset="1" stop-color="#2d79be"></stop>
          </linearGradient>
        </defs>
        <rect x="16" y="18" width="32" height="26" rx="10" fill="url(#chat-bot-gradient)"></rect>
        <rect x="22" y="44" width="20" height="6" rx="3" fill="#dff3ff"></rect>
        <rect x="28" y="10" width="8" height="10" rx="4" fill="#dff3ff"></rect>
        <circle cx="32" cy="9" r="4" fill="#5dbdff"></circle>
        <circle cx="26" cy="31" r="3.4" fill="#123960"></circle>
        <circle cx="38" cy="31" r="3.4" fill="#123960"></circle>
        <rect x="25" y="36.5" width="14" height="3.6" rx="1.8" fill="#123960"></rect>
        <rect x="11" y="24" width="7" height="13" rx="3.5" fill="#8bd7ff"></rect>
        <rect x="46" y="24" width="7" height="13" rx="3.5" fill="#8bd7ff"></rect>
      </svg>
    </span>
    <span class="chat-launcher-pulse" aria-hidden="true"></span>
  `;

  const panel = document.createElement('section');
  panel.className = 'chat-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Asistente de atención KEINER');

  panel.innerHTML = `
    <header class="chat-header">
      <h2>Asistente KEINER</h2>
      <button type="button" class="chat-close" aria-label="Cerrar chat">×</button>
    </header>
    <div class="chat-body" id="chat-body" role="log" aria-live="polite"></div>
    <form class="chat-form" id="chat-form">
      <input type="text" id="chat-input" maxlength="300" placeholder="Escribe tu consulta..." required>
      <button type="submit">Enviar</button>
    </form>
  `;

  document.body.append(launcher, panel);

  const closeButton = panel.querySelector('.chat-close');
  const chatBody = panel.querySelector('#chat-body');
  const chatForm = panel.querySelector('#chat-form');
  const chatInput = panel.querySelector('#chat-input');

  if (!(closeButton instanceof HTMLButtonElement) || !(chatBody instanceof HTMLElement) || !(chatForm instanceof HTMLFormElement) || !(chatInput instanceof HTMLInputElement)) {
    return;
  }

  const appendMessage = (from, text) => {
    const message = document.createElement('p');
    message.className = from === 'bot' ? 'chat-message chat-message--bot' : 'chat-message chat-message--user';
    message.textContent = text;
    chatBody.append(message);
    chatBody.scrollTop = chatBody.scrollHeight;
  };

  appendMessage('bot', 'Hola. Soy el asistente de KEINER. Puedo ayudarte con Hunting, Representación y Consultoría.');

  launcher.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    launcher.classList.toggle('is-open', !panel.hidden);
    if (!panel.hidden) {
      chatInput.focus();
    }
  });

  closeButton.addEventListener('click', () => {
    panel.hidden = true;
    launcher.classList.remove('is-open');
  });

  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message) {
      return;
    }

    appendMessage('user', message);
    chatInput.value = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        appendMessage('bot', 'No pude responder en este momento. Intenta nuevamente en unos segundos.');
        return;
      }

      const data = await response.json();
      appendMessage('bot', String(data.reply || 'Gracias por tu mensaje.'));
      trackEvent('chat_message_sent');
    } catch {
      appendMessage('bot', 'Sin conexión en este momento. Puedes escribirnos desde la página de contacto.');
    }
  });
}

const menuLinks = Array.from(document.querySelectorAll('.menu a[href^="#"]'));
const watchedSections = menuLinks
  .map((link) => {
    const href = link.getAttribute('href') || '';
    if (!href.startsWith('#')) {
      return null;
    }
    const section = document.querySelector(href);
    return section instanceof HTMLElement ? { link, section } : null;
  })
  .filter(Boolean);

if (watchedSections.length > 0) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        watchedSections.forEach((item) => {
          item.link.classList.toggle('is-current', item.section === entry.target);
        });
      });
    },
    {
      threshold: 0.55,
    }
  );

  watchedSections.forEach((item) => navObserver.observe(item.section));
}

const slice = document.getElementById('corporate-slice');
const sliceTrack = document.getElementById('slice-track');
const slicePrev = document.getElementById('slice-prev');
const sliceNext = document.getElementById('slice-next');
const sliceDots = document.getElementById('slice-dots');

if (
  slice instanceof HTMLElement &&
  sliceTrack instanceof HTMLElement &&
  slicePrev instanceof HTMLButtonElement &&
  sliceNext instanceof HTMLButtonElement &&
  sliceDots instanceof HTMLElement
) {
  const slides = Array.from(sliceTrack.querySelectorAll('.slice-item'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentIndex = Math.max(
    slides.findIndex((item) => item.classList.contains('is-active')),
    0
  );
  let timer = null;

  const update = (nextIndex) => {
    currentIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const isActive = index === currentIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });

    Array.from(sliceDots.querySelectorAll('.slice-dot')).forEach((dot, index) => {
      const isActive = index === currentIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
      dot.tabIndex = isActive ? 0 : -1;
    });
  };

  const next = () => update(currentIndex + 1);
  const prev = () => update(currentIndex - 1);

  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slice-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Ir a imagen ${index + 1}`);
    dot.addEventListener('click', () => {
      update(index);
      restartAutoplay();
    });
    sliceDots.append(dot);
  });

  const stopAutoplay = () => {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const startAutoplay = () => {
    const autoplayEnabled = slice.getAttribute('data-autoplay') === 'true';
    if (!autoplayEnabled || reducedMotion) {
      return;
    }

    stopAutoplay();
    timer = window.setInterval(next, 5500);
  };

  const restartAutoplay = () => {
    stopAutoplay();
    startAutoplay();
  };

  slicePrev.addEventListener('click', () => {
    prev();
    restartAutoplay();
  });

  sliceNext.addEventListener('click', () => {
    next();
    restartAutoplay();
  });

  slice.addEventListener('mouseenter', stopAutoplay);
  slice.addEventListener('mouseleave', startAutoplay);
  slice.addEventListener('focusin', stopAutoplay);
  slice.addEventListener('focusout', startAutoplay);
  slice.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      next();
      restartAutoplay();
    }
    if (event.key === 'ArrowLeft') {
      prev();
      restartAutoplay();
    }
  });

  update(currentIndex);
  startAutoplay();
}
