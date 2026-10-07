/**
 * DarkSite - Interactive Website Logic
 * Smart Dark Mode & Reader Showcase
 */

document.addEventListener('DOMContentLoaded', () => {
  initSplitSlider();
  initDemoControls();
  initMockPopup();
  initCodeCopy();
  initPresets();
});

/**
 * 1. Split Screen Before / After Comparison Slider
 */
function initSplitSlider() {
  const container = document.getElementById('split-wrapper');
  const darkLayer = document.getElementById('split-dark-layer');
  const handle = document.getElementById('split-handle');

  if (!container || !darkLayer || !handle) return;

  let isDragging = false;

  function updateSliderPosition(clientX) {
    const rect = container.getBoundingClientRect();
    let x = clientX - rect.left;
    
    // Constrain within 5% to 95%
    const minX = rect.width * 0.05;
    const maxX = rect.width * 0.95;
    x = Math.max(minX, Math.min(x, maxX));

    const percentage = (x / rect.width) * 100;

    darkLayer.style.width = `${percentage}%`;
    handle.style.left = `${percentage}%`;
  }

  // Mouse Events
  handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    e.preventDefault();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateSliderPosition(e.clientX);
  });

  // Touch Events for Mobile
  handle.addEventListener('touchstart', (e) => {
    isDragging = true;
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || !e.touches[0]) return;
    updateSliderPosition(e.touches[0].clientX);
  });

  // Click on container moves slider directly
  container.addEventListener('click', (e) => {
    if (e.target.closest('#split-handle')) return;
    updateSliderPosition(e.clientX);
  });
}

/**
 * 2. Real-time Tuning Controls (Brightness, Contrast, Sepia)
 */
function initDemoControls() {
  const darkLayer = document.getElementById('split-dark-layer');
  const sliderContrast = document.getElementById('demo-contrast');
  const sliderBrightness = document.getElementById('demo-brightness');
  const sliderSepia = document.getElementById('demo-sepia');

  const valContrast = document.getElementById('demo-val-contrast');
  const valBrightness = document.getElementById('demo-val-brightness');
  const valSepia = document.getElementById('demo-val-sepia');

  function applyFilters() {
    if (!darkLayer) return;
    const c = sliderContrast ? sliderContrast.value : 100;
    const b = sliderBrightness ? sliderBrightness.value : 100;
    const s = sliderSepia ? sliderSepia.value : 0;

    if (valContrast) valContrast.textContent = `${c}%`;
    if (valBrightness) valBrightness.textContent = `${b}%`;
    if (valSepia) valSepia.textContent = `${s}%`;

    darkLayer.style.filter = `contrast(${c}%) brightness(${b}%) sepia(${s}%)`;

    // Also mirror to popup if present
    const popContrast = document.getElementById('mock-pop-contrast');
    const popBrightness = document.getElementById('mock-pop-brightness');
    const popSepia = document.getElementById('mock-pop-sepia');
    if (popContrast && popContrast.value != c) {
      popContrast.value = c;
      const t = document.getElementById('mock-val-contrast');
      if (t) t.textContent = `${c}%`;
    }
    if (popBrightness && popBrightness.value != b) {
      popBrightness.value = b;
      const t = document.getElementById('mock-val-brightness');
      if (t) t.textContent = `${b}%`;
    }
    if (popSepia && popSepia.value != s) {
      popSepia.value = s;
      const t = document.getElementById('mock-val-sepia');
      if (t) t.textContent = `${s}%`;
    }
  }

  if (sliderContrast) sliderContrast.addEventListener('input', applyFilters);
  if (sliderBrightness) sliderBrightness.addEventListener('input', applyFilters);
  if (sliderSepia) sliderSepia.addEventListener('input', applyFilters);
}

/**
 * 3. Presets Switcher (Blog Article, SaaS Dashboard, Developer Docs)
 */
