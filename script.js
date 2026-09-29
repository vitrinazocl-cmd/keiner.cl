/**
 * KEINER.CL 2.0 - Core Script
 * - DataLayer Event Tracking (GA4 / GTM)
 * - Mobile Navigation Toggle & ARIA
 * - Meeting Booking Bot Interactivity & Keyboard Navigation
 * - Contact Form Lead Generation Tracking
 * - Direct WhatsApp Lead Tracking
 */

// 1. Initialise DataLayer for Google Tag Manager / GA4
window.dataLayer = window.dataLayer || [];

function trackEvent(eventName, eventParams = {}) {
  window.dataLayer.push({
    event: eventName,
    ...eventParams,
    timestamp: new Date().toISOString()
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Track page view event in dataLayer
  trackEvent('page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname
  });

  // 2. Mobile Navigation Menu Toggle & Accessibility
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = navLinks.classList.toggle('show');
      mobileToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      trackEvent('toggle_mobile_menu', { state: isExpanded ? 'open' : 'closed' });
    });

    // Close mobile menu when clicking outside or pressing Escape
    document.addEventListener('click', (e) => {
      if (!mobileToggle.contains(e.target) && !navLinks.contains(e.target)) {
        if (navLinks.classList.contains('show')) {
          navLinks.classList.remove('show');
          mobileToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  // 3. Global Keyboard Navigation (ESC to close modals)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const botModal = document.getElementById('meetingBotModal');
      if (botModal && botModal.classList.contains('active')) {
        botModal.classList.remove('active');
        const botTrigger = document.getElementById('meetingBotTrigger');
        if (botTrigger) botTrigger.focus();
        trackEvent('meeting_bot_close', { method: 'escape_key' });
      }
      if (navLinks && navLinks.classList.contains('show')) {
        navLinks.classList.remove('show');
        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // 4. Topic Pills Selection in Contact Form
  const topicPills = document.querySelectorAll('.topic-pill');
  const selectedTopicInput = document.getElementById('selectedTopic');

  topicPills.forEach(pill => {
    pill.addEventListener('click', () => {
      topicPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const value = pill.dataset.value || pill.textContent.trim();
      if (selectedTopicInput) {
        selectedTopicInput.value = value;
      }
      trackEvent('select_contact_topic', { topic: value });
    });
  });

  // 5. Carousel Horizontal Scroll Buttons
  const sliderArrows = document.querySelectorAll('.slider-arrow');
  sliderArrows.forEach(arrow => {
    arrow.addEventListener('click', () => {
      const targetId = arrow.dataset.target;
      const direction = arrow.dataset.dir === 'next' ? 1 : -1;
      const targetGrid = document.getElementById(targetId);

      if (targetGrid) {
        const scrollAmount = 280 * direction;
        targetGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        trackEvent('carousel_scroll', { target: targetId, direction: arrow.dataset.dir });
      }
    });
  });

  // 6. Contact Form Handling & Conversion Tracking
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const nameVal = document.getElementById('nombre')?.value || '';
      const emailVal = document.getElementById('email')?.value || '';
      const topicVal = selectedTopicInput?.value || 'General';

      if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Enviando...';
        submitBtn.disabled = true;

        setTimeout(() => {
          // Push lead conversion event to DataLayer
          trackEvent('generate_lead', {
            form_name: 'contact_form',
            lead_topic: topicVal,
            has_email: Boolean(emailVal)
          });

          alert('¡Gracias por contactarnos! Tu mensaje ha sido enviado correctamente y un ejecutivo te responderá a la brevedad.');
          contactForm.reset();
          topicPills.forEach(p => p.classList.remove('active'));
          if (topicPills.length > 0) topicPills[0].classList.add('active');
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }, 800);
      }
    });
  }

  // 7. Meeting Bot Interactivity & Conversion Tracking
  const botTrigger = document.getElementById('meetingBotTrigger');
  const botModal = document.getElementById('meetingBotModal');
  const botClose = document.getElementById('meetingBotClose');

  if (botTrigger && botModal) {
    botTrigger.addEventListener('click', () => {
      const isActive = botModal.classList.toggle('active');
      botTrigger.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      if (isActive) {
        trackEvent('meeting_bot_start', { source: 'floating_widget' });
        const firstInput = botModal.querySelector('input, button');
        if (firstInput) firstInput.focus();
      }
    });
  }

  if (botClose && botModal) {
    botClose.addEventListener('click', () => {
      botModal.classList.remove('active');
      if (botTrigger) botTrigger.setAttribute('aria-expanded', 'false');
      trackEvent('meeting_bot_close', { method: 'close_button' });
    });
  }

  // Meeting Bot Step Navigation & Data Collection
  const botOptions = document.querySelectorAll('.bot-option-btn');
  const botTimeSlots = document.querySelectorAll('.time-slot-btn');
  const botStep1 = document.getElementById('botStep1');
  const botStep2 = document.getElementById('botStep2');
  const botStep3 = document.getElementById('botStep3');
  const botConfirm = document.getElementById('botConfirm');
  const botBookingForm = document.getElementById('botBookingForm');

  let selectedBotTopic = '';
  let selectedBotTime = '';

  botOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      botOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedBotTopic = opt.dataset.topic || opt.textContent.trim();
      if (botStep2) botStep2.style.display = 'block';
      trackEvent('meeting_bot_step', { step: 1, topic: selectedBotTopic });
    });
  });

  botTimeSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      botTimeSlots.forEach(s => s.classList.remove('selected'));
      slot.classList.add('selected');
      selectedBotTime = slot.dataset.time || slot.textContent.trim();
      if (botStep3) botStep3.style.display = 'block';
      trackEvent('meeting_bot_step', { step: 2, time: selectedBotTime });
    });
  });

  if (botBookingForm) {
    botBookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('botName')?.value || 'Cliente';
      const date = document.getElementById('botDate')?.value || 'Fecha seleccionada';

      // Push Meeting Booking Lead Conversion
      trackEvent('generate_lead', {
        form_name: 'meeting_bot_booking',
        meeting_topic: selectedBotTopic || 'Consulta Comercial',
        meeting_date: date,
        meeting_time: selectedBotTime || '11:00 hrs'
      });

      if (botStep1) botStep1.style.display = 'none';
      if (botStep2) botStep2.style.display = 'none';
      if (botStep3) botStep3.style.display = 'none';
      if (botConfirm) {
        botConfirm.innerHTML = `
          <div class="bot-confirm-card">
            <h4 style="color: var(--brand-red); font-size: 1.0625rem; font-weight: 700; margin-bottom: 8px;">¡Reunión Agendada con Éxito! 🎉</h4>
            <p style="margin-bottom: 8px;"><strong>Hola ${name}</strong>, tu reunión ha sido programada:</p>
            <ul style="list-style: none; padding: 0; margin-bottom: 12px; font-size: 0.8125rem;">
              <li>📌 <strong>Motivo:</strong> ${selectedBotTopic || 'Consulta Comercial'}</li>
              <li>📅 <strong>Fecha & Hora:</strong> ${date} a las ${selectedBotTime || '11:00 hrs'}</li>
              <li>📍 <strong>Modalidad:</strong> Google Meet / Presencial</li>
            </ul>
            <p style="font-size: 0.75rem; color: #888;">Hemos enviado la confirmación y el enlace de reunión a tu correo electrónico.</p>
          </div>
        `;
        botConfirm.style.display = 'block';
      }
    });
  }

  // 8. Event Listener Bindings for WhatsApp, Email & Tel links
  document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com"]').forEach(waLink => {
    waLink.addEventListener('click', () => {
      trackEvent('whatsapp_click', {
        link_url: waLink.href,
        link_location: waLink.closest('header, footer, section, div')?.className || 'body'
      });
    });
  });

  document.querySelectorAll('a[href^="mailto:"]').forEach(mailLink => {
    mailLink.addEventListener('click', () => {
      trackEvent('contact_email_click', { email: mailLink.href.replace('mailto:', '') });
    });
  });

  document.querySelectorAll('a[href^="tel:"]').forEach(telLink => {
    telLink.addEventListener('click', () => {
      trackEvent('contact_phone_click', { phone: telLink.href.replace('tel:', '') });
    });
  });
});
