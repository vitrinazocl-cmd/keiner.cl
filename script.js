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
  }
});
