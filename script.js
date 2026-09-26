/**
 * KEINER.CL ENTERPRISE - MOTOR INTERACTIVO 2026
 * Ecosistema Mayorista Digital de Alta Gama
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initScrollEffects();
  initCounters();
  initFintechDashboard();
  initVisualAISimulator();
  initCatalogFilters();
  initChileMap();
  initModals();
  initChatbot();
  initBrandsPage();
});

/* ==========================================================================
   1. MODO CLARO / OSCURO (THEME SWITCHER)
   ========================================================================== */
function initThemeToggle() {
  const themeBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('ahorra_theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  setTheme(savedTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    });
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('ahorra_theme', theme);
  const icon = document.querySelector('.theme-toggle-icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

/* ==========================================================================
   2. SCROLL EFFECTS & NAVBAR STICKY
   ========================================================================== */
function initScrollEffects() {
  const scrollProgress = document.getElementById('scroll-progress');
  const topbar = document.querySelector('.topbar');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;

    if (scrollProgress) {
      scrollProgress.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
    }

    if (topbar) {
      topbar.classList.toggle('is-scrolled', scrollTop > 20);
    }
  });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('is-open');
    });
  }

  // Reveal animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

/* ==========================================================================
   3. ANIMATED COUNTERS (KPIs)
   ========================================================================== */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
        entry.target.classList.add('counted');
        animateValue(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((c) => observer.observe(c));
}

function animateValue(obj) {
  const target = parseInt(obj.getAttribute('data-count'), 10);
  const prefix = obj.getAttribute('data-prefix') || '';
  const suffix = obj.getAttribute('data-suffix') || '';
  const duration = 1500;
  let startTimestamp = null;

  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * target);
    obj.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
    }
  };
  window.requestAnimationFrame(step);
}

/* ==========================================================================
   4. DASHBOARD INTERACTIVO FINTECH (CANVAS CHART)
   ========================================================================== */
function initFintechDashboard() {
  const canvas = document.getElementById('fintechChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let currentTab = 'inventario';

  const tabBtns = document.querySelectorAll('.dashboard-tab');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      currentTab = e.target.getAttribute('data-tab');
      drawChart(canvas, ctx, currentTab);
    });
  });

  // Responsive canvas resize
  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    drawChart(canvas, ctx, currentTab);
  }
  window.addEventListener('resize', resize);
  setTimeout(resize, 100);
}

function drawChart(canvas, ctx, tab) {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Background Grid Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let y = 40; y < h; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Data Datasets according to tab
  let dataPoints = [40, 65, 50, 85, 95, 70, 110, 130, 120, 150];
  if (tab === 'flujo') dataPoints = [20, 45, 60, 55, 80, 95, 90, 120, 140, 160];
  if (tab === 'rutas') dataPoints = [90, 85, 95, 98, 92, 99, 100, 97, 99, 100];
  if (tab === 'analytics') dataPoints = [15, 30, 45, 40, 65, 85, 95, 115, 135, 155];

  const stepX = w / (dataPoints.length - 1);
  const maxVal = 180;

  // Create Gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, 'rgba(0, 194, 255, 0.4)');
  gradient.addColorStop(1, 'rgba(0, 102, 255, 0.0)');

  // Draw Area Path
  ctx.beginPath();
  ctx.moveTo(0, h);
  dataPoints.forEach((val, i) => {
    const x = i * stepX;
    const y = h - (val / maxVal) * (h - 60);
    if (i === 0) ctx.lineTo(x, y);
    else {
      const prevX = (i - 1) * stepX;
      const prevY = h - (dataPoints[i - 1] / maxVal) * (h - 60);
      const cpX1 = prevX + stepX / 2;
      const cpY1 = prevY;
      const cpX2 = prevX + stepX / 2;
      const cpY2 = y;
      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x, y);
    }
  });
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw Line
  ctx.beginPath();
  dataPoints.forEach((val, i) => {
    const x = i * stepX;
    const y = h - (val / maxVal) * (h - 60);
    if (i === 0) ctx.moveTo(x, y);
    else {
      const prevX = (i - 1) * stepX;
      const prevY = h - (dataPoints[i - 1] / maxVal) * (h - 60);
      ctx.bezierCurveTo(prevX + stepX / 2, prevY, prevX + stepX / 2, y, x, y);
    }
  });
  ctx.strokeStyle = '#00C2FF';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Glowing Points
  dataPoints.forEach((val, i) => {
    const x = i * stepX;
    const y = h - (val / maxVal) * (h - 60);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#00D084';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

/* ==========================================================================
   5. VISUAL AI BLOOMBERG TERMINAL SIMULATOR
   ========================================================================== */
function initVisualAISimulator() {
  const storeSelect = document.getElementById('aiStoreSelect');
  const aiOutput = document.getElementById('aiTerminalOutput');

  if (!storeSelect || !aiOutput) return;

  const simulations = {
    minimarket: `> [AI-PREDICT] Analizando inventario Minimarket (80m² - RM)...
> FEFO Optimizer: Coincidencia de alta rotación en Lácteos y Bebidas (+22%).
> Sugerencia de compra: Reponer 15 cajas Bebidas 1.5L, 10 cajas Abarrotes Premium.
> Ahorro estimado mensual por compra mayorista consolidada: $340.000 CLP.
> Estado de crédito B2B activado: Hasta $5.000.000 a 30 días.`,
    almacen: `> [AI-PREDICT] Analizando Almacén de Barrio (50m² - Valparaíso)...
> Sugerencia de mix de productos de alta demanda regional.
> Stock recomendado: Cuidado personal y Snacks congelados.
> Retorno sobre inversión proyectado: +28% margen directo.
> Frecuencia de despacho optimizada: Martes y Jueves.`,
    supermercado: `> [AI-PREDICT] Analizando Red de Supermercados Regionales (3 Sucursales)...
> Integración directa ERP con API KEINER.CL Enterprise.
> Precios por volumen industrial: Descuento directo de fábrica 14.5%.
> Logística de palletizado completo con sello térmico.
> Ahorro proyectado mensual: $4.200.000 CLP.`
  };

  storeSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    aiOutput.textContent = 'Calculando modelos de machine learning...';
    setTimeout(() => {
      aiOutput.textContent = simulations[val] || simulations.minimarket;
    }, 400);
  });
}

