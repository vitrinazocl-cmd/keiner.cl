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

  // Hero Video Speed Normalization to 0.75x smooth natural speed
  const heroVideo = document.querySelector('.hero-full-img video, video.hero-full-img');
  if (heroVideo) {
    heroVideo.playbackRate = 0.75;
    heroVideo.addEventListener('loadedmetadata', () => {
      heroVideo.playbackRate = 0.75;
    });
  }

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
  topicPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const container = pill.closest('.topic-pills-container') || pill.parentElement;
      if (container) {
        container.querySelectorAll('.topic-pill').forEach(p => p.classList.remove('active'));
      }
      pill.classList.add('active');
      const value = pill.getAttribute('data-value') || pill.textContent.trim();
      const selectedTopicInput = document.getElementById('selectedTopic');
      if (selectedTopicInput) {
        selectedTopicInput.value = value;
      }
      trackEvent('select_contact_topic', { topic: value });
    });
  });

  document.addEventListener('click', (e) => {
    const pill = e.target.closest('.topic-pill');
    if (pill) {
      const container = pill.closest('.topic-pills-container') || pill.parentElement;
      if (container) {
        container.querySelectorAll('.topic-pill').forEach(p => p.classList.remove('active'));
      }
      pill.classList.add('active');
      const value = pill.getAttribute('data-value') || pill.textContent.trim();
      const selectedTopicInput = document.getElementById('selectedTopic');
      if (selectedTopicInput) {
        selectedTopicInput.value = value;
      }
    }
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
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const nombre = document.getElementById('nombre')?.value.trim() || '';
      const empresa = document.getElementById('empresa')?.value.trim() || '';
      const correo = document.getElementById('email')?.value.trim() || '';
      const telefono = document.getElementById('telefono')?.value.trim() || '';
      const mensaje = document.getElementById('mensaje')?.value.trim() || '';
      const selectedInput = document.getElementById('selectedTopic');
      const necesidad = selectedInput?.value || 'Distribución de mi marca';

      if (!nombre || !correo || !mensaje) {
        alert('Por favor completa los campos obligatorios: Nombre, Correo y Mensaje.');
        return;
      }

      if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Enviando...';
        submitBtn.disabled = true;

        const payload = {
          nombre: nombre,
          empresa: empresa || 'No especificada',
          correo: correo,
          mensaje: mensaje,
          necesidad: necesidad,
          perfil: 'CLIENTE',
          horizonte: 'Inmediato',
          integracion: telefono ? `Tel: ${telefono}` : '',
          aceptoPolitica: true
        };

        try {
          fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).catch(err => {});
        } catch (err) {}

        // Backup Dual Email Dispatch (contacto@keiner.cl & domingo@keiner.cl)
        try {
          fetch('https://formsubmit.co/ajax/contacto@keiner.cl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              _subject: `[KEINER WEB] Nuevo contacto de ${nombre}`,
              _cc: 'domingo@keiner.cl',
              _replyto: correo,
              Nombre: nombre,
              Empresa: empresa || 'No especificada',
              Email: correo,
              Telefono: telefono || 'No informado',
              Necesidad: necesidad,
              Mensaje: mensaje
            })
          }).catch(err => {});
        } catch(e) {}

        // Backup to Feria Leads store to display in Admin Dashboard
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const leadData = {
          id: Date.now().toString(),
          ticketCode: `KNR-${randomNum}`,
          timestamp: new Date().toISOString(),
          fechaLectura: new Date().toLocaleString('es-CL'),
          tipoContacto: 'CLIENTE',
          nombre: nombre,
          apellido: '',
          celular: telefono || 'No informado',
          email: correo,
          empresa: empresa || 'No informada',
          categorias: necesidad,
          comentarios: mensaje
        };
        try {
          const existing = JSON.parse(localStorage.getItem('keiner_feria_leads') || '[]');
          existing.unshift(leadData);
          localStorage.setItem('keiner_feria_leads', JSON.stringify(existing));
          fetch('/api/feria-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadData)
          }).catch(err => {});
        } catch(e) {}

        trackEvent('generate_lead', {
          form_name: 'contact_form',
          lead_topic: necesidad,
          has_email: Boolean(correo)
        });

        alert('¡Gracias por contactarnos! Tu mensaje ha sido enviado correctamente. Hemos enviado un respaldo a tu correo y un ejecutivo te responderá a la brevedad.');
        contactForm.reset();
        topicPills.forEach(p => p.classList.remove('active'));
        if (topicPills.length > 0) topicPills[0].classList.add('active');
        if (selectedTopicInput && topicPills.length > 0) {
          selectedTopicInput.value = topicPills[0].getAttribute('data-value') || topicPills[0].textContent.trim();
        }
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // 7. Feria Form Trigger & Conversion Tracking
  const botTrigger = document.getElementById('meetingBotTrigger');
  const botModal = document.getElementById('meetingBotModal');
  const botClose = document.getElementById('meetingBotClose');

  if (botTrigger) {
    botTrigger.addEventListener('click', (e) => {
      trackEvent('feria_button_click', { source: 'floating_widget' });
    });
  }

  if (botClose && botModal) {
    botClose.addEventListener('click', () => {
      botModal.classList.remove('active');
    });
  }

  // Modal Feria Form Handling
  const modalFeriaForm = document.getElementById('modalFeriaForm');
  const modalTicketScreen = document.getElementById('modalTicketScreen');
  const mDisplayCode = document.getElementById('mDisplayCode');
  const mDisplayName = document.getElementById('mDisplayName');
  const btnModalReset = document.getElementById('btnModalReset');

  if (modalFeriaForm) {
    modalFeriaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let nombre = document.getElementById('mNombre')?.value?.trim() || '';
      let apellido = document.getElementById('mApellido')?.value?.trim() || '';
      const paisCode = document.getElementById('mPais')?.value || '+56';
      const celularRaw = document.getElementById('mCelular')?.value?.trim() || '';

      if (nombre && !apellido && nombre.includes(' ')) {
        const parts = nombre.split(/\s+/);
        nombre = parts[0];
        apellido = parts.slice(1).join(' ');
      }

      if (!nombre || !celularRaw) {
        alert('Por favor completa los campos obligatorios: Nombre y Celular.');
        return;
      }

      const celular = `${paisCode} ${celularRaw}`;
      const tipoContacto = modalFeriaForm.querySelector('input[name="modalTipoContacto"]:checked')?.value || 'Cliente';
      const email = document.getElementById('mEmail')?.value?.trim() || '';
      const empresa = document.getElementById('mEmpresa')?.value?.trim() || '';
      const comentarios = document.getElementById('mComentarios')?.value?.trim() || '';

      const catEls = modalFeriaForm.querySelectorAll('input[name="mCat"]:checked');
      const categorias = Array.from(catEls).map(el => el.value);

      const existingLeads = JSON.parse(localStorage.getItem('keiner_feria_leads') || '[]');
      const nextNum = existingLeads.length + 1;
      const paddedNum = String(nextNum).padStart(5, '0');
      let ticketCode = `KR-2026-${paddedNum}`;

      const leadData = {
        id: Date.now().toString(),
        ticketCode: ticketCode,
        codigo_unico: ticketCode,
        timestamp: new Date().toISOString(),
        fechaLectura: new Date().toLocaleString('es-CL'),
        tipoContacto: tipoContacto,
        nombre: nombre,
        apellido: apellido,
        celular: celular,
        telefono: celular,
        email: email,
        empresa: empresa,
        categorias: categorias.length > 0 ? categorias.join(', ') : 'Ninguna',
        premio: categorias.length > 0 ? categorias.join(', ') : 'Ruleta Espacio Riesco',
        canjeado: 'NO',
        comentarios: comentarios
      };

      let assignedCode = ticketCode;

      try {
        const resPhp = await fetch('api-feria.php?action=save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData)
        });
        if (resPhp.ok) {
          const data = await resPhp.json();
          if (data.ok && data.ticketCode) {
            assignedCode = data.ticketCode;
            leadData.ticketCode = data.ticketCode;
            leadData.codigo_unico = data.ticketCode;
            if (mDisplayCode) mDisplayCode.textContent = data.ticketCode;
          }
          if (data.duplicate && data.message) {
            alert(data.message);
          }
        }
      } catch (ePhp) {
        try {
          const resApi = await fetch('/api/feria-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadData)
          });
          if (resApi.ok) {
            const data = await resApi.json();
            if (data.ok && data.ticketCode) {
              assignedCode = data.ticketCode;
              leadData.ticketCode = data.ticketCode;
              leadData.codigo_unico = data.ticketCode;
              if (mDisplayCode) mDisplayCode.textContent = data.ticketCode;
            }
            if (data.duplicate && data.message) {
              alert(data.message);
            }
          }
      const DEFAULT_SUPABASE_URL = 'https://xpafqyttugfomdtduxel.supabase.co';
      const DEFAULT_SUPABASE_KEY = 'sb_publishable_PCKzHqKbLQyv_nwnWKMw8g_qxA3WJZu';

      async function syncToSupabaseModal(lead) {
        const url = window.SUPABASE_URL || localStorage.getItem('supabase_url') || DEFAULT_SUPABASE_URL;
        const key = window.SUPABASE_KEY || localStorage.getItem('supabase_key') || DEFAULT_SUPABASE_KEY;
        if (!url || !key) return;

        try {
          await fetch(`${url.replace(/\/$/, '')}/rest/v1/LEADS_FERIA`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': key,
              'Authorization': `Bearer ${key}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              codigo_unico: lead.ticketCode || lead.codigo_unico,
              nombre: `${lead.nombre} ${lead.apellido || ''}`.trim(),
              telefono: lead.celular || lead.telefono || '',
              email: lead.email || '',
              empresa: lead.empresa || '',
              cargo: lead.tipoContacto || lead.cargo || 'CLIENTE',
              fecha_registro: lead.timestamp || new Date().toISOString(),
              premio: lead.categorias || lead.premio || 'Ruleta Espacio Riesco',
              canjeado: lead.canjeado || 'NO',
              observaciones: lead.comentarios || lead.observaciones || '',
              dispositivo: 'Móvil / Web Modal'
            })
          });
        } catch (e) {
          console.warn('[SUPABASE_SYNC_WARN]', e);
        }
      }

      // Supabase Direct Cloud Sync
      syncToSupabaseModal(leadData);

      try {
        const existing = JSON.parse(localStorage.getItem('keiner_feria_leads') || '[]');
        existing.unshift(leadData);
        localStorage.setItem('keiner_feria_leads', JSON.stringify(existing));
      } catch (err) {
        console.error('Error guardando localmente:', err);
      }

      // FormSubmit Dual Email Dispatch Backup (contacto@keiner.cl & domingo@keiner.cl)
      try {
        fetch('https://formsubmit.co/ajax/contacto@keiner.cl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _subject: `[NUEVO LEAD FERIA] Ticket ${assignedCode} - ${nombre} ${apellido}`,
            _cc: 'domingo@keiner.cl',
            _replyto: email || 'contacto@keiner.cl',
            Ticket: assignedCode,
            Perfil: tipoContacto,
            Nombre: `${nombre} ${apellido}`,
            Celular: celular,
            Email: email || 'No informado',
            Empresa: empresa || 'No informada',
            Categorias: categorias.length > 0 ? categorias.join(', ') : 'Ninguna',
            Comentarios: comentarios || 'Sin comentarios'
          })
        }).catch(err => console.warn('FormSubmit backup:', err));
      } catch(err) {}

      trackEvent('generate_lead', {
        form_name: 'feria_modal_lead',
        ticket_code: assignedCode,
        tipo_contacto: tipoContacto
      });

      if (mDisplayCode) mDisplayCode.textContent = assignedCode;
      if (mDisplayName) mDisplayName.textContent = `${nombre} ${apellido}`.trim();

      modalFeriaForm.style.display = 'none';
      if (modalTicketScreen) modalTicketScreen.style.display = 'block';
    });
  }

  if (btnModalReset) {
    btnModalReset.addEventListener('click', () => {
      if (modalFeriaForm) {
        modalFeriaForm.reset();
        modalFeriaForm.style.display = 'block';
      }
      if (modalTicketScreen) modalTicketScreen.style.display = 'none';
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

  // 9. Interactive Brand Showcase Banner Slider (Horizontal Track)
  const bannerSlider = document.getElementById('brandBannerSlider');
  const sliderTrack = document.getElementById('bannerSliderTrack');
  if (bannerSlider && sliderTrack) {
    const slides = bannerSlider.querySelectorAll('.banner-slide-card');
    const dots = bannerSlider.querySelectorAll('.banner-slider-dots .dot');
    const prevBtn = document.getElementById('bannerSliderPrev');
    const nextBtn = document.getElementById('bannerSliderNext');

    let currentSlide = 0;
    let autoSlideInterval = null;

    function goToSlide(index) {
      // Shift track horizontally (20% per slide)
      sliderTrack.style.transform = `translateX(-${index * 20}%)`;

      slides.forEach((slide, i) => {
        if (i === index) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });

      dots.forEach((dot, i) => {
        if (i === index) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });

      currentSlide = index;
    }

    function nextSlide() {
      const nextIndex = (currentSlide + 1) % slides.length;
      goToSlide(nextIndex);
    }

    function prevSlide() {
      const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
      goToSlide(prevIndex);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        trackEvent('banner_slider_nav', { dir: 'next', slide: currentSlide });
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        trackEvent('banner_slider_nav', { dir: 'prev', slide: currentSlide });
      });
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const index = parseInt(dot.dataset.index, 10);
        if (!isNaN(index)) {
          goToSlide(index);
          trackEvent('banner_slider_dot_click', { slide: index });
        }
      });
    });

    // Auto Play every 4.5 seconds
    function startAutoSlide() {
      stopAutoSlide();
      autoSlideInterval = setInterval(nextSlide, 4500);
    }

    function stopAutoSlide() {
      if (autoSlideInterval) clearInterval(autoSlideInterval);
    }

    startAutoSlide();

    bannerSlider.addEventListener('mouseenter', stopAutoSlide);
    bannerSlider.addEventListener('mouseleave', startAutoSlide);

    // Touch Swipe Support for Mobile Devices
    let touchStartX = 0;
    let touchEndX = 0;

    bannerSlider.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    bannerSlider.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 40) {
        nextSlide();
      } else if (touchEndX - touchStartX > 40) {
        prevSlide();
      }
    }, { passive: true });
  }
});