const PRESETS = {
  article: {
    category: "Engenharia & Design",
    title: "Como a Inversão Inteligente Elimina a Fadiga Visual na Web",
    meta: "Publicado por Diego Alves • Tempo de leitura: 4 min",
    body: "Ao navegar pela web durante a madrugada, fundos 100% brancos emitem um brilho agressivo que sobrecarrega a retina. Extensões de inversão comum simplesmente invertem todas as cores em 180°, transformando fotos de pessoas em negativos assustadores e gráficos em tons bizarros.",
    body2: "Com o Smart Dark Mode, cada elemento HTML é avaliado dinamicamente. Os tons de fundo são mapeados para uma paleta escura harmônica, enquanto mídias e fotos permanecem completamente intocadas.",
    code: "// WCAG Relative Luminance Check\nfunction getLuminance(r, g, b) {\n  const [rs, gs, bs] = [r, g, b].map(c => {\n    c = c / 255;\n    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);\n  });\n  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;\n}",
    url: "https://tech-portal.dev/blog/smart-dark-mode"
  },
  dashboard: {
    category: "Analytics & Métricas",
    title: "Painel de Desempenho e Tráfego do Usuário",
    meta: "Tempo Real • Atualizado há 12 segundos",
    body: "Monitoramento de taxas de retenção, conversão e tempo de permanência em páginas noturnas. Usuários que utilizam modo escuro passam até 38% mais tempo lendo documentações sem cansaço visual.",
    body2: "Os cartões analíticos e bordas de tabelas recebem tratamento translúcido, mantendo hierarquia limpa e sem conflitos com temas do sistema operacional.",
    code: "const metrics = {\n  activeUsers: 14280,\n  readingTimeAvg: '14m 32s',\n  eyeStrainReport: '-84% de fadiga relatada',\n  wcagCompliance: 'AAA 4.5:1+'\n};",
    url: "https://analytics.internal/dashboard/metrics"
  },
  docs: {
    category: "Documentação de API",
    title: "Manifest V3 Service Worker Lifecycle & Registration",
    meta: "Guia de Arquitetura • v1.2.1",
    body: "No Google Chrome Manifest V3, o Service Worker é ativado sob demanda. Para garantir a eliminação total do flash branco, registramos o stylesheet base através da API chrome.scripting.registerContentScripts antes da renderização do DOM.",
    body2: "Em paralelo, um script leve no MAIN world escuta e intercepta shadow roots para aplicar a paleta até mesmo em Shadow DOM isolados de bibliotecas modernas.",
    code: "await chrome.scripting.registerContentScripts([{\n  id: 'sdm-base-css',\n  css: ['dark-theme.css'],\n  matches: ['<all_urls>'],\n  runAt: 'document_start',\n  allFrames: true\n}]);",
    url: "https://developer.chrome.com/docs/extensions/mv3"
  }
};

function initPresets() {
  const presetButtons = document.querySelectorAll('[data-preset]');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const presetKey = btn.dataset.preset;
      const data = PRESETS[presetKey];
      if (!data) return;

      // Update both light and dark layers
      ['light', 'dark'].forEach(variant => {
        const cat = document.getElementById(`mock-cat-${variant}`);
        const title = document.getElementById(`mock-title-${variant}`);
        const meta = document.getElementById(`mock-meta-${variant}`);
        const p1 = document.getElementById(`mock-p1-${variant}`);
        const p2 = document.getElementById(`mock-p2-${variant}`);
        const code = document.getElementById(`mock-code-${variant}`);

        if (cat) cat.textContent = data.category;
        if (title) title.textContent = data.title;
        if (meta) meta.textContent = data.meta;
        if (p1) p1.textContent = data.body;
        if (p2) p2.textContent = data.body2;
        if (code) code.textContent = data.code;
      });

      const urlEl = document.getElementById('preview-address-bar');
      if (urlEl) urlEl.textContent = data.url;

      const mockHost = document.getElementById('mock-site-hostname');
      if (mockHost) {
        try {
          const u = new URL(data.url);
          mockHost.textContent = u.hostname;
        } catch(e) {}
      }
    });
  });
}

