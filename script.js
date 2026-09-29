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

  // 7. Feria Form Trigger & Conversion Tracking
  const botTrigger = document.getElementById('meetingBotTrigger');
  const botModal = document.getElementById('meetingBotModal');
  const botClose = document.getElementById('meetingBotClose');

  if (botTrigger) {
    botTrigger.addEventListener('click', (e) => {
      trackEvent('feria_button_click', { source: 'floating_widget' });
      // Native navigation to contactoevento.html handles redirect
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
      const nombre = document.getElementById('mNombre').value.trim();
      const apellido = document.getElementById('mApellido').value.trim();
      const celular = document.getElementById('mCelular').value.trim();

      if (!nombre || !apellido || !celular) {
        alert('Por favor completa los campos obligatorios: Nombre, Apellido y Celular.');
        return;
      }

      const tipoContacto = modalFeriaForm.querySelector('input[name="modalTipoContacto"]:checked')?.value || 'Cliente';
      const email = document.getElementById('mEmail').value.trim();
      const empresa = document.getElementById('mEmpresa').value.trim();
      const comentarios = document.getElementById('mComentarios').value.trim();

      const catEls = modalFeriaForm.querySelectorAll('input[name="mCat"]:checked');
      const categorias = Array.from(catEls).map(el => el.value);

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const ticketCode = `KNR-${randomNum}`;

      const leadData = {
        id: Date.now().toString(),
        ticketCode: ticketCode,
        timestamp: new Date().toISOString(),
        fechaLectura: new Date().toLocaleString('es-CL'),
        tipoContacto: tipoContacto,
        nombre: nombre,
        apellido: apellido,
        celular: celular,
        email: email,
        empresa: empresa,
        categorias: categorias.length > 0 ? categorias.join(', ') : 'Ninguna',
        comentarios: comentarios
      };

      try {
        const existing = JSON.parse(localStorage.getItem('keiner_feria_leads') || '[]');
        existing.unshift(leadData);
        localStorage.setItem('keiner_feria_leads', JSON.stringify(existing));
      } catch (err) {
        console.error('Error guardando localmente:', err);
      }

      try {
        fetch('/api/feria-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData)
        }).catch(err => console.warn('Servidor offline, guardado en localStorage', err));
      } catch (err) {}

      trackEvent('generate_lead', {
        form_name: 'feria_modal_lead',
        ticket_code: ticketCode,
        tipo_contacto: tipoContacto
      });

      if (mDisplayCode) mDisplayCode.textContent = ticketCode;
      if (mDisplayName) mDisplayName.textContent = `${nombre} ${apellido}`;

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