/* ==========================================================================
   6. CATÁLOGO FILTERS & QUICK QUOTE
   ========================================================================== */
function initCatalogFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');

      productCards.forEach((card) => {
        if (cat === 'all' || card.getAttribute('data-category') === cat) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   7. MAPA LOGÍSTICO INTERACTIVO DE CHILE
   ========================================================================== */
function initChileMap() {
  const hubCards = document.querySelectorAll('.hub-info-card');
  hubCards.forEach((card) => {
    card.addEventListener('click', () => {
      hubCards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
    });
  });
}

/* ==========================================================================
   8. MODALES DE CONVERSIÓN & ASISTENCIA
   ========================================================================== */
function initModals() {
  const backdrops = document.querySelectorAll('.modal-backdrop');
  const closeBtns = document.querySelectorAll('.modal-close');

  // Trigger buttons
  document.querySelectorAll('[data-modal]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = trigger.getAttribute('data-modal');
      const modal = document.getElementById(targetId);
      if (modal) modal.classList.add('active');
    });
  });

  closeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      backdrops.forEach((b) => b.classList.remove('active'));
    });
  });

  backdrops.forEach((b) => {
    b.addEventListener('click', (e) => {
      if (e.target === b) b.classList.remove('active');
    });
  });
}

/* ==========================================================================
   9. CHATBOT IA ENTERPRISE WIDGET
   ========================================================================== */
function initChatbot() {
  const chatBtn = document.getElementById('floatAiChatBtn');
  const chatModal = document.getElementById('chatAiModal');
  const sendBtn = document.getElementById('sendChatMsg');
  const input = document.getElementById('chatInput');
  const messagesContainer = document.getElementById('chatMessages');

  if (!chatBtn || !chatModal) return;

  chatBtn.addEventListener('click', () => {
    chatModal.classList.toggle('active');
  });

  if (sendBtn && input && messagesContainer) {
    const handleSend = () => {
      const text = input.value.trim();
      if (!text) return;

      // Append user msg
      const userDiv = document.createElement('div');
      userDiv.style.margin = '8px 0';
      userDiv.style.textAlign = 'right';
      userDiv.innerHTML = `<span style="background:var(--secondary);color:#fff;padding:8px 14px;border-radius:12px;display:inline-block;font-size:0.875rem;">${text}</span>`;
      messagesContainer.appendChild(userDiv);

      input.value = '';
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Bot response simulation
      setTimeout(() => {
        const botDiv = document.createElement('div');
        botDiv.style.margin = '8px 0';
        botDiv.style.textAlign = 'left';
        botDiv.innerHTML = `<span style="background:var(--bg-elevated);color:var(--text-main);padding:8px 14px;border-radius:12px;display:inline-block;font-size:0.875rem;border:1px solid var(--border-light);">🤖 <strong>AhorraBot IA:</strong> Gracias por consultar. Un ejecutivo empresarial evaluará su requerimiento de abastecimiento para entregarle una cotización con descuento por volumen.</span>`;
        messagesContainer.appendChild(botDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 700);
    };

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }
}

/* ==========================================================================
   10. INTERACTIVIDAD PÁGINA DE MARCAS (TABS & BÚSQUEDA)
   ========================================================================== */
function initBrandsPage() {
  const brandTabs = document.querySelectorAll('#brandTabs .brand-tab-btn');
  const brandCards = document.querySelectorAll('.brand-card');
  const searchInput = document.getElementById('brandSearchInput');
  const countLabel = document.getElementById('brandCountLabel');

  if (!brandCards.length) return;

  // Detect URL parameter ?cat=abarrotes
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('cat');

  let activeCategory = catParam || 'all';

  // Activate tab from URL param
  if (catParam) {
    brandTabs.forEach((tab) => {
      if (tab.getAttribute('data-category') === catParam) {
        brandTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
      }
    });
  }

  function filterBrands() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let visibleCount = 0;

    brandCards.forEach((card) => {
      const cardCategory = card.getAttribute('data-category');
      const cardKeywords = (card.getAttribute('data-keywords') || '').toLowerCase();
      const cardTitle = card.querySelector('.brand-title')?.textContent.toLowerCase() || '';

      const matchesCategory = activeCategory === 'all' || cardCategory === activeCategory;
      const matchesSearch = !query || cardKeywords.includes(query) || cardTitle.includes(query);

      if (matchesCategory && matchesSearch) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });

    if (countLabel) {
      countLabel.innerHTML = `Mostrando <strong>${visibleCount} marca${visibleCount !== 1 ? 's' : ''}</strong> en el catálogo`;
    }
  }

  // Tab buttons click
  brandTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      brandTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.getAttribute('data-category');
      filterBrands();
    });
  });

  // Search input typing
  if (searchInput) {
    searchInput.addEventListener('input', filterBrands);
  }

  // Pass brand name to quote modal
  document.querySelectorAll('[data-modal="modalCotizacion"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const brandName = btn.getAttribute('data-brand');
      const modalBrandInput = document.getElementById('modalBrandInput');
      if (brandName && modalBrandInput) {
        modalBrandInput.value = brandName;
      }
    });
  });

  // Initial run
  filterBrands();
}