/**
 * 4. Realistic Extension Mockup Interactivity
 */
function initMockPopup() {
  const masterSwitch = document.getElementById('mock-toggle-enabled');
  const btnSiteToggle = document.getElementById('mock-btn-toggle-site');
  const btnSiteIcon = document.getElementById('mock-btn-site-icon');
  const btnSiteText = document.getElementById('mock-btn-site-text');
  const darkLayer = document.getElementById('split-dark-layer');

  let siteDisabled = false;

  if (masterSwitch) {
    masterSwitch.addEventListener('change', (e) => {
      const isOn = e.target.checked;
      if (darkLayer) {
        darkLayer.style.display = isOn ? 'block' : 'none';
      }
      showToast(isOn ? '🌙 Modo escuro ativado globalmente' : '☀️ Modo escuro desativado');
    });
  }

  if (btnSiteToggle) {
    btnSiteToggle.addEventListener('click', () => {
      siteDisabled = !siteDisabled;
      if (siteDisabled) {
        btnSiteIcon.textContent = '✅';
        btnSiteText.textContent = 'Habilitar neste site';
        btnSiteToggle.style.borderColor = '#10b981';
        btnSiteToggle.style.color = '#34d399';
        if (darkLayer) darkLayer.style.opacity = '0.15';
        showToast('Site adicionado à lista de exclusão');
      } else {
        btnSiteIcon.textContent = '🚫';
        btnSiteText.textContent = 'Não aplicar neste site';
        btnSiteToggle.style.borderColor = '#374151';
        btnSiteToggle.style.color = '#e5e7eb';
        if (darkLayer) darkLayer.style.opacity = '1';
        showToast('Site removido da lista de exclusão');
      }
    });
  }

  // Sync sliders inside mock popup with top demo sliders
  const popSliders = [
    { popId: 'mock-pop-contrast', demoId: 'demo-contrast', valId: 'mock-val-contrast', suffix: '%' },
    { popId: 'mock-pop-brightness', demoId: 'demo-brightness', valId: 'mock-val-brightness', suffix: '%' },
    { popId: 'mock-pop-sepia', demoId: 'demo-sepia', valId: 'mock-val-sepia', suffix: '%' }
  ];

  popSliders.forEach(item => {
    const pEl = document.getElementById(item.popId);
    const dEl = document.getElementById(item.demoId);
    const vEl = document.getElementById(item.valId);

    if (pEl) {
      pEl.addEventListener('input', () => {
        if (vEl) vEl.textContent = `${pEl.value}${item.suffix}`;
        if (dEl) {
          dEl.value = pEl.value;
          dEl.dispatchEvent(new Event('input'));
        }
      });
    }
  });

  const btnReset = document.getElementById('mock-btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      const contrast = document.getElementById('demo-contrast');
      const brightness = document.getElementById('demo-brightness');
      const sepia = document.getElementById('demo-sepia');

      if (contrast) contrast.value = 100;
      if (brightness) brightness.value = 100;
      if (sepia) sepia.value = 0;

      if (contrast) contrast.dispatchEvent(new Event('input'));
      showToast('Ajustes manuais restaurados para o padrão');
    });
  }
}

/**
 * 5. One-Click Copy for Terminal / Installation Commands
 */
function initCodeCopy() {
  const copyButtons = document.querySelectorAll('[data-copy-target]');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.copyTarget;
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      const text = targetEl.textContent.trim();
      navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.textContent;
        btn.textContent = 'Copiado! ✓';
        btn.style.background = '#10b981';
        btn.style.color = '#ffffff';

        showToast(`Comando copiado: "${text.substring(0, 32)}..."`);

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.color = '';
        }, 2200);
      });
    });
  });
}

/**
 * Toast Notice System
 */
let toastTimeout;
function showToast(message) {
  let toast = document.getElementById('toast-notice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>✨</span> <span>${message}</span>`;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}
