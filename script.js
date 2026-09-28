document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Navigation Menu Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });

    // Close mobile menu when clicking outside or on a link
    document.addEventListener('click', (e) => {
      if (!mobileToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('show');
      }
    });
  }

  // 2. Topic Pills Selection in Contact Form
  const topicPills = document.querySelectorAll('.topic-pill');
  const selectedTopicInput = document.getElementById('selectedTopic');

  topicPills.forEach(pill => {
    pill.addEventListener('click', () => {
      topicPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      if (selectedTopicInput) {
        selectedTopicInput.value = pill.dataset.value || pill.textContent.trim();
      }
    });
  });

  // 3. Carousel Horizontal Scroll Buttons
  const sliderArrows = document.querySelectorAll('.slider-arrow');
  sliderArrows.forEach(arrow => {
    arrow.addEventListener('click', () => {
      const targetId = arrow.dataset.target;
      const direction = arrow.dataset.dir === 'next' ? 1 : -1;
      const targetGrid = document.getElementById(targetId);

      if (targetGrid) {
        const scrollAmount = 250 * direction;
        targetGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    });
  });

  // 4. Contact Form Handling
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Enviando...';
        submitBtn.disabled = true;

        setTimeout(() => {
          alert('¡Gracias por contactarnos! Tu mensaje ha sido enviado correctamente y un ejecutivo te responderá a la brevedad.');
          contactForm.reset();
          topicPills.forEach(p => p.classList.remove('active'));
          if (topicPills.length > 0) topicPills[0].classList.add('active');
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }, 1000);
      }
    });
  // 5. Meeting Bot Interactivity
  const botTrigger = document.getElementById('meetingBotTrigger');
  const botModal = document.getElementById('meetingBotModal');
  const botClose = document.getElementById('meetingBotClose');

  if (botTrigger && botModal) {
    botTrigger.addEventListener('click', () => {
      botModal.classList.toggle('active');
    });
  }

  if (botClose && botModal) {
    botClose.addEventListener('click', () => {
      botModal.classList.remove('active');
    });
  }

  // Meeting Bot Booking Form Logic
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
    });
  });

  botTimeSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      botTimeSlots.forEach(s => s.classList.remove('selected'));
      slot.classList.add('selected');
      selectedBotTime = slot.dataset.time || slot.textContent.trim();
      if (botStep3) botStep3.style.display = 'block';
    });
  });

  if (botBookingForm) {
    botBookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('botName')?.value || 'Cliente';
      const date = document.getElementById('botDate')?.value || 'Fecha seleccionada';
      
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
});
